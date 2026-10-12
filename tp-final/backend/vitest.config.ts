import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret-para-vitest-1234',
      AI_MOCK_MODE: 'true',
      DATABASE_URL: 'file:./test.db',
    },
  },
});
