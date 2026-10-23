import React from 'react';

export default function RiskGauge({
  score = 0,
  mode = 'risk', // 'risk' (0 safe, 100 scam) or 'security' (100 secure, 0 vuln)
  breakdown = {},
  grade = null,
  verdict = 'SAFE',
}) {
  // Semicircle geometry
  const radius = 75;
  const strokeWidth = 14;
  const arcLength = Math.PI * radius; // 180 degrees
  const offset = arcLength - (score / 100) * arcLength;

  // Determine colors and verdict styles
  let color = 'var(--accent-teal)';
  let verdictClass = 'safe';
  let accessibleText = '';

  if (mode === 'risk') {
    if (score >= 60) {
      color = 'var(--accent-red)';
      verdictClass = 'scam';
      accessibleText = `Severe Threat: Risk Score ${score} out of 100. High probability of scam or phishing.`;
    } else if (score >= 25) {
      color = 'var(--accent-amber)';
      verdictClass = 'suspicious';
      accessibleText = `Suspicious Threat: Risk Score ${score} out of 100. Potential phishing or coercion detected.`;
    } else {
      color = 'var(--accent-teal)';
      verdictClass = 'safe';
      accessibleText = `Low Threat: Risk Score ${score} out of 100. No major phishing indicators detected.`;
    }
  } else {
    // Security health mode (higher is better)
    if (score >= 80) {
      color = 'var(--accent-teal)';
      verdictClass = 'safe';
      accessibleText = `Code Security Health: ${score} out of 100. Grade ${grade || 'A'}. Clean security posture.`;
    } else if (score >= 50) {
      color = 'var(--accent-amber)';
      verdictClass = 'suspicious';
      accessibleText = `Code Security Health: ${score} out of 100. Grade ${grade || 'C'}. Security review required.`;
    } else {
      color = 'var(--accent-red)';
      verdictClass = 'scam';
      accessibleText = `Code Security Health: ${score} out of 100. Grade ${grade || 'F'}. Critical vulnerabilities detected.`;
    }
  }

  return (
    <div className="card gauge-card">
      <h2 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
        {mode === 'risk' ? 'Deterministic Threat Assessment' : 'Code Security Health Score'}
      </h2>

      {/* Accessible Meter Element with Screen Reader Description */}
      <div
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={accessibleText}
        className="gauge-svg-wrapper"
      >
        <svg viewBox="0 0 190 110" width="220" height="130" aria-hidden="true">
          {/* Background Track */}
          <path
            d="M 20 95 A 75 75 0 0 1 170 95"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Foreground Active Arc */}
          <path
            d="M 20 95 A 75 75 0 0 1 170 95"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease',
            }}
          />
        </svg>

        <div className="gauge-score-display">
          <span className="gauge-score-number" style={{ color }}>
            {score}
          </span>
          <span className="gauge-score-label">
            {mode === 'risk' ? 'Threat Score / 100' : `Security Score ${grade ? `(${grade})` : '/ 100'}`}
          </span>
        </div>
      </div>

      <div className={`gauge-verdict-banner ${verdictClass}`}>
        <span aria-hidden="true">
          {verdictClass === 'scam' ? '🚨' : verdictClass === 'suspicious' ? '⚠️' : '🛡️'}
        </span>
        <span>
          {mode === 'risk'
            ? verdict === 'SCAM'
              ? 'CRITICAL RISK SCAM'
              : verdict === 'SUSPICIOUS'
              ? 'SUSPICIOUS MESSAGE'
              : 'VERIFIED SAFE'
            : score >= 80
            ? 'PRISTINE / SECURE'
            : score >= 50
            ? 'NEEDS SECURITY AUDIT'
            : 'CRITICALLY VULNERABLE'}
        </span>
      </div>

      {/* Visible Deterministic Score Breakdown */}
      {breakdown && Object.keys(breakdown).length > 0 && (
        <div className="breakdown-list" aria-label="Score Factor Breakdown">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              DETERMINISTIC FACTOR BREAKDOWN
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>Code-Verified</span>
          </div>

          {Object.entries(breakdown).map(([key, val]) => {
            if (val === 0) return null;
            const labelMap = {
              urlThreats: 'URL Impersonation & TLDs',
              psychologicalManipulation: 'Urgency & Fear Coercion',
              credentialHarvesting: 'Credential & Payment Solicitation',
              impersonation: 'Brand & Authority Impersonation',
              promptInjection: 'Prompt Injection Hazards',
            };
            const label = labelMap[key] || key;
            const barWidth = Math.min(100, (val / 50) * 100);

            return (
              <div key={key}>
                <div className="breakdown-row">
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color }}>
                    +{val} pts
                  </span>
                </div>
                <div className="breakdown-bar-bg">
                  <div
                    className="breakdown-bar-fill"
                    style={{ width: `${barWidth}%`, backgroundColor: color }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
