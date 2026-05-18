/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (
              id.includes('react-router-dom') ||
              id.includes('react-dom') ||
              id.includes('/react/')
            ) {
              return 'react-vendor';
            }
            if (id.includes('@tanstack/react-query') || id.includes('axios')) {
              return 'query-vendor';
            }
            if (
              id.includes('react-hook-form') ||
              id.includes('@hookform/resolvers') ||
              id.includes('/zod/')
            ) {
              return 'form-vendor';
            }
          }
          return undefined;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.tsx',
        '**/*.test.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/__tests__/**',
        '**/types.ts',
      ],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});
