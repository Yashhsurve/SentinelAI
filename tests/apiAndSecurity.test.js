import { describe, it, expect, vi } from 'vitest';

// Mock Gemini API for fast, isolated, deterministic API tests
vi.mock('../server/agent/geminiClient.js', () => ({
  callGeminiStructured: vi.fn().mockImplementation(async (prompt, schema) => {
    // If message schema
    if (schema?.properties?.verdict) {
      return {
        verdict: 'SCAM',
        explanation:
          'Mocked Gemini: High risk phishing detected with spoofed URL and urgency coercion.',
        findings: [
          {
            evidenceId: 'URL-01',
            explanation: 'Spoofed lookalike brand domain',
            severity: 'CRITICAL',
          },
          { evidenceId: 'TACTIC-01', explanation: 'Artificial urgency coercion', severity: 'HIGH' },
          { evidenceId: 'TACTIC-02', explanation: 'Direct OTP harvesting', severity: 'CRITICAL' },
        ],
        checklist: [
          'Call National Cyber Helpline 1930 immediately.',
          'File report at https://cybercrime.gov.in.',
          'Contact bank to freeze card and accounts.',
        ],
        defangedRewrite: 'Dear user, visit hxxp://paytmm[.]com/verify',
      };
    }

    // Code audit schema
    return {
      summary: 'Mocked Gemini: Critical code security vulnerabilities detected.',
      findings: [
        {
          evidenceId: 'SEC-01',
          explanation: 'Exposed cloud credential',
          severity: 'CRITICAL',
          suggestedFix: 'const apiKey = process.env.API_KEY || "";',
        },
        {
          evidenceId: 'VULN-01',
          explanation: 'SQL injection flaw',
          severity: 'CRITICAL',
          suggestedFix:
            'const res = await db.query("SELECT * FROM users WHERE id = $1", [userId]);',
        },
        {
          evidenceId: 'VULN-02',
          explanation: 'Dynamic eval code execution',
          severity: 'CRITICAL',
          suggestedFix: 'const res = JSON.parse(code);',
        },
      ],
    };
  }),
  MESSAGE_RESPONSE_SCHEMA: { properties: { verdict: {} } },
  CODE_RESPONSE_SCHEMA: { properties: { summary: {} } },
}));

import request from 'supertest';
import { app } from '../server/server.js';

describe('SentinelAI API Endpoints (Gemini Mocked)', () => {
  it('GET /api/health returns system status and mode', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toContain('SentinelAI');
    expect(res.body).toHaveProperty('mode');
    expect(res.body).toHaveProperty('model');
  });

  it('POST /api/analyze-message processes message and returns ThreatLens report', async () => {
    const res = await request(app).post('/api/analyze-message').send({
      text: 'Dear user, your SBI account will be blocked today! Visit https://paytmm.com/verify to enter your OTP immediately.',
      language: 'en',
    });

    expect(res.status).toBe(200);
    expect(res.body.module).toBe('ThreatLens');
    expect(res.body).toHaveProperty('riskScore');
    expect(res.body).toHaveProperty('verdict');
    expect(res.body).toHaveProperty('agentTrace');
    expect(res.body.agentTrace.length).toBeGreaterThanOrEqual(4);
    expect(res.body).toHaveProperty('checklist');
    expect(res.body).toHaveProperty('defangedRewrite');
  });

  it('POST /api/analyze-message rejects invalid payloads with 400 status', async () => {
    const res = await request(app).post('/api/analyze-message').send({
      text: '', // Empty text
      language: 'invalid_lang',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('POST /api/analyze-code processes code and returns CodeShield audit report', async () => {
    const vulnerableSnippet = `
const apiKey = "AKIAIOSFODNN7EXAMPLE";
const query = "SELECT * FROM users WHERE id = " + userId;
function run(code) { return eval(code); }
`;
    const res = await request(app).post('/api/analyze-code').send({
      code: vulnerableSnippet,
      language: 'en',
    });

    expect(res.status).toBe(200);
    expect(res.body.module).toBe('CodeShield');
    expect(res.body.securityScore).toBeLessThan(70);
    expect(res.body.findings.length).toBeGreaterThanOrEqual(2);
    expect(res.body.agentTrace.some((t) => t.step === 'VERIFY')).toBe(true);
  });

  it('POST /api/verify-fix compares original and remediated code and verifies score improvement', async () => {
    const originalCode = 'const res = eval(userExpr);';
    const fixedCode = 'const res = JSON.parse(userExpr);';

    const res = await request(app).post('/api/verify-fix').send({
      originalCode,
      fixedCode,
    });

    expect(res.status).toBe(200);
    expect(res.body.original.issuesCount).toBe(1);
    expect(res.body.fixed.issuesCount).toBe(0);
    expect(res.body.scoreImprovement).toBeGreaterThan(0);
    expect(res.body.isResolved).toBe(true);
  });

  it('Privacy Guarantee: raw AWS secret is masked before reasoning and never exposed in preview', async () => {
    const rawSecret = 'AKIAIOSFODNN7EXAMPLE';
    const payload = `const key = "${rawSecret}";`;

    const res = await request(app).post('/api/analyze-code').send({ code: payload });

    expect(res.status).toBe(200);
    expect(res.body.maskedPreview).toContain('[AWS_KEY_');
    expect(res.body.maskedPreview).not.toContain(rawSecret);
  });
});
