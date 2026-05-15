-- ============================================================
-- RDP S.A. — SEED DE PRUEBA v1.0
-- Esquipulas, Guatemala — Mayo 2026
--
-- ¡SOLO PARA DESARROLLO / STAGING!
-- NO ejecutar en producción con datos reales.
--
-- Crea:
--   - 5 usuarios  -> 1 admin | 2 anfitriones | 2 visitantes
--   - 5 parqueos  -> 3 de Roberto, 2 de Ana
--   - 5 reservas  -> varios estados
--   - 2 resenas
--   - 5 mensajes
--   - Horarios, tipos de vehiculo y notificaciones
--
-- Contraseña de TODOS los usuarios de prueba: Test1234!
--
-- Credenciales:
--   admin@rdp.gt          (admin)
--   roberto.mendez@test.gt (anfitrión)
--   ana.fuentes@test.gt   (anfitrión)
--   juan.ortiz@test.gt    (visitante)
--   maria.lopez@test.gt   (visitante)
-- ============================================================

-- ============================================================
-- 1. USUARIOS EN AUTH.USERS
--    El trigger handle_new_user crea profiles automáticamente
--    usando raw_user_meta_data->>'nombre' y ->>'rol'
-- ============================================================
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, created_at, updated_at
)
VALUES
  -- Admin
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated',
    'admin@rdp.gt',
    crypt('Test1234!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"nombre":"Carlos Monterroso","rol":"admin"}',
    false, NOW(), NOW()
  ),
  -- Anfitrión 1
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000002',
    'authenticated', 'authenticated',
    'roberto.mendez@test.gt',
    crypt('Test1234!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"nombre":"Roberto Méndez","rol":"anfitrion"}',
    false, NOW() - INTERVAL '60 days', NOW()
  ),
  -- Anfitrión 2
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000003',
    'authenticated', 'authenticated',
    'ana.fuentes@test.gt',
    crypt('Test1234!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"nombre":"Ana Fuentes","rol":"anfitrion"}',
    false, NOW() - INTERVAL '45 days', NOW()
  ),
  -- Visitante 1
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000004',
    'authenticated', 'authenticated',
    'juan.ortiz@test.gt',
    crypt('Test1234!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"nombre":"Juan Ortiz","rol":"visitante"}',
    false, NOW() - INTERVAL '30 days', NOW()
  ),
  -- Visitante 2
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000005',
    'authenticated', 'authenticated',
    'maria.lopez@test.gt',
    crypt('Test1234!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"nombre":"María López","rol":"visitante"}',
    false, NOW() - INTERVAL '20 days', NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 1b. IDENTIDADES EN AUTH.IDENTITIES
--     Requerido para que Supabase pueda autenticar vía email/password.
--     Sin este INSERT el login devuelve "Database error querying schema".
-- ============================================================
INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'admin@rdp.gt',
    'a0000000-0000-0000-0000-000000000001',
    '{"sub":"a0000000-0000-0000-0000-000000000001","email":"admin@rdp.gt","email_verified":true,"phone_verified":false}',
    'email', NOW(), NOW(), NOW()
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'roberto.mendez@test.gt',
    'a0000000-0000-0000-0000-000000000002',
    '{"sub":"a0000000-0000-0000-0000-000000000002","email":"roberto.mendez@test.gt","email_verified":true,"phone_verified":false}',
    'email', NOW(), NOW(), NOW()
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    'ana.fuentes@test.gt',
    'a0000000-0000-0000-0000-000000000003',
    '{"sub":"a0000000-0000-0000-0000-000000000003","email":"ana.fuentes@test.gt","email_verified":true,"phone_verified":false}',
    'email', NOW(), NOW(), NOW()
  ),
  (
    'a0000000-0000-0000-0000-000000000004',
    'juan.ortiz@test.gt',
    'a0000000-0000-0000-0000-000000000004',
    '{"sub":"a0000000-0000-0000-0000-000000000004","email":"juan.ortiz@test.gt","email_verified":true,"phone_verified":false}',
    'email', NOW(), NOW(), NOW()
  ),
  (
    'a0000000-0000-0000-0000-000000000005',
    'maria.lopez@test.gt',
    'a0000000-0000-0000-0000-000000000005',
    '{"sub":"a0000000-0000-0000-0000-000000000005","email":"maria.lopez@test.gt","email_verified":true,"phone_verified":false}',
    'email', NOW(), NOW(), NOW()
  )
