import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  resolve: {
    alias: {
      '@nexus': '/src/nexus',
      '@rendering': '/src/rendering',
      '@services': '/src/services',
      '@ui': '/src/ui',
    },
  },
});
