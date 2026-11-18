const mongoose = require('mongoose');
const config = require('./index');

async function connectDatabase() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongodbUri);
  console.log('MongoDB connected:', mongoose.connection.host);
}

module.exports = { connectDatabase };
