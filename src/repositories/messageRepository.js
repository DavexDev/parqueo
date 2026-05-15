// src/repositories/messageRepository.js
const { getPool } = require('../../config/database');

function mapMessage(row) {
  return {
    id: row.id,
    deId: row.de_id,
    deNombre: row.de_nombre || undefined,
    paraId: row.para_id,
    paraNombre: row.para_nombre || undefined,
    texto: row.texto,
    fecha: row.created_at,
    leido: row.leido === 1 || row.leido === true,
    emailEnviado: row.email_enviado === 1 || row.email_enviado === true,
    emailError: row.email_error || undefined
  };
}

async function getMessagesByUser(userId) {
  const pool = getPool();
  const [rows] = await pool.query(
    'SELECT * FROM messages WHERE de_id = ? OR para_id = ? ORDER BY created_at ASC',
    [userId, userId]
  );
  return rows.map(mapMessage);
}

async function getConversation(u1, u2) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT * FROM messages
     WHERE (de_id = ? AND para_id = ?) OR (de_id = ? AND para_id = ?)
     ORDER BY created_at ASC`,
    [u1, u2, u2, u1]
  );
  return rows.map(mapMessage);
}

async function createMessage({ deId, paraId, texto }) {
  const pool = getPool();
  const [result] = await pool.query(
    'INSERT INTO messages (de_id, para_id, texto) VALUES (?, ?, ?)',
    [deId, paraId, texto]
  );
  const [rows] = await pool.query('SELECT * FROM messages WHERE id = ?', [result.insertId]);
  return rows.length ? mapMessage(rows[0]) : null;
}

async function markRead(userId, otroId) {
  const pool = getPool();
  await pool.query(
    'UPDATE messages SET leido = 1 WHERE para_id = ? AND de_id = ?',
    [userId, otroId]
  );
}

async function updateEmailStatus(id, enviado, error) {
  const pool = getPool();
  await pool.query(
    'UPDATE messages SET email_enviado = ?, email_error = ? WHERE id = ?',
    [enviado ? 1 : 0, error || null, id]
  );
}

async function listMessagesAdmin() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT m.*,
            u1.nombre AS de_nombre,
            u2.nombre AS para_nombre
     FROM messages m
     LEFT JOIN users u1 ON u1.id = m.de_id
     LEFT JOIN users u2 ON u2.id = m.para_id
     ORDER BY m.created_at DESC`
  );
  return rows.map(mapMessage);
}

module.exports = { getMessagesByUser, getConversation, createMessage, markRead, updateEmailStatus, listMessagesAdmin };
