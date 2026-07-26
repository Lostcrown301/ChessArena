import { SOCKET_EVENTS } from '@constants/socketEvents';
import { connect, getSocket } from './socketClient';

const SOCKET_ACK_TIMEOUT_MS = 8000;
const SOCKET_CONNECT_TIMEOUT_MS = 8000;

export class SocketRequestError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'SocketRequestError';
    this.code = code;
  }
}

export { getSocket };

function normalizeFailure(error) {
  return new SocketRequestError(
    error?.code ?? 'SOCKET_REQUEST_FAILED',
    error?.message ?? 'Socket request failed.',
  );
}

export function extractGameFromPayload(payload) {
  return payload?.data?.game ?? payload?.game ?? null;
}

export function extractRoomFromPayload(payload) {
  return payload?.data?.room ?? payload?.room ?? null;
}

export async function ensureSocketConnected() {
  const socket = connect();

  if (socket.connected) {
    return socket;
  }

  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new SocketRequestError('SOCKET_CONNECT_TIMEOUT', 'Unable to connect to the server.'));
    }, SOCKET_CONNECT_TIMEOUT_MS);

    function cleanup() {
      window.clearTimeout(timeoutId);
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
    }

    function handleConnect() {
      cleanup();
      resolve(socket);
    }

    function handleConnectError(error) {
      cleanup();
      reject(
        new SocketRequestError(
          'SOCKET_CONNECT_FAILED',
          error?.message ?? 'Unable to connect to the server.',
        ),
      );
    }

    socket.once('connect', handleConnect);
    socket.once('connect_error', handleConnectError);
  });
}

export async function emitGameEvent(eventName, payload = {}) {
  const socket = await ensureSocketConnected();

  return new Promise((resolve, reject) => {
    socket.timeout(SOCKET_ACK_TIMEOUT_MS).emit(eventName, payload, (error, response) => {
      if (error) {
        reject(new SocketRequestError('SOCKET_ACK_TIMEOUT', 'The server did not respond in time.'));
        return;
      }

      if (!response?.success) {
        reject(normalizeFailure(response?.error));
        return;
      }

      resolve(response);
    });
  });
}

export function onGameSocketEvent(eventName, handler) {
  const socket = getSocket();
  socket.on(eventName, handler);

  return () => {
    socket.off(eventName, handler);
  };
}

export function createGame({ displayName }) {
  return emitGameEvent(SOCKET_EVENTS.CREATE_GAME, { displayName });
}

export function joinGame({ displayName, gameId, playerId }) {
  return emitGameEvent(SOCKET_EVENTS.JOIN_GAME, { displayName, gameId, playerId });
}

export function leaveRoom({ gameId }) {
  return emitGameEvent(SOCKET_EVENTS.LEAVE_ROOM, { roomId: gameId });
}

export function requestGameState({ gameId, playerId }) {
  return emitGameEvent(SOCKET_EVENTS.REQUEST_GAME_STATE, { gameId, playerId });
}

export function makeMove({ gameId, move, playerId }) {
  return emitGameEvent(SOCKET_EVENTS.MAKE_MOVE, { gameId, move, playerId });
}

export function offerDraw({ gameId, playerId }) {
  return emitGameEvent(SOCKET_EVENTS.OFFER_DRAW, { gameId, playerId });
}

export function acceptDraw({ gameId, playerId }) {
  return emitGameEvent(SOCKET_EVENTS.ACCEPT_DRAW, { gameId, playerId });
}

export function declineDraw({ gameId, playerId }) {
  return emitGameEvent(SOCKET_EVENTS.DECLINE_DRAW, { gameId, playerId });
}

export function resignGame({ gameId, playerId }) {
  return emitGameEvent(SOCKET_EVENTS.RESIGN_GAME, { gameId, playerId });
}
