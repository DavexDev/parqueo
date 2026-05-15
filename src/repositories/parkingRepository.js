// src/repositories/parkingRepository.js
const { getPool } = require('../../config/database');

function mapParking(row) {
  return {
    id: row.id,
    anfitrionId: row.anfitrion_id,
    anfitrionNombre: row.anfitrion_nombre || undefined,
    nombre: row.nombre,
    tipo: row.tipo,
    precio: parseFloat(row.precio),
    disponible: row.disponible === 1 || row.disponible === true,
    lat: row.lat ? parseFloat(row.lat) : null,
    lng: row.lng ? parseFloat(row.lng) : null,
    direccion: row.direccion,
    fotos: row.fotos_json ? JSON.parse(row.fotos_json) : []
  };
}

async function listParkings() {
  const pool = getPool();
  const [rows] = await pool.query(
    'SELECT * FROM parkings WHERE deleted_at IS NULL ORDER BY id ASC'
  );
  return rows.map(mapParking);
}

async function listParkingsAdmin() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT p.*, u.nombre AS anfitrion_nombre
     FROM parkings p
     LEFT JOIN users u ON u.id = p.anfitrion_id
     WHERE p.deleted_at IS NULL
     ORDER BY p.id ASC`
  );
  return rows.map(mapParking);
}

async function findById(id) {
  const pool = getPool();
  const [rows] = await pool.query(
    'SELECT * FROM parkings WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return rows.length ? mapParking(rows[0]) : null;
}

async function createParking({ anfitrionId, nombre, tipo, precio, direccion, lat, lng }) {
  const pool = getPool();
  const [result] = await pool.query(
    `INSERT INTO parkings (anfitrion_id, nombre, tipo, precio, direccion, lat, lng, disponible)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [anfitrionId, nombre, tipo, precio, direccion, lat || null, lng || null]
  );
  return findById(result.insertId);
}

async function updateParking(id, fields) {
  const pool = getPool();
  const allowed = ['nombre', 'tipo', 'precio', 'disponible', 'direccion', 'lat', 'lng', 'fotos_json'];
  const updates = [];
  const values = [];
  for (const [key, val] of Object.entries(fields)) {
    if (allowed.includes(key)) {
      updates.push(`${key} = ?`);
      values.push(val);
    }
  }
  if (updates.length === 0) return findById(id);
  values.push(id);
  await pool.query(
    `UPDATE parkings SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
    values
  );
  return findById(id);
}

async function deleteParking(id) {
  const pool = getPool();
  const [result] = await pool.query(
    'UPDATE parkings SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return result.affectedRows > 0;
}

module.exports = { listParkings, listParkingsAdmin, findById, createParking, updateParking, deleteParking };
