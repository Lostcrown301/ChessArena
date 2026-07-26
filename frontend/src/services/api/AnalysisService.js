import { apiClient } from './apiClient';

export async function analyzePosition({ depth = 12, fen, timeLimit = 3000 }) {
  const response = await apiClient.post(
    '/analysis',
    { depth, fen, timeLimit },
    { timeout: timeLimit + 15000 },
  );
  return response.data.data;
}
