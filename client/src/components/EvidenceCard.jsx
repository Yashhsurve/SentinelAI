import React, { useState } from 'react';
import Icon from './Icon.jsx';

export default function EvidenceCard({ finding, onVerifyFix = null, onApplyFix = null }) {
  const [expanded, setExpanded] = useState(false);

  const id = finding.evidenceId || finding.id || 'FINDING';
  const description =
    finding.explanation ||
    finding.details ||
    finding.ruleDetails ||
    finding.subtype ||
    finding.type;

  const {
    severity = 'HIGH',
    ruleDetails,
    snippet,
    text,
    lineNumber,
    suggestedFix,
    groundTruthVerified = true,
  } = finding;

  const sevLower = severity.toLowerCase();

  const whereText = lineNumber
    ? `Line ${lineNumber}`
    : text
      ? text.length > 20
        ? `${text.slice(0, 20)}...`
        : text
      : '—';

  return (
    <div className="finding-row">
      <div
        className="finding-summary"
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={expanded}
        aria-controls={`finding-details-${id}`}
      >
        <span className="finding-id">{id}</span>
        <span>
          <span className={`severity-pill ${sevLower}`}>{severity}</span>
        </span>
        <span className="finding-what">{description}</span>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}
        >
          <span className="finding-where">{whereText}</span>
          <Icon
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            className="text-secondary"
          />
        </div>
      </div>

      {expanded && (
        <div id={`finding-details-${id}`} className="finding-details">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
              Details
            </span>
            {groundTruthVerified && (
              <span
                style={{
                  fontSize: '13px',
                  color: 'var(--status-success-text)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Icon name="check" size={13} />
                <span>Verified against code scanner</span>
              </span>
            )}
          </div>

          <p style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>{description}</p>

          {ruleDetails && ruleDetails !== explanation && (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <strong>Scanner rule:</strong> {ruleDetails}
            </p>
          )}

          {(snippet || text) && <div className="evidence-snippet">{snippet || text}</div>}

          {suggestedFix && (
            <div
              style={{
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Suggested remediation
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {onVerifyFix && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onVerifyFix(finding);
                      }}
                    >
                      Verify fix
                    </button>
                  )}
                  {onApplyFix && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplyFix(finding);
                      }}
                    >
                      Apply fix
                    </button>
                  )}
                </div>
              </div>
              <pre
                style={{
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border-color)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  overflowX: 'auto',
                }}
              >
                {suggestedFix}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
