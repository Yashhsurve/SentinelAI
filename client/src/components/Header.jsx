import React from 'react';

export default function Header({ health, onOpenHistory, onOpenReport, hasResults }) {
  const isDemo = health?.mode?.includes('demo') || health?.mode?.includes('client-only');

  return (
    <header className="header-hero" role="banner">
      <div className="header-topbar">
        <div className="brand-wrapper">
          <div className="brand-icon-shield" aria-hidden="true">
            🛡️
          </div>
          <div>
            <h1 className="brand-title">SentinelAI</h1>
            <p className="brand-tagline">
              Autonomous Security Investigator for Messages and Code
            </p>
          </div>
        </div>

        <div className="header-badges">
          <div className="badge-chip privacy-shield" title="Client-Side Privacy Enforced">
            <span aria-hidden="true">🔒</span>
            <span>Privacy: Data masked in browser before sending</span>
          </div>

          <div className={`badge-chip ${isDemo ? 'demo-mode' : 'live-mode'}`}>
            <span className={`status-dot ${isDemo ? 'amber' : 'green'}`} aria-hidden="true"></span>
            <span>{isDemo ? 'Demo Mode (Rule-Based Fallback)' : `Gemini 2.5 Flash (Live)`}</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenHistory}
            aria-label="View Analysis History"
          >
            🕒 History
          </button>

          {hasResults && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onOpenReport}
              aria-label="Export or Print Security Report"
            >
              📄 Export Report
            </button>
          )}
        </div>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        <strong>Philosophy:</strong> <em>"AI proposes, code verifies, nothing leaves your browser unmasked."</em>
      </p>
    </header>
  );
}
