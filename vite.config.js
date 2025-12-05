/* eslint-disable no-undef */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@layouts': path.resolve(__dirname, 'src/layouts'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  // --- PHẦN THÊM MỚI Ở DƯỚI ĐÂY ---
  build: {
    chunkSizeWarningLimit: 2000, // Tăng giới hạn cảnh báo lên 2MB
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Tách các thư viện trong node_modules ra thành file riêng tên là vendor
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
  },
})
