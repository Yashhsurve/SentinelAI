import { describe, it, expect } from 'vitest';
import { maskSensitiveData } from '../shared/masking.js';
import { scanCodeSecrets } from '../shared/detectors/codeSecretScanner.js';
import { scanCodeVulnerabilities } from '../shared/detectors/codeVulnerabilityScanner.js';
import { detectPromptInjection } from '../shared/detectors/promptInjectionDetector.js';
import { detectUrlThreats } from '../shared/detectors/urlDetector.js';
import { detectManipulationTactics } from '../shared/detectors/manipulationDetector.js';
import { calculateMessageRiskScore, calculateCodeSecurityScore } from '../shared/scoring.js';
import { messageAnalysisSchema, codeAnalysisSchema } from '../server/middleware/validator.js';
import { LruCache } from '../server/utils/cache.js';

describe('Edge Case Polish Suite (8 Required Robustness Tests)', () => {
  // 1. Empty input
  it('handles empty input gracefully across message and code detectors without throwing', () => {
    const emptyMsgEvidence = [...detectUrlThreats(''), ...detectManipulationTactics('')];
    const msgScore = calculateMessageRiskScore(emptyMsgEvidence);
    expect(msgScore.score).toBe(0);
    expect(msgScore.level).toBe('SAFE');

    const emptyCodeEvidence = [
      ...scanCodeSecrets(''),
      ...scanCodeVulnerabilities(''),
      ...detectPromptInjection(''),
    ];
    const codeScore = calculateCodeSecurityScore(emptyCodeEvidence);
    expect(codeScore.score).toBe(100);
    expect(codeScore.grade).toBe('A');
  });

  // 2. Very long input
  it('processes very long inputs (50,000+ characters) within reasonable bounds without crashing', () => {
    const longSafeCode = 'const x = 1;\n'.repeat(4000); // ~56,000 chars
    const secrets = scanCodeSecrets(longSafeCode);
    const vulns = scanCodeVulnerabilities(longSafeCode);
    const injection = detectPromptInjection(longSafeCode);

    expect(secrets).toEqual([]);
    expect(vulns).toEqual([]);
    expect(injection).toEqual([]);
  });

  // 3. Unicode and Hindi text
  it('correctly handles Unicode, Hindi, and multilingual text in masking and security scans', () => {
    const hindiMessage =
      'कृपया अपना पासवर्ड और पैन ABCDE1234F साझा न करें: https://bank-secure-alert.xyz';
    const maskResult = maskSensitiveData(hindiMessage);

    expect(maskResult.maskedText).toContain('[PAN_1]');
    expect(maskResult.maskedText).not.toContain('ABCDE1234F');
    expect(maskResult.counts.pan).toBe(1);

    const urlFindings = detectUrlThreats(maskResult.maskedText);
    expect(urlFindings.length).toBeGreaterThanOrEqual(1);
  });

  // 4. Duplicate secrets
  it('detects multiple duplicate secrets without collisions or crashing', () => {
    const codeWithDuplicates = `
      const key1 = "sk_live_51AbCdEfGhIjKlMnOpQrStUvWxYz123456";
      const key2 = "sk_live_51AbCdEfGhIjKlMnOpQrStUvWxYz123456";
      const key3 = "sk_live_51AbCdEfGhIjKlMnOpQrStUvWxYz123456";
    `;
    const secrets = scanCodeSecrets(codeWithDuplicates);
    expect(secrets.length).toBe(3);
    const lineNumbers = secrets.map((s) => s.lineNumber);
    expect(lineNumbers).toEqual([2, 3, 4]);
  });

  // 5. Scoring bounds 0-100
  it('strictly bounds computed risk and security scores within 0 and 100 even with extreme findings', () => {
    // Generate massive number of high-severity findings
    const massiveFindings = Array.from({ length: 50 }, (_, i) => ({
      id: `EV-${i}`,
      type: 'url_analysis',
      subtype: 'brand_impersonation',
      severity: 'CRITICAL',
    }));

    const maxRisk = calculateMessageRiskScore(massiveFindings);
    expect(maxRisk.score).toBeLessThanOrEqual(100);
    expect(maxRisk.score).toBeGreaterThanOrEqual(0);

    const minSecurity = calculateCodeSecurityScore(massiveFindings);
    expect(minSecurity.score).toBeLessThanOrEqual(100);
    expect(minSecurity.score).toBeGreaterThanOrEqual(0);
  });

  // 6. Masking placeholders never contain the raw value
  it('guarantees masking placeholders never contain or leak any part of raw sensitive values', () => {
    const secretApiKey = 'AIzaSyD9876543210FedCba1234567890AbCd';
    const creditCard = '4532 0150 1234 5678';
    const email = 'victim-confidential@secret-corp.internal';
    const rawInput = `Key is ${secretApiKey}, card is ${creditCard}, email is ${email}`;

    const { maskedText } = maskSensitiveData(rawInput);

    expect(maskedText).not.toContain(secretApiKey);
    expect(maskedText).not.toContain('4532 0150 1234 5678');
    expect(maskedText).not.toContain('victim-confidential@secret-corp.internal');
    expect(maskedText).toContain('[GOOGLE_KEY_1]');
    expect(maskedText).toContain('[CARD_1]');
    expect(maskedText).toContain('[EMAIL_1]');
  });

  // 7. Invalid Zod payloads
  it('rejects invalid payload schemas and rejects malicious or out-of-spec request bodies', () => {
    // Missing required field 'text'
    const invalidMsg1 = messageAnalysisSchema.safeParse({ language: 'en' });
    expect(invalidMsg1.success).toBe(false);

    // Invalid non-string field
    const invalidMsg2 = messageAnalysisSchema.safeParse({ text: 12345 });
    expect(invalidMsg2.success).toBe(false);

    // Missing required field 'code'
    const invalidCode1 = codeAnalysisSchema.safeParse({ language: 'javascript' });
    expect(invalidCode1.success).toBe(false);

    // Rejects unknown fields due to strict schema
    const invalidExtraField = messageAnalysisSchema.safeParse({
      text: 'hello',
      maliciousField: true,
    });
    expect(invalidExtraField.success).toBe(false);
  });

  // 8. Cache hit returns same result
  it('guarantees LRU cache hit returns the exact identical result payload for duplicate queries', () => {
    const cache = new LruCache(10, 60000);
    const key = `query:${cache.hashKey({ text: 'Sample scam message', lang: 'en' })}`;
    const originalResult = {
      riskScore: 85,
      verdict: 'High Risk',
      findings: [{ id: 'URL-01', severity: 'HIGH' }],
    };

    cache.set(key, originalResult);
    const cachedHit = cache.get(key);

    expect(cachedHit).toBeDefined();
    expect(cachedHit).toEqual(originalResult);
    expect(cachedHit.riskScore).toBe(originalResult.riskScore);
    expect(cachedHit.findings).toEqual(originalResult.findings);
  });
});
