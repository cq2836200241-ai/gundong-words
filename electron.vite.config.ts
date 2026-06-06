import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    },
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        external: ['better-sqlite3', 'uiohook-napi']
      }
    }
  },
  preload: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    },
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared')
      }
    },
    server: {
      watch: {
        usePolling: true
      }
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: {
          'scroll-bar': resolve(__dirname, 'src/renderer/scroll-bar.html'),
          'detail': resolve(__dirname, 'src/renderer/detail.html'),
          'word-book': resolve(__dirname, 'src/renderer/word-book.html'),
          'settings': resolve(__dirname, 'src/renderer/settings.html')
        }
      }
    }
  }
});
