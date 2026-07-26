import { ROOM_ROLES, SOCKET_EVENTS } from '../constants/socket-events.constants.js';

// Disconnect handling is isolated because cleanup needs to stay consistent for
// graceful disconnects, browser refreshes, and connection drops. It removes the
// socket from every tracked room without introducing chess-specific behavior.
export async function handleSocketDisconnect({
  io,
  socket,
  roomManager,
  chessService,
  logger,
  reason,
}) {
  const disconnectedRooms = roomManager.markSocketDisconnected(socket.id);

  for (const result of disconnectedRooms) {
    if (result.member.role === ROOM_ROLES.PLAYER) {
      try {
        await chessService.markPlayerDisconnected(result.roomId, {
          playerId: result.member.player.id,
        });
      } catch (error) {
        logger.warn(
          { err: error, roomId: result.roomId, playerId: result.member.player.id },
          'Unable to mark disconnected player in active game store',
        );
      }
    }

    io.to(result.roomId).emit(SOCKET_EVENTS.PLAYER_LEFT, {
      success: true,
      data: {
        roomId: result.roomId,
        member: result.member,
        room: result.room,
      },
    });
  }

  logger.info(
    summarizeDisconnect({
      socketId: socket.id,
      reason,
      roomsLeft: disconnectedRooms.length,
    }),
    'Socket disconnected',
  );
}

export function summarizeDisconnect({ socketId, reason, roomsLeft }) {
  return {
    socketId,
    reason,
    roomsLeft,
  };
}
