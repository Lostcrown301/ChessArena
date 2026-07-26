import { createBrowserRouter } from 'react-router-dom';
import { App } from '@/App';
import { MainLayout } from '@layouts/MainLayout';
import { GamePage } from '@pages/GamePage';
import { HomePage } from '@pages/HomePage';
import { LobbyPage } from '@pages/LobbyPage';
import { HistoryPage } from '@pages/HistoryPage';
import { ReviewPage } from '@pages/ReviewPage';
import { NotFoundPage } from '@pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <HomePage />,
          },
          {
            path: 'lobby',
            element: <LobbyPage />,
          },
          {
            path: 'history',
            element: <HistoryPage />,
          },
          {
            path: 'review/:gameId',
            element: <ReviewPage />,
          },
          {
            path: 'game/:gameId',
            element: <GamePage />,
          },
          {
            path: '*',
            element: <NotFoundPage />,
          },
        ],
      },
    ],
  },
]);
