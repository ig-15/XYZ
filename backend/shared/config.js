
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  DB_CONFIG: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_DATABASE || 'parking_management',
  },
  JWT: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRATION || '1d',
  },
  CORS: {
    origin: process.env.CORS_ORIGIN || '*',
  },
};