ON CONFLICT (provider, provider_id) DO NOTHING;

-- ============================================================
-- 2. COMPLEMENTAR PROFILES (sin tocar 'rol' para evitar el
--    trigger prevent_role_escalation)
-- ============================================================
UPDATE profiles SET
  telefono        = '5512-3456',
  bio             = 'Administrador del sistema RDP Parqueos Esquipulas.',
  esta_verificado = true
WHERE id = 'a0000000-0000-0000-0000-000000000001';

UPDATE profiles SET
  telefono        = '4456-7890',
  bio             = 'Propietario de parqueos en el centro de Esquipulas. 3 espacios disponibles.',
  esta_verificado = true,
  total_parqueos  = 3
WHERE id = 'a0000000-0000-0000-0000-000000000002';

UPDATE profiles SET
  telefono        = '3398-1234',
  bio             = 'Anfitriona con parqueos cerca de la Basílica. Servicio de calidad garantizado.',
  esta_verificado = true,
  total_parqueos  = 2
WHERE id = 'a0000000-0000-0000-0000-000000000003';

UPDATE profiles SET
  telefono = '5567-8901'
WHERE id = 'a0000000-0000-0000-0000-000000000004';

UPDATE profiles SET
  telefono = '4423-5678'
WHERE id = 'a0000000-0000-0000-0000-000000000005';

