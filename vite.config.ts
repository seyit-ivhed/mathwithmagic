import fs from 'fs'
import { defineConfig, createLogger } from 'vite'
import react from '@vitejs/plugin-react'

const logger = createLogger()

logger.warn = (msg) => {
  // Fail the build on any warnings
  throw new Error(msg)
}

const useHttps =
  !process.env.VITE_NO_HTTPS &&
  fs.existsSync('./localhost+1-key.pem') &&
  fs.existsSync('./localhost+1.pem')

export default defineConfig({
  plugins: [react()],
  customLogger: logger,
  server: {
    host: '127.0.0.1',
    ...(useHttps && {
      https: {
        key: fs.readFileSync('./localhost+1-key.pem'),
        cert: fs.readFileSync('./localhost+1.pem'),
      },
    }),
  },
  build: {
    rollupOptions: {
      input: {
        main: '/index.html',
        checkout: '/checkout.html',
      },
      output: {
        manualChunks: {
          'vendor-router': ['react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-utils': ['framer-motion', 'zustand', 'i18next', 'react-i18next'],
          'vendor-ui': ['lucide-react'],
          'vendor-particles': ['tsparticles', '@tsparticles/react', '@tsparticles/engine'],
        },
      },
      onwarn(warning) {
        // Ignore circular dependency warnings from node_modules
        if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.message.includes('node_modules')) {
          return;
        }
        // Fail the build on any other rollup warnings
        throw new Error(warning.message);
      },
    },
  },
})
