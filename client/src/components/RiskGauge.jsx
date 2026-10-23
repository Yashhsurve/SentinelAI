import React from 'react';

export default function RiskGauge({
  score = 0,
  mode = 'risk', // 'risk' (0 safe, 100 scam) or 'security' (100 secure, 0 vuln)
  breakdown = {},
  grade = null,
  verdict = 'SAFE',
}) {

  // Determine colors and verdict styles
  let statusClass = 'success';
  let statusLabel = 'Looks safe';
  let accessibleText = '';

  if (mode === 'risk') {
    if (score >= 60) {
      statusClass = 'danger';
      statusLabel = 'High risk';
      accessibleText = `Severe threat: Risk score ${score} out of 100. High probability of scam or phishing.`;
    } else if (score >= 25) {
      statusClass = 'warning';
      statusLabel = 'Suspicious';
      accessibleText = `Suspicious threat: Risk score ${score} out of 100. Potential phishing or coercion detected.`;
    } else {
      statusClass = 'success';
      statusLabel = 'Looks safe';
      accessibleText = `Low threat: Risk score ${score} out of 100. No major phishing indicators detected.`;
    }
  } else {
    // Security health mode (higher is better)
    if (score >= 80) {
      statusClass = 'success';
      statusLabel = 'Secure';
      accessibleText = `Code security health: ${score} out of 100. Grade ${grade || 'A'}. Clean posture.`;
    } else if (score >= 50) {
      statusClass = 'warning';
      statusLabel = 'Suspicious';
      accessibleText = `Code security health: ${score} out of 100. Grade ${grade || 'C'}. Security review needed.`;
    } else {
      statusClass = 'danger';
      statusLabel = 'High risk';
      accessibleText = `Code security health: ${score} out of 100. Grade ${grade || 'F'}. Critical vulnerabilities detected.`;
    }
  }

  const factorLabels = {
    urlThreats: 'URL impersonation and domains',
    psychologicalManipulation: 'Urgency and fear tactics',
    credentialHarvesting: 'Credential and payment requests',
    impersonation: 'Brand and authority claims',
    promptInjection: 'Prompt injection patterns',
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          {mode === 'risk' ? 'Risk assessment' : 'Security health score'}
        </h2>
        <span className={`status-chip ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      {/* Accessible Compact Meter */}
      <div className="meter-wrapper">
        <div className="meter-header">
          <span className="meter-number">{score}</span>
          <span className="meter-total">/100</span>
          {grade && (
            <span className="meter-label">Grade {grade}</span>
          )}
        </div>

        <div
          role="meter"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={accessibleText}
          className="meter-track"
        >
          <div
            className={`meter-fill ${statusClass}`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
      </div>

      {/* Clean Two-Column Breakdown Table */}
      {breakdown && Object.keys(breakdown).length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Score breakdown
          </div>
          <div className="breakdown-table-container">
            <table className="breakdown-table" aria-label="Score factor breakdown">
              <thead>
                <tr>
                  <th scope="col">Factor</th>
                  <th scope="col">Points</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(breakdown).map(([key, val]) => {
                  if (val === 0) return null;
                  const label = factorLabels[key] || key;
                  return (
                    <tr key={key}>
                      <td>{label}</td>
                      <td>+{val}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