-- ============================================================
-- 3. PARQUEOS (5 total — todos activos)
-- ============================================================
INSERT INTO parkings (
  id, anfitrion_id, nombre, descripcion, direccion, referencia,
  lat, lng, capacidad, precio_hora, precio_dia,
  reglas, nivel_seguridad, estado, is_featured,
  aprobado_por, aprobado_at
) VALUES
  -- Parqueos de Roberto Méndez (3)
  (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'Parqueo Los Olivos',
    'Parqueo techado a media cuadra de la Basílica del Cristo Negro. Vigilancia 24 horas.',
    'Calle Real 2-45, Zona 1, Esquipulas',
    'Frente a la Farmacia Galeno, portón azul',
    14.76300, -89.35400,
    8, 15.00, 120.00,
    'No se permite música. Máximo 2 vehículos por espacio. Guardar silencio después de las 10pm.',
    4, 'activo', true,
    'a0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '50 days'
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'Parqueo Vista al Cristo',
    'Parqueo con vista directa a la Basílica. Ideal para visitantes y peregrinos.',
    '1ra. Avenida 3-12, Zona 1, Esquipulas',
    'Diagonal a la entrada principal de la Basílica',
    14.76400, -89.35350,
    6, 15.00, 120.00,
    'Respeto a los peregrinos. Prohibido lavar vehículos. Salida máxima 11pm.',
    5, 'activo', true,
    'a0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '48 days'
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000002',
    'Parqueo El Pedregal',
    'Espacio amplio para vehículos de carga y pickup. Fácil acceso desde la carretera.',
    'Calle El Calvario 1-89, Zona 2, Esquipulas',
    'A 200m del mercado municipal, esquina',
    14.76200, -89.35550,
    4, 15.00, NULL,
    'Solo tipo hora. Permitido pickup y camioneta. Patio al aire libre.',
    3, 'activo', false,
    'a0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '40 days'
  ),
  -- Parqueos de Ana Fuentes (2)
  (
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000003',
    'Parqueo Central Esquipulas',
    'El parqueo más grande del centro. Capacidad para 10 vehículos. Cámaras de seguridad.',
    '2da. Calle 5-23, Zona 1, Esquipulas',
    'Contiguo al Banco Industrial, a 1 cuadra del parque',
    14.76500, -89.35200,
    10, 15.00, 120.00,
    'Prohibido estacionarse en doble fila. Respetar señalizaciones. No dejar objetos de valor visibles.',
    5, 'activo', true,
    'a0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '35 days'
  ),
  (
    'b0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000003',
    'Parqueo Las Acacias',
    'Parqueo familiar en zona residencial cerca del centro. Tranquilo y seguro.',
    'Bulevar Los Proceres 4-56, Zona 3, Esquipulas',
    'Frente al Colegio Bethania, portón negro',
    14.76100, -89.35650,
    5, 15.00, 120.00,
    'Acceso controlado con portón. Horario hasta las 9pm. Ambiente familiar.',
    4, 'activo', false,
    'a0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '28 days'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. TIPOS DE VEHÍCULO POR PARQUEO
-- ============================================================
-- Parqueo Los Olivos: Carro, Moto, Bicicleta
INSERT INTO parking_vehicle_types (parking_id, vehicle_type_id)
  SELECT 'b0000000-0000-0000-0000-000000000001', id
  FROM vehicle_types WHERE nombre IN ('Carro', 'Moto', 'Bicicleta')
ON CONFLICT DO NOTHING;

-- Parqueo Vista al Cristo: Carro, Moto
INSERT INTO parking_vehicle_types (parking_id, vehicle_type_id)
  SELECT 'b0000000-0000-0000-0000-000000000002', id
  FROM vehicle_types WHERE nombre IN ('Carro', 'Moto')
ON CONFLICT DO NOTHING;

-- Parqueo El Pedregal: Carro, Pickup, Camioneta
INSERT INTO parking_vehicle_types (parking_id, vehicle_type_id)
  SELECT 'b0000000-0000-0000-0000-000000000003', id
  FROM vehicle_types WHERE nombre IN ('Carro', 'Pickup', 'Camioneta')
ON CONFLICT DO NOTHING;

-- Parqueo Central: todos los tipos
INSERT INTO parking_vehicle_types (parking_id, vehicle_type_id)
  SELECT 'b0000000-0000-0000-0000-000000000004', id
  FROM vehicle_types WHERE nombre IN ('Carro', 'Moto', 'Pickup', 'Microbus', 'Camioneta', 'Bicicleta')
ON CONFLICT DO NOTHING;

-- Parqueo Las Acacias: Carro, Moto, Bicicleta
INSERT INTO parking_vehicle_types (parking_id, vehicle_type_id)
  SELECT 'b0000000-0000-0000-0000-000000000005', id
  FROM vehicle_types WHERE nombre IN ('Carro', 'Moto', 'Bicicleta')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. HORARIOS (Lunes–Sábado 06:00–22:00, Domingo 07:00–20:00)
-- ============================================================
DO $$
DECLARE
  p_ids UUID[] := ARRAY[
    'b0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000005'
  ];
  pid UUID;
BEGIN
  FOREACH pid IN ARRAY p_ids LOOP
    INSERT INTO parking_schedules (parking_id, dia_semana, hora_inicio, hora_fin)
    VALUES
      (pid, 'lunes',     '06:00', '22:00'),
      (pid, 'martes',    '06:00', '22:00'),
      (pid, 'miercoles', '06:00', '22:00'),
      (pid, 'jueves',    '06:00', '22:00'),
      (pid, 'viernes',   '06:00', '22:00'),
      (pid, 'sabado',    '06:00', '22:00'),
      (pid, 'domingo',   '07:00', '20:00')
    ON CONFLICT (parking_id, dia_semana) DO NOTHING;
  END LOOP;
END;
$$;

-- ============================================================
-- 6. RESERVAS (5 en distintos estados)
-- ============================================================
INSERT INTO reservations (
  id, parking_id, usuario_id, tipo,
  fecha_inicio, fecha_fin, estado, codigo_reserva,
  metodo_pago, precio_unitario, cantidad_unidades,
  precio_subtotal, descuento, precio_total,
  vehiculo_placa, vehiculo_tipo, vehiculo_color, notas_usuario
) VALUES
  -- R1: Juan → Los Olivos (hora, confirmada)
  (
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000004',
    'hora',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day' + INTERVAL '3 hours',
    'pendiente', 'RDPA0001',
    'llegada', 15.00, 3,
    45.00, 0, 45.00,
    'P-123-ABC', 'Carro', 'Rojo', 'Llegaré puntual.'
  ),
  -- R2: María → Central (día, finalizada)
  (
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000005',
    'dia',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '9 days',
    'pendiente', 'RDPA0002',
    'online', 120.00, 1,
    120.00, 0, 120.00,
    'O-456-DEF', 'Carro', 'Blanco', 'Vengo de visita a la Basílica.'
  ),
  -- R3: Juan → Vista al Cristo (hora, finalizada)
  (
    'c0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000004',
    'hora',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days' + INTERVAL '2 hours',
    'pendiente', 'RDPA0003',
    'anticipo', 15.00, 2,
    30.00, 0, 30.00,
    'P-789-GHI', 'Moto', 'Negro', NULL
  ),
  -- R4: María → El Pedregal (hora, cancelada)
  (
    'c0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000005',
    'hora',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days' + INTERVAL '1 hour',
    'pendiente', 'RDPA0004',
    'llegada', 15.00, 1,
    15.00, 0, 15.00,
    'O-321-JKL', 'Pickup', 'Gris', 'Puede que llegue tarde.'
  ),
  -- R5: Juan → Las Acacias (día, pendiente)
  (
    'c0000000-0000-0000-0000-000000000005',
    'b0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000004',
    'dia',
    NOW() + INTERVAL '3 days',
    NOW() + INTERVAL '4 days',
    'pendiente', 'RDPA0005',
    'online', 120.00, 1,
    120.00, 0, 120.00,
    'P-654-MNO', 'Carro', 'Azul', 'Reserva para el fin de semana largo.'
  )
ON CONFLICT (id) DO NOTHING;

-- Avanzar estados para disparar triggers de comisión
-- R1 → confirmada
UPDATE reservations SET estado = 'confirmada'
WHERE id = 'c0000000-0000-0000-0000-000000000001' AND estado = 'pendiente';

-- R2 → confirmada → finalizada (en 2 pasos para respetar el trigger)
UPDATE reservations SET estado = 'confirmada'
WHERE id = 'c0000000-0000-0000-0000-000000000002' AND estado = 'pendiente';
UPDATE reservations SET estado = 'finalizada'
WHERE id = 'c0000000-0000-0000-0000-000000000002' AND estado = 'confirmada';

-- R3 → confirmada → finalizada
UPDATE reservations SET estado = 'confirmada'
WHERE id = 'c0000000-0000-0000-0000-000000000003' AND estado = 'pendiente';
UPDATE reservations SET estado = 'finalizada'
WHERE id = 'c0000000-0000-0000-0000-000000000003' AND estado = 'confirmada';

-- R4 → cancelada
UPDATE reservations SET
  estado = 'cancelada',
  motivo_cancelacion = 'El vehículo no pudo llegar por cambio de planes.',
  cancelada_por = 'a0000000-0000-0000-0000-000000000005'
WHERE id = 'c0000000-0000-0000-0000-000000000004' AND estado = 'pendiente';

-- R5 queda en 'pendiente' (reserva futura)

-- ============================================================
-- 7. RESEÑAS (solo para reservas finalizadas: R2 y R3)
-- ============================================================
INSERT INTO ratings (
  id, reserva_id, usuario_id, parking_id,
  estrellas, comentario,
  estrellas_limpieza, estrellas_seguridad, estrellas_acceso,
  aprobado
) VALUES
  -- María → Parqueo Central (R2, 5 estrellas)
  (
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000005',
    'b0000000-0000-0000-0000-000000000004',
    5,
    'Excelente parqueo, muy limpio y seguro. Ana es muy atenta. Regresaré la próxima visita.',
    5, 5, 4,
    true
  ),
  -- Juan → Parqueo Vista al Cristo (R3, 4 estrellas)
  (
    'd0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000002',
    4,
    'Muy buena ubicación frente a la Basílica. El espacio es un poco estrecho para carros grandes pero en general muy bien.',
    4, 4, 5,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. MENSAJES (5 conversaciones de prueba)
-- ============================================================
INSERT INTO messages (id, sender_id, receiver_id, reserva_id, contenido, leido, created_at) VALUES
  -- Juan pregunta a Roberto sobre Los Olivos (R1)
  (
    'e0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'Hola Roberto, ¿el parqueo tiene techo? Vengo en carro y queremos que quede cubierto.',
    true,
    NOW() - INTERVAL '2 days'
  ),
  -- Roberto responde a Juan
  (
    'e0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000001',
    'Buenas tardes Juan, sí, Los Olivos es completamente techado. ¡Bienvenido! Te estaré esperando.',
    true,
    NOW() - INTERVAL '2 days' + INTERVAL '30 minutes'
  ),
  -- María pregunta a Ana sobre Central
  (
    'e0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000002',
    'Ana, buenos días. ¿Aceptan pago con tarjeta o solo en efectivo?',
    true,
    NOW() - INTERVAL '11 days'
  ),
  -- Ana responde a María
  (
    'e0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000002',
    'Buenos días María! Aceptamos efectivo y también transferencia por Bam o Banrural. El pago online ya quedó registrado en su reserva.',
    true,
    NOW() - INTERVAL '11 days' + INTERVAL '1 hour'
  ),
  -- Admin envía aviso a Roberto (sin reserva)
  (
    'e0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    NULL,
    'Hola Roberto, tu cuenta ha sido verificada. Ya puedes acceder a las estadísticas avanzadas desde el panel de anfitrión. Saludos, equipo RDP.',
    false,
    NOW() - INTERVAL '50 days' + INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. NOTIFICACIONES
-- ============================================================
INSERT INTO notifications (id, usuario_id, tipo, titulo, cuerpo, leido, referencia_id, referencia_tipo) VALUES
  -- A Roberto: nueva reserva (R1)
  (
    'f0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'reserva_nueva',
    'Nueva reserva en Parqueo Los Olivos',
    'Juan Ortiz reservó 3 horas para mañana. Total: Q45.00.',
    true,
    'c0000000-0000-0000-0000-000000000001',
    'reserva'
  ),
  -- A Juan: reserva confirmada (R1)
  (
    'f0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000004',
    'reserva_confirmada',
    '¡Reserva confirmada! – Parqueo Los Olivos',
    'Tu reserva RDPA0001 fue confirmada por Roberto Méndez. ¡Nos vemos mañana!',
    false,
    'c0000000-0000-0000-0000-000000000001',
    'reserva'
  ),
  -- A Ana: pago recibido (R2)
  (
    'f0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000003',
    'pago_recibido',
    'Pago recibido – Q120.00',
    'Recibiste un pago de Q120.00 por la reserva de María López. Comisión RDP: Q20.40. Tu saldo: Q99.60.',
    true,
    'c0000000-0000-0000-0000-000000000002',
    'reserva'
  ),
  -- A María: nueva reseña aprobada
  (
    'f0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000005',
    'resena_nueva',
    'Tu reseña fue publicada',
    'Tu reseña de 5 estrellas en Parqueo Central Esquipulas ya es visible para todos.',
    false,
    'd0000000-0000-0000-0000-000000000001',
    'rating'
  ),
  -- A Juan: mensaje nuevo de Roberto
  (
    'f0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000004',
    'mensaje_nuevo',
    'Nuevo mensaje de Roberto Méndez',
    'Roberto te respondió sobre tu reserva en Parqueo Los Olivos.',
    true,
    'e0000000-0000-0000-0000-000000000002',
    'mensaje'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. VERIFICACIÓN FINAL
-- ============================================================
SELECT
  (SELECT COUNT(*) FROM auth.users   WHERE id::text LIKE 'a0000000%') AS auth_users,
  (SELECT COUNT(*) FROM profiles     WHERE id::text LIKE 'a0000000%') AS profiles,
  (SELECT COUNT(*) FROM parkings     WHERE id::text LIKE 'b0000000%') AS parqueos,
  (SELECT COUNT(*) FROM reservations WHERE id::text LIKE 'c0000000%') AS reservas,
  (SELECT COUNT(*) FROM commissions  WHERE reserva_id::text LIKE 'c0000000%') AS comisiones,
  (SELECT COUNT(*) FROM ratings      WHERE id::text LIKE 'd0000000%') AS resenas,
  (SELECT COUNT(*) FROM messages     WHERE id::text LIKE 'e0000000%') AS mensajes,
  (SELECT COUNT(*) FROM notifications WHERE id::text LIKE 'f0000000%') AS notificaciones;
