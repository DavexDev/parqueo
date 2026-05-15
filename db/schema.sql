-- ============================================================
-- RDP S.A. — PARQUEOS ESQUIPULAS
-- Esquema Supabase (PostgreSQL + RLS)
-- v2.0 — Plataforma completa de marketplace de parqueos
-- ============================================================
-- Ejecutar en el SQL Editor de Supabase

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE rol_usuario       AS ENUM ('visitante', 'anfitrion', 'admin');
CREATE TYPE estado_parqueo    AS ENUM ('pendiente_aprobacion', 'activo', 'inactivo', 'rechazado', 'suspendido');
CREATE TYPE tipo_reserva      AS ENUM ('hora', 'dia');
CREATE TYPE estado_reserva    AS ENUM ('pendiente', 'confirmada', 'cancelada', 'finalizada', 'no_show');
CREATE TYPE metodo_pago       AS ENUM ('online', 'llegada', 'anticipo');
CREATE TYPE estado_pago       AS ENUM ('pendiente', 'procesando', 'completado', 'fallido', 'reembolsado');
CREATE TYPE tipo_membresia    AS ENUM ('basica', 'premium', 'enterprise');
CREATE TYPE estado_membresia  AS ENUM ('activa', 'expirada', 'cancelada');
CREATE TYPE estado_incidente  AS ENUM ('abierto', 'en_proceso', 'resuelto', 'cerrado');
CREATE TYPE tipo_incidente    AS ENUM ('dano_vehiculo', 'cobro_incorrecto', 'acceso_denegado', 'robo', 'acoso', 'espacio_ocupado', 'otro');
CREATE TYPE dia_semana        AS ENUM ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo');
CREATE TYPE tipo_notificacion AS ENUM ('reserva_nueva', 'reserva_confirmada', 'reserva_cancelada', 'pago_recibido', 'mensaje_nuevo', 'resena_nueva', 'incidente_nuevo', 'sistema');

-- ============================================================
-- profiles (extiende auth.users de Supabase)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre                TEXT NOT NULL,
  email                 TEXT NOT NULL,
  telefono              TEXT,
  rol                   rol_usuario NOT NULL DEFAULT 'visitante',
  foto_url              TEXT,
  bio                   TEXT,
  membresia_activa_id   UUID,
  esta_verificado       BOOLEAN DEFAULT false,
  push_token            TEXT,
  total_reservas        INT DEFAULT 0,
  total_parqueos        INT DEFAULT 0,
  calificacion_promedio DECIMAL(3,2),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX profiles_rol_idx   ON profiles(rol);
CREATE INDEX profiles_email_idx ON profiles(email);

-- ============================================================
-- vehicle_types
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicle_types (
  id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL UNIQUE,
  icono  TEXT
);
INSERT INTO vehicle_types (nombre, icono) VALUES
  ('Moto',      'bi-bicycle'),
  ('Carro',     'bi-car-front-fill'),
  ('Pickup',    'bi-truck'),
  ('Microbus',  'bi-bus-front-fill'),
  ('Camioneta', 'bi-truck-flatbed'),
  ('Bicicleta', 'bi-bicycle')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- parkings
-- ============================================================
CREATE TABLE IF NOT EXISTS parkings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anfitrion_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nombre                TEXT NOT NULL,
  descripcion           TEXT,
  direccion             TEXT NOT NULL,
  referencia            TEXT,
  lat                   DECIMAL(10,8),
  lng                   DECIMAL(11,8),
  capacidad             INT NOT NULL DEFAULT 1 CHECK (capacidad > 0),
  precio_hora           DECIMAL(10,2),
  precio_dia            DECIMAL(10,2),
  reglas                TEXT,
  nivel_seguridad       INT CHECK (nivel_seguridad BETWEEN 1 AND 5),
  estado                estado_parqueo NOT NULL DEFAULT 'pendiente_aprobacion',
  is_featured           BOOLEAN DEFAULT false,
  is_premium            BOOLEAN DEFAULT false,
  aprobado_por          UUID REFERENCES profiles(id),
  aprobado_at           TIMESTAMPTZ,
  motivo_rechazo        TEXT,
  total_reservas        INT DEFAULT 0,
  calificacion_promedio DECIMAL(3,2),
  total_resenas         INT DEFAULT 0,
  deleted_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX parkings_anfitrion_idx ON parkings(anfitrion_id);
