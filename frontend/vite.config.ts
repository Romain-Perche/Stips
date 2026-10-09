import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Même rôle que frontend/vercel.json en production : le site et l'API
    // sous une seule origine. Le backend se lance avec `npm run dev -w backend`.
    proxy: {
      '/api': { target: 'http://localhost:3000', rewrite: (chemin) => chemin.replace(/^\/api/, '') },
    },
  },
})
