import 'dotenv/config';

const requiredVariables = ['DATABASE_URL', 'REDIS_URL'];

function getEnv(name, fallback) {
  const value = process.env[name] ?? fallback;

  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getPort() {
  const port = Number(getEnv('PORT', '4000'));

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return port;
}

function getCorsOrigins() {
  return getEnv('CORS_ORIGIN', 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getActiveGameTtlSeconds() {
  const ttlSeconds = Number(getEnv('ACTIVE_GAME_TTL_SECONDS', '3600'));

  if (!Number.isInteger(ttlSeconds) || ttlSeconds < 60) {
    throw new Error('ACTIVE_GAME_TTL_SECONDS must be an integer of at least 60 seconds');
  }

  return ttlSeconds;
}

function getGameStoreDriver() {
  const driver = getEnv('GAME_STORE_DRIVER', 'memory').toLowerCase();

  if (!['memory', 'redis'].includes(driver)) {
    throw new Error('GAME_STORE_DRIVER must be either "memory" or "redis"');
  }

  return driver;
}

for (const variable of requiredVariables) {
  if (!process.env[variable] && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required production environment variable: ${variable}`);
  }
}

export const env = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: getPort(),
  corsOrigins: getCorsOrigins(),
  databaseUrl: getEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/chess_arena'),
  redisUrl: getEnv('REDIS_URL', 'redis://localhost:6379'),
  gameStoreDriver: getGameStoreDriver(),
  activeGameTtlSeconds: getActiveGameTtlSeconds(),
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiApiEndpoint: getEnv(
    'GEMINI_API_ENDPOINT',
    'https://generativelanguage.googleapis.com/v1beta',
  ),
  geminiModel: getEnv('GEMINI_MODEL', 'gemini-2.0-flash'),
  logLevel: getEnv('LOG_LEVEL', 'info'),
};
