import axios from 'axios';
import { env } from '@config/env';

export class ApiClientError extends Error {
  constructor({ message, status, code, details }) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptors centralize cross-cutting concerns before feature APIs exist.
apiClient.interceptors.request.use((config) => ({
  ...config,
  headers: {
    ...config.headers,
  },
}));

// Response interceptors normalize future API failures without making requests here.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      return Promise.reject(
        new ApiClientError({
          message: 'The request took too long to complete. Please try again.',
          status: 504,
          code: 'TIMEOUT',
          details: null,
        }),
      );
    }

    const response = error.response;
    const apiError = response?.data?.error;

    return Promise.reject(
      new ApiClientError({
        message: apiError?.message ?? error.message ?? 'Request failed',
        status: response?.status ?? 0,
        code: apiError?.code ?? 'API_REQUEST_FAILED',
        details: response?.data ?? null,
      }),
    );
  },
);
