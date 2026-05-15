-- ============================================================
-- RDP S.A. — PATCH v3: Seguridad Explícita
-- Ejecutar en SQL Editor de Supabase DESPUÉS de patch_v2.sql
-- ============================================================

-- ============================================================
-- 1. ANTI ESCALADA DE ROLES (CRÍTICO)
--    Evita que un usuario se asigne el rol 'admin' mediante
--    la API de Supabase (updateProfile, etc.)
-- ============================================================
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Nadie (excepto otro admin) puede asignarse o asignar el rol 'admin'
  IF NEW.rol = 'admin' AND NOT is_admin() THEN
    RAISE EXCEPTION 'acceso_denegado: no puedes asignarte el rol de administrador';
  END IF;
  -- Nadie (excepto admin) puede degradar a un administrador
  IF OLD.rol = 'admin' AND NEW.rol <> 'admin' AND NOT is_admin() THEN
    RAISE EXCEPTION 'acceso_denegado: no puedes cambiar el rol de un administrador';
  END IF;
  -- Un visitante solo puede escalarse a 'anfitrion', nunca a 'admin'
  IF OLD.rol = 'visitante' AND NEW.rol NOT IN ('visitante', 'anfitrion') AND NOT is_admin() THEN
    RAISE EXCEPTION 'acceso_denegado: rol no permitido';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_no_role_escalation ON profiles;
CREATE TRIGGER enforce_no_role_escalation
  BEFORE UPDATE OF rol ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_role_escalation();

-- ============================================================
-- 2. profiles — INSERT solo para el propio usuario (defensa en profundidad)
--    El trigger handle_new_user ya crea el perfil; esto bloquea
--    inserciones manuales con id ajeno.
-- ============================================================
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ============================================================
-- 3. profiles — DELETE solo admin
-- ============================================================
DROP POLICY IF EXISTS "profiles_admin_delete" ON profiles;
CREATE POLICY "profiles_admin_delete"
  ON profiles FOR DELETE
  USING (is_admin());

-- ============================================================
-- 4. parkings — DELETE soft: solo el anfitrión puede marcar
--    deleted_at; el hard-delete queda solo para admin.
-- ============================================================
DROP POLICY IF EXISTS "parkings_host_delete" ON parkings;
CREATE POLICY "parkings_host_delete"
  ON parkings FOR DELETE
  USING (anfitrion_id = auth.uid());

-- ============================================================
-- 5. payments — INSERT: el usuario solo puede crear pagos de
--    sus propias reservas
-- ============================================================
DROP POLICY IF EXISTS "payments_user_insert" ON payments;
CREATE POLICY "payments_user_insert"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reservations
      WHERE id = reserva_id AND usuario_id = auth.uid()
    )
  );

-- ============================================================
-- 6. ratings — UPDATE/DELETE bloqueado para no-admin
--    (solo admins pueden moderar reseñas)
-- ============================================================
DROP POLICY IF EXISTS "ratings_admin_modify" ON ratings;
CREATE POLICY "ratings_admin_modify"
  ON ratings FOR UPDATE
  USING (is_admin());

DROP POLICY IF EXISTS "ratings_admin_delete" ON ratings;
CREATE POLICY "ratings_admin_delete"
  ON ratings FOR DELETE
  USING (is_admin());

-- ============================================================
-- 7. messages — UPDATE (marcar leído) solo para el receptor;
--    DELETE solo para admin.
-- ============================================================
DROP POLICY IF EXISTS "messages_mark_read" ON messages;
CREATE POLICY "messages_mark_read"
  ON messages FOR UPDATE
  USING (receiver_id = auth.uid());

DROP POLICY IF EXISTS "messages_admin_delete" ON messages;
CREATE POLICY "messages_admin_delete"
  ON messages FOR DELETE
  USING (is_admin());

-- ============================================================
-- 8. incidents — UPDATE solo para el reporter o admin
-- ============================================================
DROP POLICY IF EXISTS "incidents_reporter_update" ON incidents;
CREATE POLICY "incidents_reporter_update"
  ON incidents FOR UPDATE
  USING (reporter_id = auth.uid() OR is_admin());

-- ============================================================
-- 9. Storage — bucket 'parkings'
--    Solo usuarios autenticados pueden subir archivos.
--    La lectura es pública (bucket público).
-- ============================================================
DROP POLICY IF EXISTS "storage_parkings_upload" ON storage.objects;
CREATE POLICY "storage_parkings_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'parkings'
    AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "storage_parkings_update" ON storage.objects;
CREATE POLICY "storage_parkings_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'parkings'
    AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "storage_parkings_delete" ON storage.objects;
CREATE POLICY "storage_parkings_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'parkings'
    AND auth.uid() IS NOT NULL
  );

-- ============================================================
-- 10. Función auxiliar: verificar que porcentaje_comision
--     no sea manipulado por el cliente (siempre 17%)
-- ============================================================
CREATE OR REPLACE FUNCTION enforce_commission_rate()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Forzar 17% independientemente de lo que envíe el cliente
  NEW.porcentaje_comision := 17.00;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_commission ON reservations;
CREATE TRIGGER trg_enforce_commission
  BEFORE INSERT OR UPDATE OF porcentaje_comision ON reservations
  FOR EACH ROW EXECUTE FUNCTION enforce_commission_rate();
