import { io } from 'socket.io-client';
import { env } from '@config/env';

let socket;

function createSocket() {
  return io(env.socketUrl, {
    autoConnect: false,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling'],
  });
}

export function getSocket() {
  if (!socket) {
    socket = createSocket();
  }

  return socket;
}

export function connect() {
  const activeSocket = getSocket();

  if (!activeSocket.connected) {
    activeSocket.connect();
  }

  return activeSocket;
}

export function disconnect() {
  if (socket?.connected) {
    socket.disconnect();
  }
}
