import { createContext } from 'react';

export const SocketContext = createContext({
  connectionError: '',
  connectionStatus: 'idle',
  socket: null,
  isConnected: false,
  connectSocket: () => {},
  disconnectSocket: () => {},
});
