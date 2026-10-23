import React from 'react';
import Icon from './Icon.jsx';

export default function Header({ health, onOpenHistory, onOpenReport, hasResults }) {
  const isDemo = health?.mode?.includes('demo') || health?.mode?.includes('client-only');

  return (
    <header className="header-hero" role="banner">
      <div className="header-topbar">
        <div className="brand-wrapper">
          <div className="brand-icon-shield" aria-hidden="true">
            <Icon name="shield" size={20} />
          </div>
          <div>
            <h1 className="brand-title">SentinelAI</h1>
            <p className="brand-tagline">
              Security investigator for messages and code
            </p>
          </div>
        </div>

        <div className="header-controls">
          <div className="status-indicator" title={isDemo ? 'Running in rule-based mode' : 'Connected to Gemini API'}>
            <span className={`status-dot ${isDemo ? 'amber' : 'green'}`} aria-hidden="true" />
            <span>{isDemo ? 'Rule-based mode' : 'Gemini connected'}</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenHistory}
            aria-label="View analysis history"
          >
            <Icon name="history" size={14} />
            <span>History</span>
          </button>

          {hasResults && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onOpenReport}
              aria-label="Export report"
            >
              <Icon name="document" size={14} />
              <span>Export report</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

