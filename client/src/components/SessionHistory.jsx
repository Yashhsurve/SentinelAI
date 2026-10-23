import React from 'react';

export default function SessionHistory({
  isOpen,
  history = [],
  onSelect,
  onClear,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="history-modal-title">
      <div className="modal-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <h2 id="history-modal-title" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            🕒 Analysis History (Client LocalStorage Only)
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {history.length > 0 && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={onClear}
                aria-label="Clear all session history"
              >
                🗑️ Clear History
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              aria-label="Close History Modal"
            >
              ✕ Close
            </button>
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          🔒 <strong>Privacy Guarantee:</strong> Only client-masked payloads and deterministic scores are preserved in your local browser cache. No raw credentials or database storage ever exist.
        </p>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }} aria-hidden="true">
              📂
            </span>
            <p>No past analysis sessions recorded in this browser.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {history.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.1rem' }}>{item.type === 'message' ? '💬' : '💻'}</span>
                    <strong style={{ fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                      {item.title}
                    </strong>
                    <span className="badge-chip" style={{ fontSize: '0.72rem' }}>
                      Score: {item.score}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {new Date(item.timestamp).toLocaleString()} &bull; {item.findingsCount} findings
                  </div>
                  {item.maskedPreview && (
                    <div
                      style={{
                        fontSize: '0.78rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-secondary)',
                        marginTop: '6px',
                        maxHeight: '40px',
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
                  ⚡ Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
