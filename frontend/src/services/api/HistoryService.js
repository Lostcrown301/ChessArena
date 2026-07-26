import { apiClient } from './apiClient';

export async function listHistory({ page = 1, limit = 10, result, search, sort = 'desc' }) {
  const response = await apiClient.get('/history', {
    params: { page, limit, result, search, sort },
  });
  return response.data.data;
}

export async function getHistoryGame(gameId) {
  const response = await apiClient.get(`/history/${gameId}`);
  return response.data.data;
}

export async function getHistoryPgn(gameId) {
  const response = await apiClient.get(`/history/${gameId}/pgn`);
  return response.data.data;
}

export async function getHistoryAnalysis(gameId) {
  const response = await apiClient.get(`/history/${gameId}/analysis`);
  return response.data.data;
}

export async function getHistoryReview(gameId) {
  const response = await apiClient.get(`/history/${gameId}/review`);
  return response.data.data;
}
