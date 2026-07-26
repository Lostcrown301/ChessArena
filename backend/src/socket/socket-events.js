import { SOCKET_EVENTS } from './constants/socket-events.constants.js';

export function createSocketSuccess(data) {
  return {
    success: true,
    data,
  };
}

export function createSocketFailure(code, message) {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}

// Socket handlers can either emit an event or answer an acknowledgement callback.
// Supporting both patterns keeps the API usable by simple clients and by clients
// that prefer request/response-style Socket.IO acknowledgements.
export function emitSocketSuccess(socket, eventName, data, acknowledge) {
  const payload = createSocketSuccess(data);
  socket.emit(eventName, payload);

  if (typeof acknowledge === 'function') {
    acknowledge(payload);
  }

  return payload;
}

export function emitSocketFailure(
  socket,
  code,
  message,
  acknowledge,
  eventName = SOCKET_EVENTS.ERROR,
) {
  const payload = createSocketFailure(code, message);
  socket.emit(eventName, payload);

  if (typeof acknowledge === 'function') {
    acknowledge(payload);
  }

  return payload;
}
