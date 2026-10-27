import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async (customUri) => {
  const uri = customUri || env.dbURL || process.env.dbURL || process.env.MONGODB_URI || process.env.DATABASE_URL;
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    if (!uri) {
      throw new Error('Database connection URL (dbURL / MONGODB_URI) is not defined in environment variables.');
    }

    // Mask credentials when logging
    const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    console.log(`Connecting to MongoDB at: ${maskedUri}`);

    mongoose.connection.on('connected', () => {
      console.log('MongoDB connection established successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err?.message || err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting reconnection...');
    });

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    return conn;
  } catch (error) {
    console.error(`\n❌ [MongoDB Error]: Failed to connect to MongoDB: ${error.message}`);
    if (error.reason) {
      console.error('   Details:', error.reason);
    }
    console.error('\nTroubleshooting Checklist:');
    console.error('1. MongoDB Atlas Network Access: Ensure IP "0.0.0.0/0" (Allow access from anywhere) is whitelisted in Atlas.');
    console.error('2. Database User Credentials: Ensure database user password is correct and special characters are URL-encoded.');
    console.error('3. Environment Variable Name: Ensure your connection string is set as "dbURL" or "MONGODB_URI" in Render.\n');

    if (env.NODE_ENV !== 'test') {
      // Allow console.error buffers to flush to Render logs before exiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
      process.exit(1);
    }
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  } catch (error) {
    console.error(`Error closing MongoDB connection: ${error.message}`);
  }
};
