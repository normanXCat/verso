import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { preloadBrandFont } from './lib/font-preload.js';
import './index.css';

// Préchargement de la fonte du logotype, avant le premier rendu (anti-saut de mise en page).
preloadBrandFont();

// Service Worker : installation PWA et cache applicatif (repli hors ligne).
registerSW({ immediate: true });

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
