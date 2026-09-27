import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// vite-plugin-pwa gestisce automaticamente la registrazione del Service Worker con scope e base path corretti tramite registerSW.js

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
