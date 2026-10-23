import React from 'react';

export default function FixVerificationModal({
  isOpen,
  verificationData,
  finding,
  onApplyFix,
  onClose,
}) {
  if (!isOpen || !verificationData) return null;

  const {
    original = {},
    fixed = {},
    scoreImprovement = 0,
    isResolved = true,
    newIssuesIntroduced = [],
  } = verificationData;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="verify-modal-title">
      <div className="modal-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <h2 id="verify-modal-title" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            🔬 Fix Verification Loop (Deterministic Re-Audit)
          </h2>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label="Close Verification Modal"
          >
            ✕ Close
          </button>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
          SentinelAI re-ran the full deterministic security scanner on the remediated code to objectively prove score improvement before merging.
        </p>

        {/* Before / After Score Comparison Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: '16px',
            alignItems: 'center',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            textAlign: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Original Score
            </span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>
              {original.score ?? 0}
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Grade: {original.grade} | {original.issuesCount} issue(s)
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '1.4rem' }} aria-hidden="true">➡️</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: scoreImprovement >= 0 ? 'var(--accent-teal)' : 'var(--accent-red)',
              }}
            >
              {scoreImprovement >= 0 ? `+${scoreImprovement}` : scoreImprovement} pts
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Remediated Score
            </span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-teal)', fontFamily: 'var(--font-mono)' }}>
              {fixed.score ?? 100}
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Grade: {fixed.grade} | {fixed.issuesCount} issue(s)
            </span>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div
          style={{
            padding: '14px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            background: isResolved ? 'rgba(0, 229, 163, 0.12)' : 'rgba(255, 183, 3, 0.12)',
            border: `1px solid ${isResolved ? 'var(--accent-teal)' : 'var(--accent-amber)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '1.3rem' }} aria-hidden="true">
            {isResolved ? '✅' : '⚠️'}
          </span>
          <div>
            <strong style={{ color: isResolved ? 'var(--accent-teal)' : 'var(--accent-amber)', fontSize: '0.92rem' }}>
              {isResolved
                ? 'Deterministic Verification Passed: Vulnerability Completely Eliminated!'
                : 'Partial Remediation: Other issues remain in snippet.'}
            </strong>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', marginTop: '2px' }}>
              {newIssuesIntroduced.length > 0
                ? `Caution: Scanner detected ${newIssuesIntroduced.length} new issue(s) in the modified code.`
                : 'Zero regressions or newly introduced vulnerabilities detected.'}
            </p>
          </div>
        </div>

        {/* Remediation Snippet */}
        {finding?.suggestedFix && (
          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Verified Replacement Code:
            </span>
            <pre
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.84rem',
                color: 'var(--accent-teal)',
                whiteSpace: 'pre-wrap',
                marginTop: '8px',
              }}
            >
              {finding.suggestedFix}
            </pre>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onApplyFix(finding);
              onClose();
            }}
          >
            ⚡ Apply Verified Fix into Editor
          </button>
        </div>
      </div>
    </div>
  );
}
