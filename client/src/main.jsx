import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Graceful error logging
    if (typeof console !== 'undefined' && console.error) {
      console.error('SentinelAI UI Error caught by boundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-page, #0E1116)',
            color: 'var(--text-primary, #E6EAF0)',
            fontFamily: 'var(--font-sans, system-ui, sans-serif)',
          }}
        >
          <h2 style={{ fontSize: '20px', marginBottom: '12px', fontWeight: 600 }}>
            Something went wrong
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: 'var(--text-secondary, #9AA4B2)',
              maxWidth: '440px',
              marginBottom: '20px',
              lineHeight: 1.5,
            }}
          >
            SentinelAI encountered an unexpected display error. Your inspected code and messages remain securely in your browser.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--accent, #5B8DEF)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Reload application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
