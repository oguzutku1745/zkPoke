// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,          // beforeAll / describe içe aktarmadan kullanmak istiyorsanız
    testTimeout: 330_000,
    include: ['tests/**/*.test.ts'], // varsayılan zaten bu
  },
});

