/**
 * MaskedPreview Component
 * Privacy protection banner showing counts of masked credentials,
 * with collapsible preview of anonymized replacement tokens.
 */
import React, { useState } from 'react';

export default function MaskedPreview({ maskResult }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!maskResult || maskResult.totalMasked === 0) {
    return (
      <div className="card" style={{ padding: '12px 16px', background: 'var(--bg-subtle)' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          No sensitive items detected. Client-side privacy filter is active.
        </div>
      </div>
    );
  }

  const { counts, totalMasked, maskedText } = maskResult;

  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
              Privacy protection
            </span>
            <span className="status-chip info" style={{ fontSize: '13px' }}>
              {totalMasked === 1
                ? '1 sensitive item was masked before analysis'
                : `${totalMasked} sensitive items were masked before analysis`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
            {counts.email > 0 && <span className="severity-pill low">{counts.email} email</span>}
            {counts.phone > 0 && <span className="severity-pill low">{counts.phone} phone</span>}
            {counts.aadhaar > 0 && (
              <span className="severity-pill medium">{counts.aadhaar} Aadhaar</span>
            )}
            {counts.pan > 0 && <span className="severity-pill medium">{counts.pan} PAN</span>}
            {counts.card > 0 && <span className="severity-pill critical">{counts.card} card</span>}
            {counts.secret > 0 && (
              <span className="severity-pill critical">{counts.secret} credential</span>
            )}
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="masked-text-preview"
        >
          {isOpen ? 'Hide masked preview' : 'View masked preview'}
        </button>
      </div>

      {isOpen && (
        <div id="masked-text-preview" style={{ marginTop: '12px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
            Sensitive values have been replaced with anonymous tokens in your browser:
          </p>
          <pre
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              padding: '10px 12px',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              maxHeight: '160px',
              overflowY: 'auto',
            }}
          >
            {maskedText}
          </pre>
        </div>
      )}
    </div>
  );
}
