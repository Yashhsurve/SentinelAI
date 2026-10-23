import { describe, it, expect } from 'vitest';
import { verifyAiClaims } from '../shared/verifier.js';
import { calculateMessageRiskScore, calculateCodeSecurityScore } from '../shared/scoring.js';
import { LruCache } from '../server/utils/cache.js';

describe('Anti-Hallucination Evidence Verifier', () => {
  it('retains and enriches AI findings that reference valid deterministic evidence IDs', () => {
    const deterministicEvidence = [
      {
        id: 'URL-01',
        type: 'url_analysis',
        subtype: 'brand_impersonation',
        severity: 'CRITICAL',
        details: 'Spoofed SBI portal',
      },
      {
        id: 'TACTIC-01',
        type: 'manipulation_tactic',
        subtype: 'urgency',
        severity: 'HIGH',
        details: '24hr countdown',
      },
    ];

    const aiFindings = [
      {
        evidenceId: 'URL-01',
        explanation: 'Attacker spoofed the legitimate SBI domain',
        severity: 'CRITICAL',
      },
    ];

    const result = verifyAiClaims(aiFindings, deterministicEvidence);

    expect(result.unsupportedCount).toBe(0);
    expect(result.verifiedFindings.length).toBeGreaterThanOrEqual(1);
    const verifiedUrl = result.verifiedFindings.find((f) => f.evidenceId === 'URL-01');
    expect(verifiedUrl.groundTruthVerified).toBe(true);
    expect(verifiedUrl.ruleDetails).toBe('Spoofed SBI portal');
  });

  it('DROPS AI findings with non-existent or hallucinated evidence IDs', () => {
    const deterministicEvidence = [
      {
        id: 'URL-01',
        type: 'url_analysis',
        subtype: 'brand_impersonation',
        severity: 'CRITICAL',
        details: 'Fake site',
      },
    ];

    const aiFindingsWithHallucination = [
      {
        evidenceId: 'URL-01',
        explanation: 'Legitimate SBI spoofing detected',
        severity: 'CRITICAL',
      },
      {
        evidenceId: 'FAKE-99',
        explanation: 'Hallucinated claim with no evidence',
        severity: 'HIGH',
      },
      { evidenceId: null, explanation: 'Unanchored claim', severity: 'MEDIUM' },
    ];

    const result = verifyAiClaims(aiFindingsWithHallucination, deterministicEvidence);

    expect(result.unsupportedCount).toBe(2);
    expect(result.droppedClaims.length).toBe(2);
    expect(result.traceNote).toContain(
      '2 unsupported AI claims removed (anti-hallucination shield)'
    );
    expect(result.verifiedFindings.some((f) => f.evidenceId === 'FAKE-99')).toBe(false);
  });
});

describe('Deterministic Scoring Engine', () => {
  it('calculates bounded risk score (0-100) and factors for messages', () => {
    const evidenceList = [
      { id: 'URL-01', type: 'url_analysis', subtype: 'brand_impersonation', severity: 'CRITICAL' },
      {
        id: 'TACTIC-01',
        type: 'manipulation_tactic',
        subtype: 'credential_request',
        severity: 'CRITICAL',
      },
      { id: 'TACTIC-02', type: 'manipulation_tactic', subtype: 'fear_threat', severity: 'HIGH' },
    ];

    const result = calculateMessageRiskScore(evidenceList);

    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.level).toBe('SCAM');
    expect(result.factors.length).toBe(3);
    expect(result.breakdown.urlThreats).toBeGreaterThan(0);
    expect(result.breakdown.credentialHarvesting).toBeGreaterThan(0);
  });

  it('returns score 0 and SAFE level for clean messages', () => {
    const result = calculateMessageRiskScore([]);
    expect(result.score).toBe(0);
    expect(result.level).toBe('SAFE');
  });

  it('calculates code security health score and grades', () => {
    const cleanResult = calculateCodeSecurityScore([]);
    expect(cleanResult.score).toBe(100);
    expect(cleanResult.grade).toBe('A');
    expect(cleanResult.status).toBe('SECURE');

    const vulnResult = calculateCodeSecurityScore([
      { id: 'VULN-01', subtype: 'dynamic_code_execution', severity: 'CRITICAL', details: 'eval' },
      { id: 'SEC-01', subtype: 'aws_access_key', severity: 'CRITICAL', details: 'AWS key' },
    ]);
    expect(vulnResult.score).toBe(40);
    expect(vulnResult.status).toBe('VULNERABLE');
  });
});

describe('In-Memory LRU Cache', () => {
  it('correctly caches, retrieves, and expires entries', () => {
    const cache = new LruCache(3, 5000);
    const key = cache.hashKey('test payload');

    cache.set(key, { data: 'security result' });
    expect(cache.has(key)).toBe(true);
    expect(cache.get(key).data).toBe('security result');
  });

  it('evicts least recently used items when capacity is reached', () => {
    const cache = new LruCache(2, 5000);
    cache.set('key1', 'val1');
    cache.set('key2', 'val2');
    cache.set('key3', 'val3'); // Should evict key1

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBe('val2');
    expect(cache.get('key3')).toBe('val3');
  });
});
