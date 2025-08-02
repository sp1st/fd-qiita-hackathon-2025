import { reactRouter } from '@react-router/dev/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['@dnd-kit/core'],
    force: true,
  },
  server: {
    hmr: {
      port: 24678,
    },
    watch: {
      usePolling: true,
    },
  },
});
