/**
 * FixVerificationModal Component
 * Side-by-side comparison modal displaying score improvement,
 * diff lines, and remaining issues after applying suggested remediations.
 */
import React, { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

export default function FixVerificationModal({
  isOpen,
  verificationData,
  finding,
  onApplyFix,
  onClose,
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trapping
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Initial focus on close button or modal
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const firstBtn = modalRef.current.querySelector('button');
        firstBtn?.focus();
      }
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !verificationData) return null;

  const {
    original = {},
    fixed = {},
    scoreImprovement = 0,
    isResolved = true,
    newIssuesIntroduced = [],
  } = verificationData;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verify-modal-title"
    >
      <div className="modal-content" ref={modalRef}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
          }}
        >
          <h2
            id="verify-modal-title"
            style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}
          >
            Fix verification
          </h2>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label="Close verification modal"
          >
            <Icon name="x" size={14} />
            <span>Close</span>
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Re-analyzed the candidate remediation with the scanner to confirm score improvement.
        </p>

        {/* Before / After Score Comparison */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: '16px',
            alignItems: 'center',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            padding: '16px',
            borderRadius: 'var(--radius)',
            marginBottom: '16px',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Original score
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--status-danger-text)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {original.score ?? 0}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Grade: {original.grade} • {original.issuesCount} issue
              {original.issuesCount === 1 ? '' : 's'}
            </div>
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
          >
            <Icon name="arrow-right" size={16} className="text-secondary" />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                fontWeight: 600,
                color:
                  scoreImprovement >= 0
                    ? 'var(--status-success-text)'
                    : 'var(--status-danger-text)',
              }}
            >
              {scoreImprovement >= 0 ? `+${scoreImprovement}` : scoreImprovement} pts
            </span>
          </div>

          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Remediated score
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--status-success-text)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {fixed.score ?? 100}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Grade: {fixed.grade} • {fixed.issuesCount} issue{fixed.issuesCount === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius)',
            marginBottom: '16px',
            background: isResolved ? 'var(--status-success-bg)' : 'var(--status-warning-bg)',
            border: `1px solid ${isResolved ? 'var(--status-success-border)' : 'var(--status-warning-border)'}`,
            fontSize: '13px',
          }}
        >
          <strong
            style={{
              color: isResolved ? 'var(--status-success-text)' : 'var(--status-warning-text)',
            }}
          >
            {isResolved
              ? 'Verification passed: issue resolved.'
              : 'Partial remediation: other issues remain.'}
          </strong>
          <div style={{ color: 'var(--text-secondary)', marginTop: '2px', fontSize: '13px' }}>
            {newIssuesIntroduced.length > 0
              ? `Note: ${newIssuesIntroduced.length} new issue(s) detected in the changed code.`
              : 'Zero regressions or newly introduced issues.'}
          </div>
        </div>

        {/* Plain Diff with red / green tinted lines */}
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              marginBottom: '6px',
            }}
          >
            Diff comparison
          </div>
          <div
            style={{
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              lineHeight: 1.5,
            }}
          >
            {finding?.snippet && (
              <div
                style={{
                  background: 'var(--status-danger-bg)',
                  color: 'var(--status-danger-text)',
                  borderLeft: '3px solid var(--status-danger-text)',
                  padding: '6px 12px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                - {finding.snippet}
              </div>
            )}
            {finding?.suggestedFix && (
              <div
                style={{
                  background: 'var(--status-success-bg)',
                  color: 'var(--status-success-text)',
                  borderLeft: '3px solid var(--status-success-text)',
                  padding: '6px 12px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                + {finding.suggestedFix}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
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
            Apply fix
          </button>
        </div>
      </div>
    </div>
  );
}
