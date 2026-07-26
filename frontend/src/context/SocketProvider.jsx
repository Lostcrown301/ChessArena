import { useCallback, useMemo, useState } from 'react';
import { connect, disconnect, getSocket } from '@services/socket/socketClient';
import { SocketContext } from './SocketContext';

// SocketProvider tracks connection lifecycle only. Gameplay events are intentionally absent.
export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [connectionError, setConnectionError] = useState('');

  const connectSocket = useCallback(() => {
    const activeSocket = getSocket();
    setSocket(activeSocket);
    setConnectionError('');
    setConnectionStatus(activeSocket.connected ? 'connected' : 'connecting');

    activeSocket.once('connect', () => {
      setConnectionStatus('connected');
    });
    activeSocket.once('connect_error', (error) => {
      setConnectionStatus('error');
      setConnectionError(error.message);
    });
    activeSocket.once('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    connect();
  }, []);

  const disconnectSocket = useCallback(() => {
    disconnect();
    setConnectionStatus('disconnected');
  }, []);

  const value = useMemo(
    () => ({
      connectSocket,
      connectionError,
      connectionStatus,
      disconnectSocket,
      isConnected: connectionStatus === 'connected',
      socket,
    }),
    [connectSocket, connectionError, connectionStatus, disconnectSocket, socket],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
