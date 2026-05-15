// src/repositories/reservationRepository.js
const { getPool } = require('../../config/database');

function mapReservation(row) {
  return {
    id: row.id,
    parqueoId: row.parqueo_id,
    parqueoNombre: row.parqueo_nombre || undefined,
    usuarioId: row.usuario_id,
    usuarioNombre: row.usuario_nombre || undefined,
    fechaInicio: row.fecha_inicio,
    fechaFin: row.fecha_fin,
    estado: row.estado
  };
}

async function checkConflict(parqueoId, fechaInicio, fechaFin) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT id FROM reservations
     WHERE parqueo_id = ?
       AND estado NOT IN ('cancelada', 'finalizada')
       AND deleted_at IS NULL
       AND fecha_inicio < ? AND fecha_fin > ?`,
    [parqueoId, fechaFin, fechaInicio]
  );
  return rows.length > 0;
}

async function listReservations(usuarioId) {
  const pool = getPool();
  let query = 'SELECT * FROM reservations WHERE deleted_at IS NULL ORDER BY fecha_inicio DESC';
  const params = [];
  if (usuarioId) {
    query = 'SELECT * FROM reservations WHERE usuario_id = ? AND deleted_at IS NULL ORDER BY fecha_inicio DESC';
    params.push(usuarioId);
  }
  const [rows] = await pool.query(query, params);
  return rows.map(mapReservation);
}

async function listReservationsAdmin() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT r.*,
            u.nombre AS usuario_nombre,
            p.nombre AS parqueo_nombre
     FROM reservations r
     LEFT JOIN users u ON u.id = r.usuario_id
     LEFT JOIN parkings p ON p.id = r.parqueo_id
     WHERE r.deleted_at IS NULL
     ORDER BY r.fecha_inicio DESC`
  );
  return rows.map(mapReservation);
}

async function createReservation({ parqueoId, usuarioId, fechaInicio, fechaFin }) {
  const pool = getPool();
  const [result] = await pool.query(
    `INSERT INTO reservations (parqueo_id, usuario_id, fecha_inicio, fecha_fin, estado)
     VALUES (?, ?, ?, ?, 'pendiente')`,
    [parqueoId, usuarioId, fechaInicio, fechaFin]
  );
  const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [result.insertId]);
  return rows.length ? mapReservation(rows[0]) : null;
}

async function updateReservationStatus(id, estado) {
  const pool = getPool();
  const [result] = await pool.query(
    `UPDATE reservations SET estado = ? WHERE id = ? AND deleted_at IS NULL`,
    [estado, id]
  );
  if (result.affectedRows === 0) return null;
  const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [id]);
  return rows.length ? mapReservation(rows[0]) : null;
}

module.exports = { checkConflict, listReservations, listReservationsAdmin, createReservation, updateReservationStatus };
