import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { SesionProvider } from './context/SesionContext.jsx';
import { App } from './App.jsx';
import './styles/app.css';

// HashRouter: el build se abre como archivos estáticos (base './'), sin servidor que reescriba rutas.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <SesionProvider>
        <App />
      </SesionProvider>
    </HashRouter>
  </React.StrictMode>,
);
