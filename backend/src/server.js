const config = require('./config');
const { connectDatabase } = require('./config/database');
const app = require('./app');

async function start() {
  try {
    await connectDatabase();
    app.listen(config.port, () => {
      console.log(`SONIQ Express API running on port ${config.port}`);
    });
  } catch (err) {
    console.error('Failed to start SONIQ backend:', err);
    process.exit(1);
  }
}

start();
