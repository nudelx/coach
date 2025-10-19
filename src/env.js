const dotenv = require('dotenv');

dotenv.config();

const getEnvVar = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const ensureEnvVars = (keys) => keys.forEach(getEnvVar);

module.exports = {
  getEnvVar,
  ensureEnvVars,
};
