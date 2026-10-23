import React, { useState, useEffect, useMemo } from 'react';
import { maskSensitiveData } from '../../../shared/masking.js';
import { detectUrlThreats } from '../../../shared/detectors/urlDetector.js';
import { detectManipulationTactics } from '../../../shared/detectors/manipulationDetector.js';
import { classifyScamType } from '../../../shared/detectors/scamClassifier.js';
import { detectPromptInjection } from '../../../shared/detectors/promptInjectionDetector.js';
import { calculateMessageRiskScore } from '../../../shared/scoring.js';
import { analyzeMessageApi } from '../services/api.js';
import MaskedPreview from './MaskedPreview.jsx';
import RiskGauge from './RiskGauge.jsx';
import EvidenceCard from './EvidenceCard.jsx';
import AgentTrace from './AgentTrace.jsx';

export default function ThreatLens({ initialText = '', onSaveHistory = null }) {
  const [text, setText] = useState(initialText);
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [copiedRewrite, setCopiedRewrite] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  // Sync when initialText changes (e.g. from sample picker or history restore)
  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);

  // Instant Client-Side Privacy Masking
  const clientMask = useMemo(() => {
    return maskSensitiveData(text);
  }, [text]);

  // Instant Client-Side Deterministic Scanner (Instant feedback)
  const clientDeterministic = useMemo(() => {
    if (!text.trim()) return { evidence: [], riskScore: { score: 0, level: 'SAFE', breakdown: {} }, scamCategory: null };

    const urls = detectUrlThreats(text);
    const tactics = detectManipulationTactics(text);
    const scam = classifyScamType(text);
    const injection = detectPromptInjection(text);

    const allEvidence = [...urls, ...tactics, ...scam.evidence, ...injection];
    const riskScore = calculateMessageRiskScore(allEvidence);

    return {
      evidence: allEvidence,
      riskScore,
      scamCategory: scam.category,
    };
  }, [text]);

  // Execute full investigation pipeline (Client Mask -> Server Pipeline -> AI -> Verify)
  const handleInvestigate = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Send the masked text along with client mask counts to server
      const payload = {
        text: clientMask.maskedText,
        language,
        clientMaskCounts: clientMask.counts,
      };

      const result = await analyzeMessageApi(payload);
      setAnalysisResult(result);

      if (onSaveHistory) {
        onSaveHistory({
          type: 'message',
          title: result.scamCategory?.label || 'Message Investigation',
          verdict: result.verdict,
          score: result.riskScore,
          timestamp: new Date().toISOString(),
          maskedPreview: result.maskedPreview,
          findingsCount: result.findings?.length || 0,
        });
      }
    } catch (err) {
      setError(err.message || 'Investigation request failed');
    } finally {
      setLoading(false);
    }
  };

  // Render text with inline highlighted red flags
  const renderedMessageWithFlags = useMemo(() => {
    const raw = text;
    const evidenceList = analysisResult ? analysisResult.findings : clientDeterministic.evidence;

    if (!evidenceList || evidenceList.length === 0 || !raw) {
      return <span>{raw || 'Type or paste a message to inspect.'}</span>;
    }

    // Filter evidence items with valid text snippets
    const spansToHighlight = [];
    for (const ev of evidenceList) {
      if (ev.span && Array.isArray(ev.span) && ev.span.length === 2) {
        spansToHighlight.push({
          start: ev.span[0],
          end: ev.span[1],
          evidence: ev,
        });
      } else if (ev.text && raw.includes(ev.text)) {
        let index = raw.indexOf(ev.text);
        while (index !== -1) {
          spansToHighlight.push({
            start: index,
            end: index + ev.text.length,
            evidence: ev,
          });
          index = raw.indexOf(ev.text, index + 1);
        }
      }
    }

    if (spansToHighlight.length === 0) {
      return <span>{raw}</span>;
    }

    // Sort spans by start index
    spansToHighlight.sort((a, b) => a.start - b.start);

    // Build disjoint segments
    const elements = [];
    let cursor = 0;

    for (let i = 0; i < spansToHighlight.length; i++) {
      const { start, end, evidence } = spansToHighlight[i];
      if (start < cursor) continue; // Skip overlapping spans for clean rendering

      // Text before highlight
      if (start > cursor) {
        elements.push(<span key={`text-${cursor}`}>{raw.slice(cursor, start)}</span>);
      }

      // Highlighted flagged span
      const flaggedSnippet = raw.slice(start, end);
      elements.push(
        <mark
          key={`flag-${start}-${end}`}
          tabIndex={0}
          role="button"
          aria-haspopup="dialog"
          aria-label={`Security Alert: ${evidence.evidenceId} ${evidence.subtype || evidence.type}. Click for details.`}
          className={`flagged-highlight ${evidence.severity === 'MEDIUM' ? 'medium' : ''}`}
          onMouseEnter={() => setActiveTooltip(evidence)}
          onMouseLeave={() => setActiveTooltip(null)}
          onFocus={() => setActiveTooltip(evidence)}
          onBlur={() => setActiveTooltip(null)}
        >
          {flaggedSnippet}
        </mark>
      );

      cursor = end;
    }

    if (cursor < raw.length) {
      elements.push(<span key={`text-tail`}>{raw.slice(cursor)}</span>);
    }

    return elements;
  }, [text, analysisResult, clientDeterministic]);

  const copyDefanged = (defangedText) => {
    navigator.clipboard.writeText(defangedText);
    setCopiedRewrite(true);
    setTimeout(() => setCopiedRewrite(false), 2000);
  };

  const currentScore = analysisResult ? analysisResult.riskScore : clientDeterministic.riskScore.score;
  const currentVerdict = analysisResult ? analysisResult.verdict : clientDeterministic.riskScore.level;
  const currentCategory = analysisResult ? analysisResult.scamCategory : clientDeterministic.scamCategory;
  const currentBreakdown = analysisResult ? analysisResult.scoreBreakdown : clientDeterministic.riskScore.breakdown;
  const activeFindings = analysisResult ? analysisResult.findings : clientDeterministic.evidence;

  return (
    <section id="panel-messages" role="tabpanel" aria-labelledby="tab-messages">
      <div className="module-grid">
        {/* Left Column: Input and Highlighting */}
        <div>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <span aria-hidden="true">📩</span>
                <span>Pasted Message Input (SMS, WhatsApp, Email)</span>
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label htmlFor="lang-select" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Language:
                </label>
                <select
                  id="lang-select"
                  className="select-control"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  aria-label="Select explanation language"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="mr">मराठी (Marathi)</option>
                </select>
              </div>
            </div>

            <label htmlFor="message-input" className="input-label">
              Enter or paste message contents for autonomous fraud & phishing inspection:
            </label>
            <textarea
              id="message-input"
              className="textarea-field"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. SBI Alert: Your account KYC is expired. Update at http://sbi-kyc.xyz or share OTP to 9876543210..."
              rows={6}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {text.length} characters | {text.trim() ? text.trim().split(/\s+/).length : 0} words
              </span>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleInvestigate}
                disabled={loading || !text.trim()}
                aria-busy={loading}
              >
                {loading ? '⚡ Running Autonomous Pipeline...' : '🔍 Investigate Message with SentinelAI'}
              </button>
            </div>
          </div>

          {/* Privacy Masking Preview Banner */}
          <MaskedPreview maskResult={clientMask} />

          {/* Inline Highlighted Red-Flag Viewer */}
          {text.trim() && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <span aria-hidden="true">🚩</span>
                  <span>Inline Threat Inspector (Hover / Focus Flagged Phrases)</span>
                </h3>
                {activeFindings.length > 0 && (
                  <span className="badge-chip" style={{ background: 'rgba(255, 51, 102, 0.15)', color: 'var(--accent-red)' }}>
                    {activeFindings.length} Threat Flags Found
                  </span>
                )}
              </div>

              <div className="highlight-viewer-box" tabIndex={0} aria-label="Message with interactive threat highlights">
                {renderedMessageWithFlags}
              </div>

              {/* Active Hover / Focus Tooltip Details */}
              {activeTooltip && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '12px 14px',
                    background: 'var(--bg-card-hover)',
                    border: '1px solid var(--accent-red)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.86rem',
                    boxShadow: 'var(--shadow-red)',
                  }}
                  role="tooltip"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="evidence-id-badge">{activeTooltip.id || activeTooltip.evidenceId}</span>
                    <strong style={{ color: 'var(--accent-red)' }}>
                      {activeTooltip.subtype || activeTooltip.type}
                    </strong>
                    <span className="severity-pill critical">{activeTooltip.severity || 'HIGH'}</span>
                  </div>
                  <p style={{ color: 'var(--text-primary)' }}>
                    {activeTooltip.details || activeTooltip.explanation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Defanged Safe-to-Share Rewrite */}
          {analysisResult?.defangedRewrite && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <span aria-hidden="true">🛡️</span>
                  <span>Defanged Safe-to-Share Rewrite</span>
                </h3>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => copyDefanged(analysisResult.defangedRewrite)}
                  aria-label="Copy defanged message"
                >
                  {copiedRewrite ? '✓ Copied!' : '📋 Copy Defanged'}
                </button>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                All hyperlinks and numbers are neutralized with [.] and placeholders so this message can be safely archived or forwarded to fraud investigators.
              </p>
              <div className="defanged-box">
                {analysisResult.defangedRewrite}
              </div>
            </div>
          )}

          {/* Actionable Emergency Checklist */}
          {analysisResult?.checklist && analysisResult.checklist.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <span aria-hidden="true">📋</span>
                  <span>What To Do Now: Cyber Defense Checklist</span>
                </h3>
                <span className="badge-chip" style={{ background: 'rgba(0, 229, 163, 0.1)', color: 'var(--accent-teal)' }}>
                  National Helpline: 1930
                </span>
              </div>
              <div role="list">
                {analysisResult.checklist.map((item, idx) => (
                  <div key={idx} className="checklist-item" role="listitem">
                    <span className="checklist-icon" aria-hidden="true">☑</span>
                    <span style={{ color: 'var(--text-primary)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Score, Scam Category, Findings, Agent Trace */}
        <div>
          {/* Risk Gauge */}
          <RiskGauge
            score={currentScore}
            mode="risk"
            breakdown={currentBreakdown}
            verdict={currentVerdict}
          />

          {/* Scam Type Classification Badge */}
          {currentCategory && currentCategory.type !== 'none' && (
            <div className="card" style={{ borderColor: 'rgba(255, 183, 3, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.4rem' }} aria-hidden="true">🏷️</span>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Deterministic Threat Taxonomy
                  </span>
                  <h4 style={{ fontSize: '1.05rem', color: 'var(--accent-amber)', fontWeight: 700 }}>
                    {currentCategory.label}
                  </h4>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {currentCategory.description}
              </p>
            </div>
          )}

          {/* Plain-Language Explanation */}
          {analysisResult?.explanation && (
            <div className="card">
              <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '10px' }}>
                <span aria-hidden="true">🧠</span>
                <span>Verified Security Assessment</span>
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {analysisResult.explanation}
              </p>
            </div>
          )}

          {/* Ground-Truth Verified Evidence List */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <span aria-hidden="true">🔍</span>
                <span>Evidence-Grounded Findings</span>
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {activeFindings.length} item(s)
              </span>
            </div>

            {activeFindings.length === 0 ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                No active threats or malicious evidence detected.
              </p>
            ) : (
              activeFindings.map((finding, idx) => (
                <EvidenceCard key={finding.evidenceId || finding.id || idx} finding={finding} />
              ))
            )}
          </div>

          {/* Agent Activity Timeline */}
          {analysisResult?.agentTrace && (
            <AgentTrace
              agentTrace={analysisResult.agentTrace}
              unsupportedClaimsDropped={analysisResult.unsupportedClaimsDropped || 0}
              latencyMs={analysisResult.latencyMs || 0}
            />
          )}
        </div>
      </div>
    </section>
  );
}
