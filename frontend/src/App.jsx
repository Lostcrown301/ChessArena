import { Outlet } from 'react-router-dom';
import { GameProvider } from '@context/GameProvider';
import { SocketProvider } from '@context/SocketProvider';
import { ThemeProvider } from '@context/ThemeProvider';

export function App() {
  return (
    <ThemeProvider>
      <SocketProvider>
        <GameProvider>
          <Outlet />
        </GameProvider>
      </SocketProvider>
    </ThemeProvider>
  );
}
