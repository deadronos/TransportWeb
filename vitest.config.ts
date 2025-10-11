import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import compression from 'vite-plugin-compression';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  resolve: {
    alias: {
      '@testing-library/jest-dom/vitest': fileURLToPath(
        new URL('./src/test/polyfills/jestDomMatchersEntrypoint.ts', import.meta.url),
      ),
    },
  },
  plugins: [
    react(),
    tsconfigPaths(),
    svgr(),
    compression({ algorithm: 'gzip' }),
    compression({ algorithm: 'brotliCompress', ext: '.br' }),
  ],
  test: {
    // Limit test discovery to our source and tests folders only. By default
    // Vitest uses a glob that can match files inside node_modules which will
    // attempt to run dependency tests (seen in CI and local dev). Explicitly
    // set `include` to only project paths and exclude node_modules and our
    // Playwright E2E tests which must be run with `npm run test:e2e`.
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: ['node_modules/**', 'tests/e2e/**'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    passWithNoTests: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'state-vendor': ['zustand', 'miniplex'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
