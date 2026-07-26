import { apiClient } from './apiClient';

export async function createGame({ displayName }) {
  const response = await apiClient.post('/games', { displayName });
  return response.data.data;
}

export async function joinGame({ gameId, displayName }) {
  const response = await apiClient.post(`/games/${gameId}/join`, { displayName });
  return response.data.data;
}
