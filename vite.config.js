import { defineConfig } from 'vite';

export default defineConfig({
  base: '/bande-architects/',
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      // the 3D engine changes rarely: its own file stays cached between site updates and loads in parallel
      output: { manualChunks: (id) => (id.includes('node_modules/three') || id.includes('node_modules/postprocessing') || id.includes('node_modules/n8ao') ? 'three' : undefined) },
    },
  },
});
