import dotenv from 'dotenv';

// Load environment variables from .env.test if in test environment
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config(); // Load .env by default
}

export const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  googleClientId: process.env.CLIENT_ID,
  googleClientSecret: process.env.CLIENT_SECRET,
  googleRedirectUrl: process.env.REDIRECT_URL,
  frontUrl: process.env.FRONT_URL,
};