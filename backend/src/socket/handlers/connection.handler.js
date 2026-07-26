import { SOCKET_EVENTS } from '../constants/socket-events.constants.js';
import { handleSocketDisconnect } from './disconnect.handler.js';
import { registerGameplayHandlers } from './gameplay.handler.js';
import { registerRoomHandlers } from './room.handler.js';

// Each Socket.IO connection is short-lived transport state. The handler only
// wires lifecycle events and delegates room work to room handlers.
export function registerConnectionHandler({ io, socket, roomManager, chessService, logger }) {
  logger.info(
    {
      socketId: socket.id,
      recovered: socket.recovered,
    },
    socket.recovered ? 'Socket reconnected with recovered transport state' : 'Socket connected',
  );

  registerRoomHandlers({ socket, roomManager, chessService, logger });
  registerGameplayHandlers({ io, socket, roomManager, chessService, logger });

  socket.on(SOCKET_EVENTS.DISCONNECT, async (reason) => {
    await handleSocketDisconnect({ io, socket, roomManager, chessService, logger, reason });
  });
}
