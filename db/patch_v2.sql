-- ============================================================
-- RDP S.A. — PATCH v2
-- Ejecutar en SQL Editor de Supabase
-- ============================================================

-- 1. Permitir que anfitriones inserten y actualicen sus membresías
CREATE POLICY "memberships_host_insert"
  ON memberships FOR INSERT
  WITH CHECK (anfitrion_id = auth.uid());

CREATE POLICY "memberships_host_update"
  ON memberships FOR UPDATE
  USING (anfitrion_id = auth.uid());

-- 2. Agregar reservas_mes y total_usuarios a la vista admin_metrics
DROP VIEW IF EXISTS admin_metrics;
CREATE VIEW admin_metrics AS
SELECT
  (SELECT COUNT(*) FROM parkings WHERE deleted_at IS NULL)                                                AS total_parqueos,
  (SELECT COUNT(*) FROM parkings WHERE estado = 'activo' AND deleted_at IS NULL)                         AS parqueos_activos,
  (SELECT COUNT(*) FROM parkings WHERE estado = 'pendiente_aprobacion' AND deleted_at IS NULL)           AS parqueos_pendientes,
  (SELECT COUNT(*) FROM profiles WHERE rol = 'visitante')                                                AS total_visitantes,
  (SELECT COUNT(*) FROM profiles WHERE rol = 'anfitrion')                                                AS total_anfitriones,
  (SELECT COUNT(*) FROM profiles)                                                                         AS total_usuarios,
  (SELECT COUNT(*) FROM reservations)                                                                     AS total_reservas,
  (SELECT COUNT(*) FROM reservations WHERE estado = 'confirmada')                                        AS reservas_activas,
  (SELECT COUNT(*) FROM reservations WHERE created_at >= date_trunc('month', NOW()))                     AS reservas_mes,
  (SELECT COALESCE(SUM(monto_comision), 0) FROM commissions)                                             AS ingresos_rdp_total,
  (SELECT COALESCE(SUM(monto_comision), 0) FROM commissions WHERE created_at >= date_trunc('month', NOW())) AS ingresos_rdp_mes,
  (SELECT COUNT(*) FROM incidents WHERE estado = 'abierto')                                              AS incidentes_abiertos;

-- 3. Política para leer vehicle_types (tabla sin RLS, pero por si acaso)
-- vehicle_types no tiene RLS habilitado, ya es accesible públicamente.

-- 4. Asegurar que cualquier usuario autenticado pueda leer parkings_with_host
-- (la vista usa SECURITY DEFINER implícitamente en Supabase, pero por claridad:)
GRANT SELECT ON parkings_with_host TO anon, authenticated;
GRANT SELECT ON admin_metrics       TO authenticated;
