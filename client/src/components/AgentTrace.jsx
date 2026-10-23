import React from 'react';

export default function AgentTrace({ agentTrace = [], unsupportedClaimsDropped = 0, latencyMs = 0 }) {
  if (!agentTrace || agentTrace.length === 0) return null;

  return (
    <div className="card" style={{ marginTop: '24px' }}>
      <div className="card-header">
        <h3 className="card-title">
          <span aria-hidden="true">⚡</span>
          <span>Autonomous Agent Activity Timeline</span>
        </h3>
        <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
          Total Pipeline Latency: {latencyMs}ms
        </span>
      </div>

      <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
        Step-by-step telemetry executing the SentinelAI agentic loop: <strong>DETECT &rarr; MASK &rarr; REASON &rarr; VERIFY &rarr; REPORT</strong>.
      </p>

      {unsupportedClaimsDropped > 0 && (
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(255, 51, 102, 0.15)',
            border: '1px solid var(--accent-red)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '12px',
            fontSize: '0.85rem',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span aria-hidden="true">🛡️</span>
          <span>
            <strong>Anti-Hallucination Shield Active:</strong> {unsupportedClaimsDropped} unsupported AI claim(s) were automatically dropped because they lacked deterministic code evidence.
          </span>
        </div>
      )}

      <div className="agent-trace-container" role="list" aria-label="Agent Execution Steps">
        {agentTrace.map((trace, idx) => {
          const isFallback = trace.status === 'FALLBACK';
          const isCache = trace.step === 'CACHE';

          return (
            <div key={idx} className="trace-step-item" role="listitem">
              <span
                className="trace-step-badge"
                style={{
                  background: isFallback
                    ? 'rgba(255, 183, 3, 0.15)'
                    : isCache
                    ? 'rgba(139, 92, 246, 0.15)'
                    : 'rgba(0, 242, 254, 0.12)',
                  color: isFallback
                    ? 'var(--accent-amber)'
                    : isCache
                    ? 'var(--accent-purple)'
                    : 'var(--accent-cyan)',
                  borderColor: isFallback
                    ? 'var(--accent-amber)'
                    : isCache
                    ? 'var(--accent-purple)'
                    : 'var(--accent-cyan)',
                }}
              >
                {trace.step}
              </span>

              <div className="trace-step-content">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {trace.note}
                  </span>
                  <span className="trace-step-duration">
                    {trace.durationMs}ms
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
