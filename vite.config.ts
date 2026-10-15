import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Set VITE_API_PROXY=http://localhost:3000 to use real server auth during `npm run dev`.
  const apiProxy = env.VITE_API_PROXY;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: apiProxy ? { proxy: { '/api': { target: apiProxy, changeOrigin: false } } } : undefined,
  };
});
