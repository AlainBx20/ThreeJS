import { defineConfig } from 'vite'

export default defineConfig({
  base: '/ThreeJS/', // Replace with your repository name
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three']
        }
      }
    }
  }
}) 