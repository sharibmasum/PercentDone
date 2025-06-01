import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Uncomment and modify the base path if deploying to GitHub Pages
  // base: '/PercentDone/',
})
