import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy song.link API requests in development
      // In production, Vercel Edge Function handles this
      '/api/songlink': {
        target: 'https://api.song.link',
        changeOrigin: true,
        rewrite: (path) => {
          // Extract the url parameter and forward to song.link
          const url = new URL(path, 'http://localhost');
          const targetUrl = url.searchParams.get('url');
          return `/v1-alpha.1/links?url=${encodeURIComponent(targetUrl || '')}`;
        },
      },
    },
  },
})
