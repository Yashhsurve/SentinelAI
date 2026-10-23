import React, { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

export default function ReportModal({ isOpen, reportData, onClose }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

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
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !reportData) return null;

  const downloadJsonReport = () => {
    const exportable = {
      generator: 'SentinelAI Security Report',
      timestamp: new Date().toISOString(),
      privacy: 'Client-side masked before export',
      report: reportData,
    };

    const blob = new Blob([JSON.stringify(exportable, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentinel-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div ref={modalRef} className="modal-content" style={{ maxWidth: '800px' }}>
        {/* Printable Report Header for print media */}
        <div className="printable-report-header">
          <img src="/logo.png" alt="" width="28" height="28" decoding="async" />
          <span>
            <strong>SentinelAI</strong> Security Incident and Audit Report
          </span>
        </div>

        <div
          className="report-modal-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/logo.png"
              alt=""
              width="26"
              height="26"
              decoding="async"
              className="report-logo-img"
            />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>
                SentinelAI
              </div>
              <h2
                id="report-modal-title"
                style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}
              >
                Security incident and audit report
              </h2>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Generated on {new Date().toLocaleString()}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handlePrint}>
              <Icon name="printer" size={14} />
              <span>Print</span>
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={downloadJsonReport}>
              <Icon name="download" size={14} />
              <span>Download JSON</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              aria-label="Close report"
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        </div>

        {/* Security Report Summary */}
        <div
          style={{
            padding: '14px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius)',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px',
            }}
          >
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Assessment verdict
              </span>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginTop: '2px',
                }}
              >
                {reportData.verdict || reportData.status || 'Analyzed'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {reportData.module === 'CodeShield' ? 'Security score' : 'Risk score'}
              </span>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '2px',
                }}
              >
                {reportData.riskScore ?? reportData.securityScore ?? 0} / 100
              </div>
            </div>

            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Verified findings
              </span>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginTop: '2px',
                }}
              >
                {reportData.findings?.length || 0} items
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Text */}
        {(reportData.explanation || reportData.summary) && (
          <div style={{ marginBottom: '16px' }}>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '4px',
              }}
            >
              Summary
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {reportData.explanation || reportData.summary}
            </p>
          </div>
        )}

        {/* Itemized Findings */}
        {reportData.findings && reportData.findings.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}
            >
              Findings ({reportData.findings.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {reportData.findings.map((f, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius)',
                    fontSize: '13px',
                    background: 'var(--bg-panel)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '2px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                      }}
                    >
                      [{f.evidenceId}] {f.subtype || f.evidenceType || 'Signal'}
                    </span>
                    <span className={`severity-pill ${(f.severity || 'HIGH').toLowerCase()}`}>
                      {f.severity}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>{f.explanation}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actionable Defense Checklist */}
        {reportData.checklist && reportData.checklist.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '6px',
              }}
            >
              Recommended actions
            </h3>
            <ul style={{ paddingLeft: '18px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              {reportData.checklist.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Masked Content */}
        {reportData.maskedPreview && (
          <div>
            <h3
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '4px',
              }}
            >
              Masked payload
            </h3>
            <pre
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                padding: '8px 12px',
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: 'var(--text-muted)',
                whiteSpace: 'pre-wrap',
                maxHeight: '120px',
                overflowY: 'auto',
              }}
            >
              {reportData.maskedPreview}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
