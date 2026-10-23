import { describe, it, expect } from 'vitest';
import {
  scanCodeSecrets,
  calculateShannonEntropy,
} from '../shared/detectors/codeSecretScanner.js';
import { scanCodeVulnerabilities } from '../shared/detectors/codeVulnerabilityScanner.js';

describe('Shannon Entropy Calculation', () => {
  it('computes low entropy for repeated characters and high for cryptographic keys', () => {
    const lowEntropy = calculateShannonEntropy('aaaaaaaaaaaaaaaa');
    const normalEnglish = calculateShannonEntropy('hello world this is a test');
    const highEntropy = calculateShannonEntropy('4b8c9d1e2f7a0b5c8d3e9f1a2b4c5d6e');

    expect(lowEntropy).toBe(0);
    expect(normalEnglish).toBeGreaterThan(2.5);
    expect(highEntropy).toBeGreaterThan(3.5);
  });
});

describe('Code Secret Scanner', () => {
  it('detects AWS access keys with line numbers', () => {
    const code = `// Application Config
const PORT = 3000;
const AWS_KEY = "AKIAIOSFODNN7EXAMPLE";
console.log("Started");`;
    const secrets = scanCodeSecrets(code);

    const aws = secrets.find((s) => s.subtype === 'aws_access_key');
    expect(aws).toBeDefined();
    expect(aws.lineNumber).toBe(3);
    expect(aws.severity).toBe('CRITICAL');
  });

  it('detects Google Gemini API keys in code', () => {
    const code = 'const geminiKey = "AIzaSyD-fakeKey1234567890abcdefghijklm";';
    const secrets = scanCodeSecrets(code);

    const gKey = secrets.find((s) => s.subtype === 'google_api_key');
    expect(gKey).toBeDefined();
    expect(gKey.severity).toBe('CRITICAL');
  });

  it('detects GitHub personal access tokens', () => {
    const code = 'const token = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";';
    const secrets = scanCodeSecrets(code);

    const gh = secrets.find((s) => s.subtype === 'github_personal_token');
    expect(gh).toBeDefined();
  });

  it('detects private key blocks', () => {
    const code = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAz...
-----END RSA PRIVATE KEY-----`;
    const secrets = scanCodeSecrets(code);

    expect(secrets.some((s) => s.subtype === 'private_key_block')).toBe(true);
  });

  it('does NOT flag legitimate environment variable references or placeholders (false-positive prevention)', () => {
    const cleanCode = `
const apiKey = process.env.API_KEY || "";
const dummyPass = "your_password_here";
const short = "test";
`;
    const secrets = scanCodeSecrets(cleanCode);
    expect(secrets.length).toBe(0);
  });
});

describe('Code Vulnerability Scanner', () => {
  it('detects eval() and dynamic code execution (CWE-95)', () => {
    const code = 'function runCalculation(expr) { return eval(expr); }';
    const vulns = scanCodeVulnerabilities(code);

    const evalVuln = vulns.find((v) => v.subtype === 'dynamic_code_execution');
    expect(evalVuln).toBeDefined();
    expect(evalVuln.severity).toBe('CRITICAL');
  });

  it('detects SQL injection via string concatenation or template literal (CWE-89)', () => {
    const codeConcat = 'const query = "SELECT * FROM users WHERE id = " + userId;';
    const vulnsConcat = scanCodeVulnerabilities(codeConcat);
    expect(vulnsConcat.some((v) => v.subtype === 'sql_injection')).toBe(true);

    const codeTemplate = 'const q = `SELECT * FROM accounts WHERE name = ${userName}`;';
    const vulnsTemplate = scanCodeVulnerabilities(codeTemplate);
    expect(vulnsTemplate.some((v) => v.subtype === 'sql_injection')).toBe(true);
  });

  it('detects DOM XSS via innerHTML and dangerouslySetInnerHTML (CWE-79)', () => {
    const code = 'document.getElementById("output").innerHTML = userInput;';
    const vulns = scanCodeVulnerabilities(code);

    const xss = vulns.find((v) => v.subtype === 'dom_xss');
    expect(xss).toBeDefined();
    expect(xss.severity).toBe('HIGH');
  });

  it('detects command injection via child_process.exec (CWE-78)', () => {
    const code = 'const res = child_process.exec("ping " + host);';
    const vulns = scanCodeVulnerabilities(code);

    const cmd = vulns.find((v) => v.subtype === 'command_injection');
    expect(cmd).toBeDefined();
    expect(cmd.severity).toBe('CRITICAL');
  });

  it('detects weak cryptography MD5 and SHA-1 (CWE-328)', () => {
    const code = 'const hash = crypto.createHash("md5").update(password).digest("hex");';
    const vulns = scanCodeVulnerabilities(code);

    const cryptoVuln = vulns.find((v) => v.subtype === 'weak_crypto_hash');
    expect(cryptoVuln).toBeDefined();
  });

  it('detects insecure PRNG Math.random() for security tokens (CWE-338)', () => {
    const code = 'const sessionToken = Math.random().toString(36).substring(2);';
    const vulns = scanCodeVulnerabilities(code);

    const prng = vulns.find((v) => v.subtype === 'insecure_prng');
    expect(prng).toBeDefined();
  });

  it('detects disabled TLS certificate validation (CWE-295)', () => {
    const code = 'const agent = new https.Agent({ rejectUnauthorized: false });';
    const vulns = scanCodeVulnerabilities(code);

    const tls = vulns.find((v) => v.subtype === 'disabled_tls');
    expect(tls).toBeDefined();
    expect(tls.severity).toBe('CRITICAL');
  });

  it('detects permissive wildcard CORS origin (CWE-942)', () => {
    const code = 'app.use(cors({ origin: "*" }));';
    const vulns = scanCodeVulnerabilities(code);

    const corsVuln = vulns.find((v) => v.subtype === 'wildcard_cors');
    expect(corsVuln).toBeDefined();
  });
});
