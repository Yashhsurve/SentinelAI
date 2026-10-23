/**
 * Header Component
 * Displays brand logo, application title, system health badge,
 * session history launcher, export report button, and dark mode toggle.
 */
import React from 'react';
import Icon from './Icon.jsx';

export default function Header({
  health,
  onOpenHistory,
  onOpenReport,
  hasResults,
  theme,
  onToggleTheme,
}) {
  const isDemo = health?.mode?.includes('demo') || health?.mode?.includes('client-only');

  return (
    <header className="header-hero" role="banner">
      <div className="header-topbar">
        <div className="brand-wrapper">
          <img
            src="/logo.png"
            alt=""
            width="28"
            height="28"
            decoding="async"
            className="brand-logo-img"
          />
          <div>
            <h1 className="brand-title">SentinelAI</h1>
            <p className="brand-tagline">Security investigator for messages and code</p>
          </div>
        </div>

        <div className="header-controls">
          <div
            className="status-indicator"
            title={isDemo ? 'Running in rule-based mode' : 'Connected to Gemini API'}
          >
            <span className={`status-dot ${isDemo ? 'amber' : 'green'}`} aria-hidden="true" />
            <span>{isDemo ? 'Rule-based mode' : 'Gemini connected'}</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm header-action-btn"
            onClick={onOpenHistory}
            aria-label="View analysis history"
          >
            <Icon name="history" size={15} />
            <span className="btn-label-desktop">History</span>
          </button>

          {hasResults && (
            <button
              type="button"
              className="btn btn-secondary btn-sm header-action-btn"
              onClick={onOpenReport}
              aria-label="Export report"
            >
              <Icon name="document" size={15} />
              <span className="btn-label-desktop">Export report</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm header-action-btn theme-toggle-btn"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={theme === 'dark'}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
