import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  base: '/grid-lock/',
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
