import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { logger as defaultLogger } from '../config/logger.js';
import { chessService as defaultChessService } from '../services/chess/ChessService.js';
import { SOCKET_EVENTS } from './constants/socket-events.constants.js';
import { registerConnectionHandler } from './handlers/connection.handler.js';
import { roomManager as defaultRoomManager } from './handlers/room-manager.js';

// Socket.IO is initialized beside the Express HTTP server, but it stays focused
// on networking and room membership. Chess rules remain in ChessService.
export function createSocketServer(
  httpServer,
  {
    roomManager = defaultRoomManager,
    chessService = defaultChessService,
    logger = defaultLogger,
  } = {},
) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigins,
      credentials: true,
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 120000,
      skipMiddlewares: true,
    },
  });

  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    registerConnectionHandler({
      io,
      socket,
      roomManager,
      chessService,
      logger,
    });
  });

  return io;
}
