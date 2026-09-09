import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/domains': resolve(__dirname, 'src/domains'),
      '@/services': resolve(__dirname, 'src/services'),
      '@/store': resolve(__dirname, 'src/store'),
      '@/tokens': resolve(__dirname, 'src/tokens/index'),
      '@/i18n': resolve(__dirname, 'src/i18n/index'),
      '@/infrastructure': resolve(__dirname, 'src/infrastructure'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/hooks': resolve(__dirname, 'src/hooks'),
      '@/app': resolve(__dirname, 'app'),
    },
  },
  build: {
    outDir: 'www',
    target: 'esnext',
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-ionic': ['@ionic/react', '@ionic/react-router'],
          'vendor-capacitor': ['@capacitor/core', '@capacitor/app', '@capacitor/network', '@capacitor/haptics', '@capacitor/keyboard', '@capacitor/status-bar'],
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-zustand': ['zustand'],
          'vendor-i18n': ['i18next', 'react-i18next'],
          // InsForge SDK isolated
          'vendor-insforge': ['@insforge/sdk'],
          // Icon library
          'vendor-ionicons': ['ionicons'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
  server: {
    port: 3000,
  },
});