CREATE INDEX parkings_estado_idx    ON parkings(estado);
CREATE INDEX parkings_geo_idx       ON parkings(lat, lng);
CREATE INDEX parkings_nombre_trgm   ON parkings USING GIN (nombre gin_trgm_ops);
CREATE INDEX parkings_deleted_idx   ON parkings(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================
-- parking_vehicle_types
-- ============================================================
CREATE TABLE IF NOT EXISTS parking_vehicle_types (
  parking_id      UUID REFERENCES parkings(id) ON DELETE CASCADE,
  vehicle_type_id UUID REFERENCES vehicle_types(id) ON DELETE CASCADE,
  PRIMARY KEY (parking_id, vehicle_type_id)
);

-- ============================================================
-- parking_photos
-- ============================================================
CREATE TABLE IF NOT EXISTS parking_photos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parking_id   UUID NOT NULL REFERENCES parkings(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  storage_path TEXT,
  orden        INT DEFAULT 0,
  es_principal BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX parking_photos_parking_idx ON parking_photos(parking_id);

-- ============================================================
-- parking_schedules
-- ============================================================
CREATE TABLE IF NOT EXISTS parking_schedules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parking_id  UUID NOT NULL REFERENCES parkings(id) ON DELETE CASCADE,
  dia_semana  dia_semana NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin    TIME NOT NULL,
  UNIQUE (parking_id, dia_semana)
);
CREATE INDEX parking_schedules_parking_idx ON parking_schedules(parking_id);

-- ============================================================
-- reservations
-- ============================================================
CREATE TABLE IF NOT EXISTS reservations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parking_id          UUID NOT NULL REFERENCES parkings(id),
  usuario_id          UUID NOT NULL REFERENCES profiles(id),
  tipo                tipo_reserva NOT NULL,
  fecha_inicio        TIMESTAMPTZ NOT NULL,
  fecha_fin           TIMESTAMPTZ NOT NULL,
  estado              estado_reserva NOT NULL DEFAULT 'pendiente',
  codigo_reserva      TEXT UNIQUE NOT NULL DEFAULT upper(substring(uuid_generate_v4()::text, 1, 8)),
  metodo_pago         metodo_pago NOT NULL DEFAULT 'llegada',
  precio_unitario     DECIMAL(10,2) NOT NULL,
  cantidad_unidades   INT NOT NULL DEFAULT 1,
  precio_subtotal     DECIMAL(10,2) NOT NULL,
  descuento           DECIMAL(10,2) DEFAULT 0,
  precio_total        DECIMAL(10,2) NOT NULL,
  porcentaje_comision DECIMAL(5,2) DEFAULT 17.00,
  comision_rdp        DECIMAL(10,2),
  monto_anfitrion     DECIMAL(10,2),
  vehiculo_placa      TEXT,
  vehiculo_tipo       TEXT,
  vehiculo_color      TEXT,
  notas_usuario       TEXT,
  notas_anfitrion     TEXT,
  confirmada_at       TIMESTAMPTZ,
  cancelada_at        TIMESTAMPTZ,
  finalizada_at       TIMESTAMPTZ,
  motivo_cancelacion  TEXT,
  cancelada_por       UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT reserva_fechas_validas CHECK (fecha_fin > fecha_inicio)
);
CREATE INDEX reservations_parking_idx ON reservations(parking_id);
CREATE INDEX reservations_usuario_idx ON reservations(usuario_id);
CREATE INDEX reservations_estado_idx  ON reservations(estado);
CREATE INDEX reservations_fechas_idx  ON reservations(fecha_inicio, fecha_fin);
CREATE INDEX reservations_codigo_idx  ON reservations(codigo_reserva);

-- ============================================================
-- payments
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reserva_id UUID NOT NULL REFERENCES reservations(id),
  monto      DECIMAL(10,2) NOT NULL,
  metodo     metodo_pago NOT NULL,
  estado     estado_pago NOT NULL DEFAULT 'pendiente',
  referencia TEXT,
  proveedor  TEXT,
  metadata   JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX payments_reserva_idx ON payments(reserva_id);
CREATE INDEX payments_estado_idx  ON payments(estado);

