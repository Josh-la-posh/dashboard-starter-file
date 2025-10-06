import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

const plugins: PluginOption[] = [react(), tailwindcss()];
if (process.env.ANALYZE) {
  plugins.push(
    visualizer({ filename: 'dist/bundle-analysis.html', open: false }) as unknown as PluginOption
  );
}

export default defineConfig({
  base: './',
  plugins,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 600,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
            if (id.includes('node_modules/@tanstack/')) return 'tanstack';
            if (id.includes('node_modules/zod')) return 'zod';
          }
        }
      }
    }
  }
});