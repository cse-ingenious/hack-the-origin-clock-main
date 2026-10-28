import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Fixed ports (strictPort) so the page always opens at the SAME web address.
// The saved clock lives in the browser's storage for that address, which is
// what lets the clock resume after a power cut.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true, host: true },
  preview: { port: 4173, strictPort: true, host: true },
})
