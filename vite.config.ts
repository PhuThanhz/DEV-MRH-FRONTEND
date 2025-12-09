import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss()],
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
