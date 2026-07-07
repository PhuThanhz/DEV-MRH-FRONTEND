import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    tailwindcss(),
    nodePolyfills({
      include: ['stream', 'crypto', 'util', 'buffer', 'vm'],
    }),
  ],
  build: {
    modulePreload: {
      resolveDependencies(_, deps) {
        return deps.filter(
          (dep) =>
            !dep.includes('charts') &&
            !dep.includes('pro-components') &&
            !dep.includes('pdf') &&
            !dep.includes('excel') &&
            !dep.includes('websocket') &&
            !dep.includes('qr') &&
            !dep.includes('flow')
        );
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          antd: ['antd', '@ant-design/icons'],
          'pro-components': ['@ant-design/pro-components'],
          charts: ['@ant-design/charts'],
          flow: ['@xyflow/react', 'reactflow'],
          pdf: ['@react-pdf-viewer/core', '@react-pdf-viewer/default-layout', 'pdfjs-dist'],
          excel: ['xlsx', 'xlsx-js-style'],
          query: ['@tanstack/react-query', '@reduxjs/toolkit', 'react-redux'],
          utils: ['axios', 'dayjs', 'lodash-es', 'query-string'],
          qr: ['html5-qrcode'],
          orgchart: ['dagre'],
          websocket: ['sockjs-client', '@stomp/stompjs'],
        },
      },
    },
  },
  server: {
    host: true, // cho phép truy cập từ thiết bị khác trong cùng mạng LAN
    port: 3000,
    strictPort: true, // tránh tự đổi port khi 3000 đang dùng
  },
  css: {
    preprocessorOptions: {
      scss: {
        // api: 'modern-compiler',
      },
    },
  },
})
