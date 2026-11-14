import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' so the build works on GitHub Pages (any repo name) and from a local folder
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Firebase is only loaded when someone signs in (dynamic import) – keep it out of the main bundle
          if (/node_modules[\/](@firebase|firebase)[\/]/.test(id)) return 'firebase'
          if (id.includes('three') || id.includes('@react-three')) return 'three'
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
})
