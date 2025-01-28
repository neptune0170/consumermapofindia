import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(),react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://65.0.179.91:9092',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/consumermapofindia'),
      },
    },
  },
})
