import React from 'react';

export default function EvidenceCard({
  finding,
  onVerifyFix = null,
  onApplyFix = null,
}) {
  const {
    evidenceId,
    severity = 'HIGH',
    explanation,
    ruleDetails,
    snippet,
    text,
    lineNumber,
    suggestedFix,
    groundTruthVerified = true,
  } = finding;

  const severityIcons = {
    CRITICAL: '🚨',
    HIGH: '⚠️',
    MEDIUM: '⚡',
    LOW: 'ℹ️',
  };

  const sevLower = severity.toLowerCase();

  return (
    <article className="evidence-card-item" aria-labelledby={`finding-title-${evidenceId}`}>
      <div className="evidence-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className="evidence-id-badge" id={`finding-title-${evidenceId}`}>
            {evidenceId}
          </span>
          <span className={`severity-pill ${sevLower}`}>
            <span aria-hidden="true">{severityIcons[severity] || '⚠️'}</span>
            <span>{severity}</span>
          </span>
          {lineNumber && (
            <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              Line {lineNumber}
            </span>
          )}
          {groundTruthVerified && (
            <span
              style={{
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(0, 229, 163, 0.1)',
                color: 'var(--accent-teal)',
                border: '1px solid rgba(0, 229, 163, 0.3)',
                fontWeight: 600,
              }}
            >
              ✓ Ground-Truth Verified
            </span>
          )}
        </div>
      </div>

      {/* Flagged snippet or text */}
      {(snippet || text) && (
        <div className="evidence-snippet" title="Flagged text sequence">
          {snippet || text}
        </div>
      )}

      {/* AI Explanation grounded on evidence */}
      <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 500 }}>
        {explanation}
      </p>

      {/* Underlying rule / CWE details */}
      {ruleDetails && ruleDetails !== explanation && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
          <strong>Scanner Rule:</strong> {ruleDetails}
        </p>
      )}

      {/* Suggested Fix Section for Code Auditor */}
      {suggestedFix && (
        <div style={{ marginTop: '12px', borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-teal)' }}>
              🛡️ Suggested Remediation
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {onVerifyFix && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onVerifyFix(finding)}
                  title="Run verification loop to prove score improvement"
                >
                  🔍 Verify Fix
                </button>
              )}
              {onApplyFix && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => onApplyFix(finding)}
                  title="Apply suggested fix into code editor"
                >
                  ⚡ Apply Fix
                </button>
              )}
            </div>
          </div>
          <pre
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--accent-teal)',
              whiteSpace: 'pre-wrap',
              overflowX: 'auto',
            }}
          >
            {suggestedFix}
          </pre>
        </div>
      )}
    </article>
  );
}
