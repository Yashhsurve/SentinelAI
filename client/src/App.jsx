import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import TabNavigation from './components/TabNavigation.jsx';
import ThreatLens from './components/ThreatLens.jsx';
import CodeShield from './components/CodeShield.jsx';
import SessionHistory from './components/SessionHistory.jsx';
import ReportModal from './components/ReportModal.jsx';
import { SAMPLES } from './sampleData.js';
import { fetchHealth } from './services/api.js';

const STORAGE_KEY = 'sentinel_ai_history_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState('messages');
  const [health, setHealth] = useState(null);
  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [activeReportData, setActiveReportData] = useState(null);
  const [announcement, setAnnouncement] = useState('');

  // Theme State (Dark / Light)
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('sentinel-theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const nextColor = nextTheme === 'dark' ? '#0E1116' : '#F6F7F9';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem('sentinel-theme', nextTheme);
    } catch {}
    const metaThemes = document.querySelectorAll('meta[name="theme-color"]');
    metaThemes.forEach((meta) => {
      meta.setAttribute('content', nextColor);
      meta.removeAttribute('media');
    });
  };

  // Sample data passed into active module
  const [messageInput, setMessageInput] = useState('');
  const [codeInput, setCodeInput] = useState('');

  // 1. Load Health and LocalStorage History on Mount
  useEffect(() => {
    fetchHealth().then((h) => setHealth(h));

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      // LocalStorage error fallback
    }
  }, []);

  // Save session to history (only masked content)
  const handleSaveHistory = (session) => {
    try {
      const updated = [
        { id: `hist_${Date.now()}`, ...session },
        ...history.slice(0, 19), // Keep latest 20 items
      ];
      setHistory(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setActiveReportData(session);
      setAnnouncement(`Security analysis completed: ${session.title} (Score: ${session.score})`);
    } catch {
      // Ignore storage errors
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    setAnnouncement('Analysis session history cleared.');
  };

  // Restore session from history
  const handleRestoreSession = (item) => {
    if (item.type === 'message') {
      setActiveTab('messages');
      setMessageInput(item.maskedPreview || '');
    } else {
      setActiveTab('code');
      setCodeInput(item.maskedPreview || '');
    }
    setAnnouncement(`Restored session: ${item.title}`);
  };

  // One-Click Sample Data Loaders
  const loadSample = (sampleKey) => {
    const sample = SAMPLES[sampleKey];
    if (!sample) return;

    if (sampleKey === 'scamMessage' || sampleKey === 'safeMessage' || sampleKey === 'promptInjection') {
      setActiveTab('messages');
      setMessageInput(sample.text);
      setAnnouncement(`Loaded sample: ${sample.label}`);
    } else if (sampleKey === 'vulnerableCode') {
      setActiveTab('code');
      setCodeInput(sample.code);
      setAnnouncement(`Loaded sample: ${sample.label}`);
    }
  };

  return (
    <>
      {/* Skip to Content Link for WCAG AA Accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Screen Reader ARIA Live Status Announcer */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {announcement}
      </div>

      <div className="app-container">
        {/* Header Hero Component */}
        <Header
          health={health}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenReport={() => setIsReportOpen(true)}
          hasResults={Boolean(activeReportData)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        {/* Quick Example Samples Bar */}
        <section className="samples-bar" aria-label="Example demonstrations">
          <span className="samples-label">Try an example:</span>
          <button
            type="button"
            className="sample-link-btn"
            onClick={() => loadSample('scamMessage')}
          >
            Scam SMS
          </button>
          <span style={{ color: 'var(--border-color)' }}>•</span>
          <button
            type="button"
            className="sample-link-btn"
            onClick={() => loadSample('safeMessage')}
          >
            Safe SMS
          </button>
          <span style={{ color: 'var(--border-color)' }}>•</span>
          <button
            type="button"
            className="sample-link-btn"
            onClick={() => loadSample('vulnerableCode')}
          >
            Vulnerable code
          </button>
          <span style={{ color: 'var(--border-color)' }}>•</span>
          <button
            type="button"
            className="sample-link-btn"
            onClick={() => loadSample('promptInjection')}
          >
            Prompt injection test
          </button>
        </section>

        {/* Tab Navigation (ARIA Accessible) */}
        <TabNavigation activeTab={activeTab} onSelectTab={(tabId) => setActiveTab(tabId)} />

        {/* Main Content Area */}
        <main id="main-content">
          {activeTab === 'messages' ? (
            <ThreatLens
              initialText={messageInput}
              onSaveHistory={handleSaveHistory}
            />
          ) : (
            <CodeShield
              initialCode={codeInput}
              onSaveHistory={handleSaveHistory}
            />
          )}
        </main>

        {/* Quiet Footer with Tagline and Privacy Guarantee */}
        <footer className="app-footer" role="contentinfo">
          <div className="footer-brand">
            <img
              src="/logo.png"
              alt=""
              width="20"
              height="20"
              decoding="async"
              className="footer-logo-img"
            />
            <strong>SentinelAI</strong>
            <span className="footer-divider">•</span>
            <span>AI proposes, code verifies, nothing leaves your browser unmasked.</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Client-side privacy: Sensitive tokens, credentials, and numbers are masked in your browser prior to inspection.
          </div>
        </footer>

        {/* Session History Modal */}
        <SessionHistory
          isOpen={isHistoryOpen}
          history={history}
          onSelect={handleRestoreSession}
          onClear={handleClearHistory}
          onClose={() => setIsHistoryOpen(false)}
        />

        {/* Report Export Modal */}
        <ReportModal
          isOpen={isReportOpen}
          reportData={activeReportData}
          onClose={() => setIsReportOpen(false)}
        />
      </div>
    </>
  );
}
