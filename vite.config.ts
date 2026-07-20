import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages (https://<user>.github.io/henteko-website/) のサブパス配信に合わせる
  base: '/henteko-website/',
  plugins: [react()],
})
