import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import App from './App.jsx';
import './index.css';

// Apply theme synchronously before React renders to avoid flash
try {
  const saved = localStorage.getItem('sentinel-theme');
  const preferred = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const theme = saved === 'dark' || saved === 'light' ? saved : preferred;
  document.documentElement.setAttribute('data-theme', theme);
} catch {
  // LocalStorage error fallback
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
