import React, { useState, useEffect, useMemo, useRef } from 'react';
import { maskSensitiveData } from '../../../shared/masking.js';
import { scanCodeSecrets } from '../../../shared/detectors/codeSecretScanner.js';
import { scanCodeVulnerabilities } from '../../../shared/detectors/codeVulnerabilityScanner.js';
import { detectPromptInjection } from '../../../shared/detectors/promptInjectionDetector.js';
import { calculateCodeSecurityScore } from '../../../shared/scoring.js';
import { analyzeCodeApi, verifyFixApi } from '../services/api.js';
import MaskedPreview from './MaskedPreview.jsx';
import RiskGauge from './RiskGauge.jsx';
import EvidenceCard from './EvidenceCard.jsx';
import AgentTrace from './AgentTrace.jsx';
import FixVerificationModal from './FixVerificationModal.jsx';

export default function CodeShield({ initialCode = '', onSaveHistory = null }) {
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [activeVerification, setActiveVerification] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    }
  }, [initialCode]);

  // Instant Client-Side Privacy Masking
  const clientMask = useMemo(() => {
    return maskSensitiveData(code);
  }, [code]);

  // Instant Client-Side Deterministic Scanner
  const clientDeterministic = useMemo(() => {
    if (!code.trim()) {
      return { evidence: [], securityScore: { score: 100, grade: 'A', status: 'SECURE', deductions: [] } };
    }

    const secrets = scanCodeSecrets(code);
    const vulns = scanCodeVulnerabilities(code);
    const injection = detectPromptInjection(code);

    const allEvidence = [...secrets, ...vulns, ...injection];
    const securityScore = calculateCodeSecurityScore(allEvidence);

    return {
      evidence: allEvidence,
      securityScore,
    };
  }, [code]);

  // Full Code Audit Pipeline (Mask in Browser -> Server Pipeline -> Gemini -> Verify)
  const handleAuditCode = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const payload = {
        code: clientMask.maskedText,
        language: 'en',
        clientMaskCounts: clientMask.counts,
      };

      const result = await analyzeCodeApi(payload);
      setAnalysisResult(result);

      if (onSaveHistory) {
        onSaveHistory({
          type: 'code',
          title: `Code Audit: Grade ${result.grade || 'N/A'} (${result.securityScore}/100)`,
          verdict: result.status,
          score: result.securityScore,
          timestamp: new Date().toISOString(),
          maskedPreview: result.maskedPreview,
          findingsCount: result.findings?.length || 0,
        });
      }
    } catch (err) {
      setError(err.message || 'Code audit failed');
    } finally {
      setLoading(false);
    }
  };

  // File Upload Handler (with file size and type validation)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 500 KB Max
    if (file.size > 500 * 1024) {
      alert('File exceeds 500KB maximum size limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setCode(content);
        setAnalysisResult(null); // Reset previous analysis
      }
    };
    reader.readAsText(file);
  };

  // Helper: map flagged line numbers for inline code viewer
  const activeFindings = analysisResult ? analysisResult.findings : clientDeterministic.evidence;
  const lineIssueMap = useMemo(() => {
    const map = new Map();
    for (const f of activeFindings) {
      if (f.lineNumber) {
        if (!map.has(f.lineNumber)) map.set(f.lineNumber, []);
        map.get(f.lineNumber).push(f);
      }
    }
    return map;
  }, [activeFindings]);

  // Sort findings by severity priority: CRITICAL > HIGH > MEDIUM > LOW
  const sortedFindings = useMemo(() => {
    const priority = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    return [...activeFindings].sort((a, b) => {
      const pA = priority[a.severity] || 0;
      const pB = priority[b.severity] || 0;
      return pB - pA;
    });
  }, [activeFindings]);

  // Fix Verification Loop Trigger
  const handleVerifyFix = async (finding) => {
    if (!finding.suggestedFix) return;

    // Construct candidate fixed code by replacing target line
    const lines = code.split('\n');
    let fixedCode = code;

    if (finding.lineNumber && finding.lineNumber <= lines.length) {
      const targetIndex = finding.lineNumber - 1;
      lines[targetIndex] = finding.suggestedFix;
      fixedCode = lines.join('\n');
    } else if (finding.snippet && code.includes(finding.snippet)) {
      fixedCode = code.replace(finding.snippet, finding.suggestedFix);
    }

    try {
      const verification = await verifyFixApi({
        originalCode: code,
        fixedCode,
      });

      setActiveVerification({
        finding,
        verificationData: verification,
        candidateFixedCode: fixedCode,
      });
    } catch (err) {
      alert('Verification loop failed: ' + err.message);
    }
  };

  // Apply verified fix into editor
  const handleApplyFix = (finding) => {
    if (activeVerification?.candidateFixedCode) {
      setCode(activeVerification.candidateFixedCode);
      setActiveVerification(null);
      return;
    }

    // Direct apply fallback
    if (finding.suggestedFix) {
      const lines = code.split('\n');
      if (finding.lineNumber && finding.lineNumber <= lines.length) {
        lines[finding.lineNumber - 1] = finding.suggestedFix;
        setCode(lines.join('\n'));
      } else if (finding.snippet && code.includes(finding.snippet)) {
        setCode(code.replace(finding.snippet, finding.suggestedFix));
      }
    }
  };

  const currentScore = analysisResult ? analysisResult.securityScore : clientDeterministic.securityScore.score;
  const currentGrade = analysisResult ? analysisResult.grade : clientDeterministic.securityScore.grade;

  return (
    <section id="panel-code" role="tabpanel" aria-labelledby="tab-code">
      <div className="module-grid">
        {/* Left Column: Code Editor & Line View */}
        <div>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <span aria-hidden="true">💻</span>
                <span>Source Code Security Auditor (CodeShield)</span>
              </h2>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".js,.ts,.py,.java,.php,.txt,.json"
                  onChange={handleFileUpload}
                  aria-label="Upload source code file"
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload .js, .ts, .py, .java, or .php file"
                >
                  📁 Upload File
                </button>
              </div>
            </div>

            <label htmlFor="code-input" className="input-label">
              Paste source code (JavaScript, TypeScript, Python, Java, PHP):
            </label>
            <textarea
              id="code-input"
              className="textarea-field code-mode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Paste source code to scan for OWASP Top 10 vulnerabilities and hardcoded secrets..."
              rows={14}
              spellCheck="false"
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {code.split('\n').length} lines | {code.length} chars
              </span>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAuditCode}
                disabled={loading || !code.trim()}
                aria-busy={loading}
              >
                {loading ? '⚡ Running Autonomous Audit...' : '🛡️ Audit Code with SentinelAI'}
              </button>
            </div>
          </div>

          {/* Client-Side Privacy Masking Preview */}
          <MaskedPreview maskResult={clientMask} />

          {/* Line-Numbered Code View with Issue Markers */}
          {code.trim() && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <span aria-hidden="true">📑</span>
                  <span>Code Inspector with Line Issue Markers</span>
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {lineIssueMap.size} line(s) flagged
                </span>
              </div>

              <div
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  maxHeight: '360px',
                  overflowY: 'auto',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem',
                }}
                tabIndex={0}
                aria-label="Code inspection view with line-level issues"
              >
                {code.split('\n').map((lineText, idx) => {
                  const lineNum = idx + 1;
                  const issuesOnLine = lineIssueMap.get(lineNum);
                  const hasIssue = Boolean(issuesOnLine && issuesOnLine.length > 0);
                  const highestSev = hasIssue ? issuesOnLine[0].severity : null;

                  return (
                    <div
                      key={lineNum}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: hasIssue ? 'rgba(255, 51, 102, 0.12)' : 'transparent',
                        borderLeft: hasIssue ? '3px solid var(--accent-red)' : '3px solid transparent',
                        padding: '2px 10px',
                      }}
                    >
                      <span
                        style={{
                          width: '36px',
                          color: hasIssue ? 'var(--accent-red)' : 'var(--text-muted)',
                          userSelect: 'none',
                          textAlign: 'right',
                          paddingRight: '12px',
                          fontWeight: hasIssue ? 700 : 400,
                        }}
                      >
                        {lineNum}
                      </span>

                      <span style={{ flex: 1, whiteSpace: 'pre', color: 'var(--text-primary)' }}>
                        {lineText || ' '}
                      </span>

                      {hasIssue && (
                        <span
                          className={`severity-pill ${highestSev.toLowerCase()}`}
                          style={{ marginLeft: '10px', fontSize: '0.7rem', padding: '1px 6px' }}
                          title={issuesOnLine.map((i) => i.details).join('; ')}
                        >
                          {issuesOnLine[0].id || 'VULN'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Score, Findings, Verification */}
        <div>
          {/* Security Score Gauge */}
          <RiskGauge
            score={currentScore}
            mode="security"
            grade={currentGrade}
            verdict={currentScore >= 80 ? 'SAFE' : currentScore >= 50 ? 'SUSPICIOUS' : 'SCAM'}
          />

          {/* AI Executive Summary */}
          {analysisResult?.summary && (
            <div className="card">
              <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '8px' }}>
                <span aria-hidden="true">🧠</span>
                <span>Verified Security Assessment</span>
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {analysisResult.summary}
              </p>
            </div>
          )}

          {/* Sorted Findings List */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <span aria-hidden="true">🔍</span>
                <span>Security Findings (Sorted by Severity)</span>
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {sortedFindings.length} issue(s)
              </span>
            </div>

            {sortedFindings.length === 0 ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                No hardcoded secrets or vulnerability patterns detected.
              </p>
            ) : (
              sortedFindings.map((finding, idx) => (
                <EvidenceCard
                  key={finding.evidenceId || finding.id || idx}
                  finding={finding}
                  onVerifyFix={handleVerifyFix}
                  onApplyFix={handleApplyFix}
                />
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

      {/* Fix Verification Modal Dialog */}
      <FixVerificationModal
        isOpen={Boolean(activeVerification)}
        verificationData={activeVerification?.verificationData}
        finding={activeVerification?.finding}
        onApplyFix={handleApplyFix}
        onClose={() => setActiveVerification(null)}
      />
    </section>
  );
}
