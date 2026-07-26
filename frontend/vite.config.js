import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Keep imports stable as the app grows, without coupling files to deep relative paths.
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
      '@components': path.resolve(process.cwd(), 'src/components'),
      '@config': path.resolve(process.cwd(), 'src/config'),
      '@constants': path.resolve(process.cwd(), 'src/constants'),
      '@context': path.resolve(process.cwd(), 'src/context'),
      '@hooks': path.resolve(process.cwd(), 'src/hooks'),
      '@layouts': path.resolve(process.cwd(), 'src/layouts'),
      '@lib': path.resolve(process.cwd(), 'src/lib'),
      '@pages': path.resolve(process.cwd(), 'src/pages'),
      '@routes': path.resolve(process.cwd(), 'src/routes'),
      '@services': path.resolve(process.cwd(), 'src/services'),
      '@styles': path.resolve(process.cwd(), 'src/styles'),
      '@utils': path.resolve(process.cwd(), 'src/utils'),
    },
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
});
