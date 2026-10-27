import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import swc from 'unplugin-swc';

export default defineConfig({
  plugins: [tsconfigPaths(), swc.vite({ module: { type: 'es6' } })],
  test: {
    globals: true,
    env: { JWT_SECRET: 'e2e-test-secret-at-least-32-characters-long' },
    root: './',
    include: ['**/*.e2e-spec.ts'],
  },
});
