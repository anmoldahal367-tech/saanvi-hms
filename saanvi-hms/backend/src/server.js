require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connection established successfully.');

    // sync() creates tables that don't exist yet based on the models.
    // alter:true keeps existing tables in line with model changes during
    // development. In production, prefer real migrations instead of sync.
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Database synced.');

    app.listen(PORT, () => {
      console.log(`SAANVI-HMS backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Unable to start the server:', err);
    process.exit(1);
  }
}

start();
