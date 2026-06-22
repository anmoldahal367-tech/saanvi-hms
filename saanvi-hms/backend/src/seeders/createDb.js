require('dotenv').config();
const { Client } = require('pg');

// Connects to the default 'postgres' maintenance DB to create the
// actual app database, since you can't create a DB while connected to it.
async function createDatabase() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
  });

  const dbName = process.env.DB_NAME;

  try {
    await client.connect();
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rowCount > 0) {
      console.log(`Database "${dbName}" already exists. Skipping.`);
    } else {
      // Cannot parameterize identifiers, so dbName is interpolated directly.
      // It comes from your own .env file, not user input, so this is safe here.
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created successfully.`);
    }
  } catch (err) {
    console.error('Error creating database:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
