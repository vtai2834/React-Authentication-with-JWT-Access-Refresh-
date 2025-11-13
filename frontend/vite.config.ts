import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/React-Authentication-with-JWT-Access-Refresh-/", // ví dụ: /my-vite-app/
})
