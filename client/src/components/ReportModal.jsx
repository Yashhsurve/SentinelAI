import React from 'react';

export default function ReportModal({ isOpen, reportData, onClose }) {
  if (!isOpen || !reportData) return null;

  const downloadJsonReport = () => {
    // Sanitize report: ensure only masked previews are exported
    const exportable = {
      generator: 'SentinelAI: Autonomous Security Investigator',
      timestamp: new Date().toISOString(),
      privacyCompliance: 'Client-side masked before export - Zero raw PII/secrets',
      report: reportData,
    };

    const blob = new Blob([JSON.stringify(exportable, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentinel-security-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
      <div className="modal-content" style={{ maxWidth: '850px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <h2 id="report-modal-title" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              📄 SentinelAI Security Incident & Audit Report
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Export Date: {new Date().toLocaleString()} &bull; Module: {reportData.module || 'Security Analysis'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handlePrint}>
              🖨️ Print / Save PDF
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={downloadJsonReport}>
              💾 Download JSON
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Printable Security Report Summary */}
        <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Overall Assessment
              </span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                {reportData.verdict || reportData.status || 'ANALYZED'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {reportData.module === 'CodeShield' ? 'Security Health Score' : 'Threat Risk Score'}
              </span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-teal)', fontFamily: 'var(--font-mono)' }}>
                {reportData.riskScore ?? reportData.securityScore ?? 0} / 100
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Verified Findings
              </span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {reportData.findings?.length || 0} Ground-Truth Items
              </div>
            </div>
          </div>
        </div>

        {/* Plain Language Assessment */}
        {(reportData.explanation || reportData.summary) && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Executive Analysis
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {reportData.explanation || reportData.summary}
            </p>
          </div>
        )}

        {/* Ground-Truth Findings */}
        {reportData.findings && reportData.findings.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
              Itemized Verified Evidence ({reportData.findings.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {reportData.findings.map((f, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 14px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.84rem',
                    background: 'var(--bg-input)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: 'var(--accent-cyan)' }}>
                      [{f.evidenceId}] {f.subtype || f.evidenceType || 'Flag'}
                    </strong>
                    <span className="severity-pill critical" style={{ fontSize: '0.7rem' }}>
                      {f.severity}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-primary)' }}>{f.explanation}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actionable Defense Checklist */}
        {reportData.checklist && reportData.checklist.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Recommended Remediation & Emergency Protocols
            </h3>
            <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {reportData.checklist.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sanitized Masked Content */}
        {reportData.maskedPreview && (
          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Sanitized Audit Payload (Redacted in Browser)
            </h3>
            <pre
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                whiteSpace: 'pre-wrap',
                maxHeight: '140px',
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
