import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'three',
      'three/addons/controls/OrbitControls.js',
      'three/addons/loaders/GLTFLoader.js',
    ],
  },
  server: { allowedHosts: ['genesis.test'] },
  preview: { allowedHosts: ['genesis.test'] },
})
