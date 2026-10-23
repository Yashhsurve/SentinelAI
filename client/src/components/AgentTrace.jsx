import React from 'react';

export default function AgentTrace({
  agentTrace = [],
  unsupportedClaimsDropped = 0,
  latencyMs = 0,
}) {
  if (!agentTrace || agentTrace.length === 0) return null;

  return (
    <div className="card" style={{ marginTop: '16px' }}>
      <div className="card-header">
        <h3 className="card-title">Agent activity</h3>
        <span
          style={{
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
          }}
        >
          Total duration: {latencyMs}ms
        </span>
      </div>

      {unsupportedClaimsDropped > 0 && (
        <div
          style={{
            padding: '8px 12px',
            background: 'var(--status-warning-bg)',
            border: '1px solid var(--status-warning-border)',
            borderRadius: 'var(--radius)',
            marginBottom: '12px',
            fontSize: '13px',
            color: 'var(--status-warning-text)',
          }}
        >
          Anti-hallucination shield: {unsupportedClaimsDropped} unsupported AI claim(s) were dropped
          because they lacked code evidence.
        </div>
      )}

      <div className="agent-trace-list" role="list" aria-label="Agent execution steps">
        {agentTrace.map((trace, idx) => {
          const isFallback = trace.status === 'FALLBACK';

          return (
            <div key={idx} className="agent-trace-item" role="listitem">
              <span className="agent-trace-step">{trace.step}</span>
              <span className={`status-dot ${isFallback ? 'amber' : 'green'}`} aria-hidden="true" />
              <span className="agent-trace-note">{trace.note}</span>
              <span className="agent-trace-duration">{trace.durationMs}ms</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
