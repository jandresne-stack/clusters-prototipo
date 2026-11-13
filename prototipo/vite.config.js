import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa para poder abrir el build como archivos estáticos
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    // Agentes reales: el motor es el Panel de Agentes AMD (agency-agents/panel, puerto 3010).
    // La llave de OpenRouter vive allí; Clusters nunca la ve.
    proxy: { '/api': 'http://localhost:3010' },
  },
});
