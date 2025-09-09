
const mongoose = require('mongoose');
const { variables } = require('./env');

const connectDB = async () => {
  try {
    logger.info('Connecting to Database');
    const conn = await mongoose.connect(variables.database.uri, variables.database.options);
    logger.info('Database connected');
    return conn;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
};

module.exports = connectDB;
