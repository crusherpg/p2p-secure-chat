import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        timeout: 10000,
        rewrite: (path) => path // Keep /api prefix
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
        secure: false
      }
    }
  },
  define: {
    // Make environment variables available at build time
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.1.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'], 
          socket: ['socket.io-client'],
          ui: ['lucide-react', 'react-hot-toast']
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'socket.io-client',
      'axios',
      'lucide-react',
      'react-hot-toast'
    ]
  }
})