import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const requiredEnvVars = [
  'dbURL',
  'JWT_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
];

export const validateEnv = () => {
  // In test environment, bypass hard exit if testing with mocked services
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  // Populate safe production/development defaults for optional configurations
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
  process.env.PORT = process.env.PORT || '8084';
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';
  process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
  process.env.dbURL = process.env.dbURL || process.env.MONGODB_URI || process.env.DATABASE_URL || '';

  const missing = requiredEnvVars.filter((varName) => !process.env[varName] || process.env[varName].trim() === '');

  if (missing.length > 0) {
    console.error('\n======================================================');
    console.error('FATAL: Missing required environment variables:');
    missing.forEach((v) => console.error(`  - ${v}`));
    console.error('Please check your environment configuration or .env file.');
    console.error('======================================================\n');
    process.exit(1);
  }

  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const isTestKey = keyId.startsWith('rzp_test_');

  if (process.env.NODE_ENV === 'production') {
    if (isTestKey && process.env.ALLOW_TEST_IN_PROD !== 'true') {
      console.warn('⚠️ [Payment] WARNING: Using Razorpay TEST key in PRODUCTION environment.');
    }
  } else {
    if (!isTestKey && !keyId.includes('dummy')) {
      console.error('\n⚠️ [Payment] DANGER: Live Razorpay credentials detected in non-production environment! Aborting boot.');
      process.exit(1);
    }
    console.log(`[Payment] Razorpay configured in ${isTestKey ? 'TEST' : 'MOCK'} mode (${keyId.slice(0, 12)}...)`);
  }
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 8084,
  dbURL: process.env.dbURL || process.env.MONGODB_URI || process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  SEED_CONFIRM: process.env.SEED_CONFIRM === 'true',
};
