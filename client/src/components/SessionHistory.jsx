import React, { useEffect } from 'react';
import Icon from './Icon.jsx';

export default function SessionHistory({
  isOpen,
  history = [],
  onSelect,
  onClear,
  onClose,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="history-modal-title">
      <div className="modal-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <h2 id="history-modal-title" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Analysis history
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {history.length > 0 && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={onClear}
                aria-label="Clear all session history"
              >
                <Icon name="trash" size={13} />
                <span>Clear history</span>
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              aria-label="Close history modal"
            >
              <Icon name="x" size={13} />
              <span>Close</span>
            </button>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Only masked previews and scores are preserved in your local browser cache.
        </p>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '14px' }}>No past analysis sessions recorded in this browser.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                      {item.title}
                    </strong>
                    <span className="badge-chip" style={{ fontSize: '13px', padding: '1px 6px' }}>
                      Score {item.score}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {new Date(item.timestamp).toLocaleString()} • {item.findingsCount} findings
                  </div>
                  {item.maskedPreview && (
                    <div
                      style={{
                        fontSize: '13px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-secondary)',
                        marginTop: '4px',
                        maxHeight: '36px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.maskedPreview.slice(0, 110)}...
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
