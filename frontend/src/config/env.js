export const env = {
  appName: import.meta.env.VITE_APP_NAME ?? 'Chess Arena',
  // Vite exposes browser-safe environment variables only when they use the VITE_ prefix.
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000',
};
