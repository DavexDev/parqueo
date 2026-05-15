const { getPool } = require('../../config/database');

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    rol: row.rol,
    passwordHash: row.password_hash || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null
  };
}

async function findByEmail(email) {
  const [rows] = await getPool().query(
    'SELECT id, nombre, email, rol, password_hash, created_at, updated_at FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return mapUser(rows[0]);
}

async function createUser({ nombre, email, rol, passwordHash = null }) {
  const [result] = await getPool().query(
    'INSERT INTO users (nombre, email, rol, password_hash) VALUES (?, ?, ?, ?)',
    [nombre, email, rol, passwordHash]
  );
  return findById(result.insertId);
}

async function findById(id) {
  const [rows] = await getPool().query(
    'SELECT id, nombre, email, rol, password_hash, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return mapUser(rows[0]);
}

async function listUsers() {
  const [rows] = await getPool().query(
    'SELECT id, nombre, email, rol, password_hash, created_at, updated_at FROM users ORDER BY id ASC'
  );
  return rows.map(mapUser);
}

async function deleteUser(id) {
  const [result] = await getPool().query('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  createUser,
  deleteUser,
  findByEmail,
  findById,
  listUsers
};