-- ============================================================
-- commissions
-- ============================================================
CREATE TABLE IF NOT EXISTS commissions (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reserva_id         UUID NOT NULL UNIQUE REFERENCES reservations(id),
  anfitrion_id       UUID NOT NULL REFERENCES profiles(id),
  precio_total       DECIMAL(10,2) NOT NULL,
  porcentaje         DECIMAL(5,2) NOT NULL DEFAULT 17.00,
  monto_comision     DECIMAL(10,2) NOT NULL,
  monto_anfitrion    DECIMAL(10,2) NOT NULL,
  estado_liquidacion TEXT DEFAULT 'pendiente',
  liquidado_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX commissions_anfitrion_idx ON commissions(anfitrion_id);

-- ============================================================
-- ratings
-- ============================================================
CREATE TABLE IF NOT EXISTS ratings (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reserva_id           UUID NOT NULL UNIQUE REFERENCES reservations(id),
  usuario_id           UUID NOT NULL REFERENCES profiles(id),
  parking_id           UUID NOT NULL REFERENCES parkings(id),
  estrellas            INT NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
  comentario           TEXT,
  estrellas_limpieza   INT CHECK (estrellas_limpieza BETWEEN 1 AND 5),
  estrellas_seguridad  INT CHECK (estrellas_seguridad BETWEEN 1 AND 5),
  estrellas_acceso     INT CHECK (estrellas_acceso BETWEEN 1 AND 5),
  aprobado             BOOLEAN DEFAULT true,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ratings_parking_idx ON ratings(parking_id);
CREATE INDEX ratings_usuario_idx ON ratings(usuario_id);

-- ============================================================
-- memberships
-- ============================================================
CREATE TABLE IF NOT EXISTS memberships (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anfitrion_id          UUID NOT NULL REFERENCES profiles(id),
  tipo                  tipo_membresia NOT NULL DEFAULT 'basica',
  precio                DECIMAL(10,2) NOT NULL,
  estado                estado_membresia NOT NULL DEFAULT 'activa',
  fecha_inicio          DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin             DATE NOT NULL,
  max_parqueos          INT,
  sin_comision          BOOLEAN DEFAULT false,
  comision_rdp          DECIMAL(5,2) DEFAULT 17.00,
  soporte_prioritario   BOOLEAN DEFAULT false,
  analiticas_avanzadas  BOOLEAN DEFAULT false,
  payment_id            UUID REFERENCES payments(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX memberships_anfitrion_idx ON memberships(anfitrion_id);
CREATE INDEX memberships_estado_idx    ON memberships(estado);

ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_membresia
  FOREIGN KEY (membresia_activa_id)
  REFERENCES memberships(id)
  ON DELETE SET NULL;

-- ============================================================
-- featured_spaces
-- ============================================================
CREATE TABLE IF NOT EXISTS featured_spaces (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parking_id   UUID NOT NULL REFERENCES parkings(id) ON DELETE CASCADE,
  fecha_inicio DATE NOT NULL,
  fecha_fin    DATE NOT NULL,
  precio       DECIMAL(10,2) NOT NULL,
  estado       TEXT DEFAULT 'activo',
  payment_id   UUID REFERENCES payments(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT featured_fechas_validas CHECK (fecha_fin >= fecha_inicio)
);
CREATE INDEX featured_spaces_parking_idx ON featured_spaces(parking_id);
CREATE INDEX featured_spaces_fechas_idx  ON featured_spaces(fecha_inicio, fecha_fin);

-- ============================================================
-- local_advertising
-- ============================================================
CREATE TABLE IF NOT EXISTS local_advertising (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_nombre  TEXT NOT NULL,
  contacto_nombre TEXT,
  contacto_email  TEXT,
  imagen_url      TEXT NOT NULL,
  url_destino     TEXT,
  descripcion     TEXT,
  fecha_inicio    DATE NOT NULL,
  fecha_fin       DATE NOT NULL,
  precio          DECIMAL(10,2) NOT NULL,
  activo          BOOLEAN DEFAULT true,
  impresiones     INT DEFAULT 0,
  clics           INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT ads_fechas_validas CHECK (fecha_fin >= fecha_inicio)
);

-- ============================================================
-- incidents
-- ============================================================
CREATE TABLE IF NOT EXISTS incidents (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id    UUID NOT NULL REFERENCES profiles(id),
  parking_id     UUID REFERENCES parkings(id),
  reserva_id     UUID REFERENCES reservations(id),
  tipo           tipo_incidente NOT NULL,
  descripcion    TEXT NOT NULL,
  evidencia_urls TEXT[],
  estado         estado_incidente NOT NULL DEFAULT 'abierto',
  prioridad      INT DEFAULT 2 CHECK (prioridad BETWEEN 1 AND 5),
  asignado_a     UUID REFERENCES profiles(id),
  resolucion     TEXT,
  resuelto_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX incidents_reporter_idx ON incidents(reporter_id);
CREATE INDEX incidents_parking_idx  ON incidents(parking_id);
CREATE INDEX incidents_estado_idx   ON incidents(estado);

-- ============================================================
-- notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipo            tipo_notificacion NOT NULL,
  titulo          TEXT NOT NULL,
  cuerpo          TEXT NOT NULL,
  leido           BOOLEAN DEFAULT false,
  referencia_id   UUID,
  referencia_tipo TEXT,
  fcm_enviado     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX notifications_usuario_idx ON notifications(usuario_id);
CREATE INDEX notifications_leido_idx   ON notifications(usuario_id, leido);

-- ============================================================
-- messages
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id   UUID NOT NULL REFERENCES profiles(id),
  receiver_id UUID NOT NULL REFERENCES profiles(id),
  reserva_id  UUID REFERENCES reservations(id),
  contenido   TEXT NOT NULL,
  leido       BOOLEAN DEFAULT false,
  leido_at    TIMESTAMPTZ,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX messages_sender_idx   ON messages(sender_id);
CREATE INDEX messages_receiver_idx ON messages(receiver_id);
CREATE INDEX messages_chat_idx     ON messages(sender_id, receiver_id, created_at DESC);

-- ============================================================
-- admin_activity_log
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id   UUID NOT NULL REFERENCES profiles(id),
  accion     TEXT NOT NULL,
  entidad    TEXT NOT NULL,
  entidad_id UUID,
  detalles   JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX admin_log_admin_idx ON admin_activity_log(admin_id);
CREATE INDEX admin_log_fecha_idx ON admin_activity_log(created_at DESC);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated    BEFORE UPDATE ON profiles    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_parkings_updated    BEFORE UPDATE ON parkings    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_reservations_updated BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_updated    BEFORE UPDATE ON payments    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_memberships_updated BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_incidents_updated   BEFORE UPDATE ON incidents   FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-crear profile al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, nombre, email, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'rol')::rol_usuario, 'visitante')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Calcular comisión 17% al confirmar reserva
CREATE OR REPLACE FUNCTION calculate_commission()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.estado = 'confirmada' AND OLD.estado = 'pendiente' THEN
    INSERT INTO commissions (reserva_id, anfitrion_id, precio_total, porcentaje, monto_comision, monto_anfitrion)
    SELECT NEW.id, p.anfitrion_id, NEW.precio_total, NEW.porcentaje_comision,
      ROUND(NEW.precio_total * NEW.porcentaje_comision / 100, 2),
      ROUND(NEW.precio_total * (100 - NEW.porcentaje_comision) / 100, 2)
    FROM parkings p WHERE p.id = NEW.parking_id
    ON CONFLICT (reserva_id) DO NOTHING;
    UPDATE reservations SET
      comision_rdp    = ROUND(NEW.precio_total * NEW.porcentaje_comision / 100, 2),
      monto_anfitrion = ROUND(NEW.precio_total * (100 - NEW.porcentaje_comision) / 100, 2),
      confirmada_at   = NOW()
    WHERE id = NEW.id;
  END IF;
  IF NEW.estado = 'cancelada' THEN
    UPDATE reservations SET cancelada_at = NOW() WHERE id = NEW.id;
  END IF;
  IF NEW.estado = 'finalizada' THEN
    UPDATE reservations SET finalizada_at = NOW() WHERE id = NEW.id;
    UPDATE parkings SET total_reservas = total_reservas + 1 WHERE id = NEW.parking_id;
    UPDATE profiles SET total_reservas = total_reservas + 1 WHERE id = NEW.usuario_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_reserva_estado
  AFTER UPDATE OF estado ON reservations
  FOR EACH ROW EXECUTE FUNCTION calculate_commission();

-- Actualizar calificación promedio del parqueo
CREATE OR REPLACE FUNCTION update_parking_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE parkings SET
    calificacion_promedio = (SELECT ROUND(AVG(estrellas)::NUMERIC, 2) FROM ratings WHERE parking_id = NEW.parking_id AND aprobado = true),
    total_resenas = (SELECT COUNT(*) FROM ratings WHERE parking_id = NEW.parking_id AND aprobado = true)
  WHERE id = NEW.parking_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_rating_inserted
  AFTER INSERT OR UPDATE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_parking_rating();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE parkings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_photos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_schedules     ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_vehicle_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships           ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_spaces       ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_advertising     ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log    ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin');
$$;
CREATE OR REPLACE FUNCTION is_host()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('anfitrion', 'admin'));
$$;

-- profiles
CREATE POLICY "profiles_public_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own"    ON profiles FOR UPDATE USING (id = auth.uid());
-- parkings
CREATE POLICY "parkings_public_read"   ON parkings FOR SELECT USING (estado = 'activo' AND deleted_at IS NULL);
CREATE POLICY "parkings_host_read_own" ON parkings FOR SELECT USING (anfitrion_id = auth.uid());
CREATE POLICY "parkings_admin_all"     ON parkings FOR ALL  USING (is_admin());
CREATE POLICY "parkings_host_insert"   ON parkings FOR INSERT WITH CHECK (anfitrion_id = auth.uid() AND is_host());
CREATE POLICY "parkings_host_update"   ON parkings FOR UPDATE USING (anfitrion_id = auth.uid());
-- parking_photos
CREATE POLICY "photos_public_read" ON parking_photos FOR SELECT USING (true);
CREATE POLICY "photos_host_manage" ON parking_photos FOR ALL USING (EXISTS (SELECT 1 FROM parkings WHERE id = parking_id AND anfitrion_id = auth.uid()));
CREATE POLICY "photos_admin_all"   ON parking_photos FOR ALL USING (is_admin());
-- parking_schedules & vehicle_types
CREATE POLICY "schedules_public_read" ON parking_schedules     FOR SELECT USING (true);
CREATE POLICY "schedules_host_manage" ON parking_schedules     FOR ALL    USING (EXISTS (SELECT 1 FROM parkings WHERE id = parking_id AND anfitrion_id = auth.uid()));
CREATE POLICY "vtypes_public"         ON parking_vehicle_types FOR SELECT USING (true);
CREATE POLICY "vtypes_host"           ON parking_vehicle_types FOR ALL    USING (EXISTS (SELECT 1 FROM parkings WHERE id = parking_id AND anfitrion_id = auth.uid()));
-- reservations
CREATE POLICY "reservations_user_own"    ON reservations FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "reservations_host_own"    ON reservations FOR SELECT USING (EXISTS (SELECT 1 FROM parkings WHERE id = parking_id AND anfitrion_id = auth.uid()));
CREATE POLICY "reservations_admin_all"   ON reservations FOR ALL    USING (is_admin());
CREATE POLICY "reservations_user_create" ON reservations FOR INSERT WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "reservations_user_cancel" ON reservations FOR UPDATE USING (usuario_id = auth.uid() AND estado IN ('pendiente', 'confirmada'));
CREATE POLICY "reservations_host_update" ON reservations FOR UPDATE USING (EXISTS (SELECT 1 FROM parkings WHERE id = parking_id AND anfitrion_id = auth.uid()));
-- payments
CREATE POLICY "payments_user_own"  ON payments FOR SELECT USING (EXISTS (SELECT 1 FROM reservations WHERE id = reserva_id AND usuario_id = auth.uid()));
CREATE POLICY "payments_admin_all" ON payments FOR ALL    USING (is_admin());
-- commissions
CREATE POLICY "commissions_host_own"  ON commissions FOR SELECT USING (anfitrion_id = auth.uid());
CREATE POLICY "commissions_admin_all" ON commissions FOR ALL    USING (is_admin());
-- ratings
CREATE POLICY "ratings_public_read" ON ratings FOR SELECT USING (aprobado = true);
CREATE POLICY "ratings_user_own"    ON ratings FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "ratings_user_create" ON ratings FOR INSERT WITH CHECK (
  usuario_id = auth.uid() AND
  EXISTS (SELECT 1 FROM reservations WHERE id = reserva_id AND usuario_id = auth.uid() AND estado = 'finalizada')
);
CREATE POLICY "ratings_admin_all"   ON ratings FOR ALL USING (is_admin());
-- memberships
CREATE POLICY "memberships_host_own"  ON memberships FOR SELECT USING (anfitrion_id = auth.uid());
CREATE POLICY "memberships_admin_all" ON memberships FOR ALL    USING (is_admin());
-- featured_spaces
CREATE POLICY "featured_public_read" ON featured_spaces  FOR SELECT USING (estado = 'activo');
CREATE POLICY "featured_admin_all"   ON featured_spaces  FOR ALL    USING (is_admin());
-- local_advertising
CREATE POLICY "ads_public_read" ON local_advertising FOR SELECT USING (activo = true);
CREATE POLICY "ads_admin_all"   ON local_advertising FOR ALL    USING (is_admin());
-- incidents
CREATE POLICY "incidents_reporter_own" ON incidents FOR SELECT USING (reporter_id = auth.uid());
CREATE POLICY "incidents_host_own"     ON incidents FOR SELECT USING (EXISTS (SELECT 1 FROM parkings WHERE id = parking_id AND anfitrion_id = auth.uid()));
CREATE POLICY "incidents_user_create"  ON incidents FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "incidents_admin_all"    ON incidents FOR ALL    USING (is_admin());
-- notifications
CREATE POLICY "notifications_own"       ON notifications FOR ALL USING (usuario_id = auth.uid());
CREATE POLICY "notifications_admin_all" ON notifications FOR ALL USING (is_admin());
-- messages
CREATE POLICY "messages_own"    ON messages FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "messages_create" ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "messages_admin_all" ON messages FOR ALL USING (is_admin());
-- admin_activity_log
CREATE POLICY "admin_log_read"   ON admin_activity_log FOR SELECT USING (is_admin());
CREATE POLICY "admin_log_insert" ON admin_activity_log FOR INSERT WITH CHECK (is_admin());

-- ============================================================
-- VISTAS
-- ============================================================
CREATE OR REPLACE VIEW parkings_with_host AS
SELECT p.*,
  pr.nombre     AS anfitrion_nombre,
  pr.telefono   AS anfitrion_telefono,
  pr.foto_url   AS anfitrion_foto,
  (SELECT url FROM parking_photos WHERE parking_id = p.id AND es_principal = true LIMIT 1) AS foto_principal,
  (SELECT ARRAY_AGG(vt.nombre) FROM parking_vehicle_types pvt JOIN vehicle_types vt ON pvt.vehicle_type_id = vt.id WHERE pvt.parking_id = p.id) AS tipos_vehiculo
FROM parkings p JOIN profiles pr ON p.anfitrion_id = pr.id
WHERE p.deleted_at IS NULL;

CREATE OR REPLACE VIEW admin_metrics AS
SELECT
  (SELECT COUNT(*) FROM parkings WHERE deleted_at IS NULL)                                     AS total_parqueos,
  (SELECT COUNT(*) FROM parkings WHERE estado = 'activo' AND deleted_at IS NULL)               AS parqueos_activos,
  (SELECT COUNT(*) FROM parkings WHERE estado = 'pendiente_aprobacion' AND deleted_at IS NULL) AS parqueos_pendientes,
  (SELECT COUNT(*) FROM profiles WHERE rol = 'visitante')                                       AS total_visitantes,
  (SELECT COUNT(*) FROM profiles WHERE rol = 'anfitrion')                                       AS total_anfitriones,
  (SELECT COUNT(*) FROM reservations)                                                            AS total_reservas,
  (SELECT COUNT(*) FROM reservations WHERE estado = 'confirmada')                               AS reservas_activas,
  (SELECT COALESCE(SUM(monto_comision), 0) FROM commissions)                                    AS ingresos_rdp_total,
  (SELECT COALESCE(SUM(monto_comision), 0) FROM commissions WHERE created_at >= date_trunc('month', NOW())) AS ingresos_rdp_mes,
  (SELECT COUNT(*) FROM incidents WHERE estado = 'abierto')                                     AS incidentes_abiertos;

-- ============================================================
-- STORAGE BUCKETS (crear en el dashboard de Supabase)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('parkings',  'parkings',  true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars',   'avatars',   true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('ads',       'ads',       true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('incidents', 'incidents', false);
