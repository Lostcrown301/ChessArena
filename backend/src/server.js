import http from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { closeRedisClient } from './lib/redis.js';
import { databaseConnection } from './db/connection.js';
import { stockfishService } from './services/analysis/StockfishService.js';
import { createSocketServer } from './socket/index.js';

const app = createApp();
const server = http.createServer(app);
const io = createSocketServer(server);

server.listen(env.port, () => {
  logger.info({ port: env.port, environment: env.nodeEnv }, 'Chess Arena API listening');
});

function shutdown(signal) {
  logger.info({ signal }, 'Shutting down Chess Arena API');

  io.close();
  server.close(async (error) => {
    if (error) {
      logger.error({ error }, 'Error while closing HTTP server');
      process.exit(1);
    }
    await Promise.allSettled([
      closeRedisClient(), 
      stockfishService.shutdown(),
      databaseConnection.pool.end()
    ]);
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
