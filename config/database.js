const mysql = require('mysql2/promise');

const databaseConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'parqueo',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  queueLimit: 0
};

let pool;

function hasDatabaseConfig() {
  // Acepta MySQL legacy O Supabase como backend configurado
  const hasMySQL = Boolean(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);
  const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
  return hasMySQL || hasSupabase;
}

function hasSupabaseConfig() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

function getPool() {
  if (!pool) {
    pool = mysql.createPool(databaseConfig);
  }
  return pool;
}

async function testConnection() {
  const connection = await getPool().getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

module.exports = {
  databaseConfig,
  getPool,
  hasDatabaseConfig,
  hasSupabaseConfig,
  testConnection
};
