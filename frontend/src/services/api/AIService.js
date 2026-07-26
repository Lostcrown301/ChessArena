import { apiClient } from './apiClient';

export async function explainAnalysis({ analysisId, context, playerColor, style = 'beginner' }) {
  const response = await apiClient.post(
    '/ai/explain',
    {
      analysisId,
      context,
      playerColor,
      style,
    },
    { timeout: 25000 },
  );

  return response.data.data;
}
