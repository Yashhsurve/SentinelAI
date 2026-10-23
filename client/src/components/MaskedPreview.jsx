import React, { useState } from 'react';

export default function MaskedPreview({ maskResult }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!maskResult || maskResult.totalMasked === 0) {
    return (
      <div
        className="card"
        style={{ padding: '14px 18px', background: 'rgba(0, 242, 254, 0.04)', borderColor: 'rgba(0, 242, 254, 0.2)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <span aria-hidden="true">🔒</span>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Browser Privacy Shield:</span>
          <span style={{ color: 'var(--text-secondary)' }}>
            No raw sensitive entities detected. Client-side privacy filter active.
          </span>
        </div>
      </div>
    );
  }

  const { counts, totalMasked, maskedText } = maskResult;

  return (
    <div className="card" style={{ padding: '16px 20px', borderColor: 'rgba(0, 242, 254, 0.3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }} aria-hidden="true">🛡️</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.92rem' }}>
                Masked in Browser Before Sending
              </span>
              <span className="badge-chip" style={{ background: 'rgba(0, 242, 254, 0.15)', color: 'var(--accent-cyan)' }}>
                {totalMasked} Redacted
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
              {counts.email > 0 && <span className="severity-pill low">📧 {counts.email} Email(s)</span>}
              {counts.phone > 0 && <span className="severity-pill low">📞 {counts.phone} Phone(s)</span>}
              {counts.aadhaar > 0 && <span className="severity-pill high">🪪 {counts.aadhaar} Aadhaar</span>}
              {counts.pan > 0 && <span className="severity-pill high">📑 {counts.pan} PAN</span>}
              {counts.card > 0 && <span className="severity-pill critical">💳 {counts.card} Card(s)</span>}
              {counts.secret > 0 && <span className="severity-pill critical">🔑 {counts.secret} Secret(s)</span>}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="masked-text-preview"
        >
          {isOpen ? 'Hide Redacted Preview' : '👁️ View Redacted Preview'}
        </button>
      </div>

      {isOpen && (
        <div id="masked-text-preview" style={{ marginTop: '14px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
            The raw text below is what will be transmitted to the server. Sensitive tokens have been replaced with non-invertible placeholders:
          </p>
          <pre
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              maxHeight: '200px',
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
