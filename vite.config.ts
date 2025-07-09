import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/app.ts'),
      name: 'TaskManagementAPI',
      fileName: 'app',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: [
        'express',
        'cors',
        'helmet',
        'uuid',
        'joi',
        'jsonwebtoken',
        'express-rate-limit',
        'dotenv',
      ],
    },
    target: 'node18',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
});
