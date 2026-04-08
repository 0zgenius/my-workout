const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

const initializeDB = async () => {
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️ DATABASE_URL is not defined. Please set it in your environment variables to use PostgreSQL.");
    return;
  }
  
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      level INTEGER DEFAULT 1,
      streak INTEGER DEFAULT 0,
      strong_sessions INTEGER DEFAULT 0,
      hard_sessions INTEGER DEFAULT 0,
      total_workouts INTEGER DEFAULT 0,
      history JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  try {
    await pool.query(createTableQuery);
    console.log('🟢 PostgreSQL Connected & Table Setup Complete');
  } catch (err) {
    console.error('🔴 PostgreSQL Initialization Error:', err);
  }
};

module.exports = {
  pool,
  initializeDB
};
