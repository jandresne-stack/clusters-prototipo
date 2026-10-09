import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa para poder abrir el build como archivos estáticos
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173 },
});
