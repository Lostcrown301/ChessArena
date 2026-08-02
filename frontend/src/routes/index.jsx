/* eslint-disable react-refresh/only-export-components */
import { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { App } from '@/App';
import { MainLayout } from '@layouts/MainLayout';
import { LoadingOverlay } from '@components/common/LoadingOverlay';

const HomePage = lazy(() => import('@pages/HomePage').then((m) => ({ default: m.HomePage })));
const GamePage = lazy(() => import('@pages/GamePage').then((m) => ({ default: m.GamePage })));
const LobbyPage = lazy(() => import('@pages/LobbyPage').then((m) => ({ default: m.LobbyPage })));
const HistoryPage = lazy(() =>
  import('@pages/HistoryPage').then((m) => ({ default: m.HistoryPage })),
);
const ReviewPage = lazy(() => import('@pages/ReviewPage').then((m) => ({ default: m.ReviewPage })));
const NotFoundPage = lazy(() =>
  import('@pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

const SuspenseFallback = ({ children }) => (
  <Suspense fallback={<LoadingOverlay isVisible={true} label="Loading..." />}>{children}</Suspense>
);

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: (
              <SuspenseFallback>
                <HomePage />
              </SuspenseFallback>
            ),
          },
          {
            path: 'lobby',
            element: (
              <SuspenseFallback>
                <LobbyPage />
              </SuspenseFallback>
            ),
          },
          {
            path: 'history',
            element: (
              <SuspenseFallback>
                <HistoryPage />
              </SuspenseFallback>
            ),
          },
          {
            path: 'review/:gameId',
            element: (
              <SuspenseFallback>
                <ReviewPage />
              </SuspenseFallback>
            ),
          },
          {
            path: 'game/:gameId',
            element: (
              <SuspenseFallback>
                <GamePage />
              </SuspenseFallback>
            ),
          },
          {
            path: '*',
            element: (
              <SuspenseFallback>
                <NotFoundPage />
              </SuspenseFallback>
            ),
          },
        ],
      },
    ],
  },
]);
