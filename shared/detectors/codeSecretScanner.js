/**
 * SentinelAI Code Secret Scanner
 * Detects hardcoded secrets, API keys, credentials, private keys,
 * and high-entropy strings with line-number precision.
 */

/**
 * Calculates Shannon entropy of a string (bits per symbol)
 * High entropy (> 4.2 bits for base64 / hex / random strings) strongly correlates with secrets.
 */
export function calculateShannonEntropy(str) {
  if (!str || str.length === 0) return 0;

  const frequencies = {};
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }

  let entropy = 0;
  const len = str.length;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

/**
 * Helper to determine 1-indexed line number from character offset
 */
export function getLineNumber(text, index) {
  const lines = text.slice(0, index).split('\n');
  return lines.length;
}

/**
 * Extracts line content for snippet display
 */
export function getLineContent(text, lineNumber) {
  const lines = text.split('\n');
  return lines[lineNumber - 1] || '';
}

/**
 * Scans code for hardcoded secrets, credentials, tokens, and high-entropy keys.
 * @param {string} code
 * @returns {Array<{ id: string, type: string, subtype: string, severity: string, lineNumber: number, snippet: string, text: string, details: string }>}
 */
export function scanCodeSecrets(code) {
  if (!code || typeof code !== 'string') return [];

  const evidence = [];
  let counter = 1;
  const detectedLines = new Set();

  // 1. Private Key Block
  const privateKeyRegex = /-----BEGIN(?:[A-Z\s]+)?PRIVATE KEY-----/g;
  let pkMatch;
  while ((pkMatch = privateKeyRegex.exec(code)) !== null) {
    const line = getLineNumber(code, pkMatch.index);
    evidence.push({
      id: `SEC-${String(counter++).padStart(2, '0')}`,
      type: 'code_secret',
      subtype: 'private_key_block',
      severity: 'CRITICAL',
      lineNumber: line,
      snippet: getLineContent(code, line).trim(),
      text: pkMatch[0],
      details: 'Unencrypted cryptographic private key block exposed directly in source code.',
    });
    detectedLines.add(line);
  }

  // 2. AWS Access Key ID
  const awsRegex = /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g;
  let awsMatch;
  while ((awsMatch = awsRegex.exec(code)) !== null) {
    const line = getLineNumber(code, awsMatch.index);
    evidence.push({
      id: `SEC-${String(counter++).padStart(2, '0')}`,
      type: 'code_secret',
      subtype: 'aws_access_key',
      severity: 'CRITICAL',
      lineNumber: line,
      snippet: getLineContent(code, line).trim(),
      text: awsMatch[0],
      details: 'Hardcoded AWS Access Key ID. Exposes cloud infrastructure to unauthorized access.',
    });
    detectedLines.add(line);
  }

  // 3. Google API Key
  const googleRegex = /\bAIza[0-9A-Za-z\-_]{35}\b/g;
  let googleMatch;
  while ((googleMatch = googleRegex.exec(code)) !== null) {
    const line = getLineNumber(code, googleMatch.index);
    evidence.push({
      id: `SEC-${String(counter++).padStart(2, '0')}`,
      type: 'code_secret',
      subtype: 'google_api_key',
      severity: 'CRITICAL',
      lineNumber: line,
      snippet: getLineContent(code, line).trim(),
      text: googleMatch[0],
      details: 'Hardcoded Google Cloud / Gemini API key. Grants billable API quota access.',
    });
    detectedLines.add(line);
  }

  // 4. GitHub Tokens
  const githubRegex = /\b(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{40,80})\b/g;
  let ghMatch;
  while ((ghMatch = githubRegex.exec(code)) !== null) {
    const line = getLineNumber(code, ghMatch.index);
    evidence.push({
      id: `SEC-${String(counter++).padStart(2, '0')}`,
      type: 'code_secret',
      subtype: 'github_personal_token',
      severity: 'CRITICAL',
      lineNumber: line,
      snippet: getLineContent(code, line).trim(),
      text: ghMatch[0],
      details: 'GitHub Personal Access Token hardcoded in source. Compromises repository access.',
    });
    detectedLines.add(line);
  }

  // 5. Credential / Secret variable assignments
  const secretAssignRegex = /(?:const|let|var|val|final)?\s*([a-zA-Z0-9_]*(?:secret|password|passwd|api_?key|auth_?token|client_?secret|jwt_?secret)[a-zA-Z0-9_]*)\s*[:=]\s*(["'])([^"'\r\n]+)\2/gi;
  let assignMatch;
  while ((assignMatch = secretAssignRegex.exec(code)) !== null) {
    const varName = assignMatch[1];
    const secretVal = assignMatch[3];
    const line = getLineNumber(code, assignMatch.index);

    // Filter out dummy/mock placeholders e.g. "your_api_key_here", "dummy", "CHANGEME", empty
    const isMock = /^(?:dummy|test|changeme|placeholder|your_?key|secret|password|xxx|\*{3,}|<[^>]+>|process\.env|env\.)/i.test(secretVal);
    if (!isMock && secretVal.length >= 6) {
      evidence.push({
        id: `SEC-${String(counter++).padStart(2, '0')}`,
        type: 'code_secret',
        subtype: 'hardcoded_credential_variable',
        severity: 'CRITICAL',
        lineNumber: line,
        snippet: getLineContent(code, line).trim(),
        text: `${varName} = "${secretVal.slice(0, 4)}..."`,
        details: `Sensitive credential assigned to variable "${varName}" in source code instead of environment variables.`,
      });
      detectedLines.add(line);
    }
  }

  // 6. High Shannon Entropy String Literals (length >= 24, entropy >= 4.3)
  const stringLiteralRegex = /["']([A-Za-z0-9+/=_\-]{24,120})["']/g;
  let strMatch;
  while ((strMatch = stringLiteralRegex.exec(code)) !== null) {
    const candidate = strMatch[1];
    const line = getLineNumber(code, strMatch.index);

    if (detectedLines.has(line)) continue;

    // Ignore known non-secret patterns like long URLs or common English sentences
    if (candidate.includes('http') || candidate.includes('xmlns') || candidate.includes('bootstrap')) continue;

    const entropy = calculateShannonEntropy(candidate);
    if (entropy >= 4.3) {
      evidence.push({
        id: `SEC-${String(counter++).padStart(2, '0')}`,
        type: 'code_secret',
        subtype: 'high_entropy_string',
        severity: 'HIGH',
        lineNumber: line,
        snippet: getLineContent(code, line).trim(),
        text: `"${candidate.slice(0, 8)}...${candidate.slice(-4)}"`,
        details: `Suspicious high-entropy string detected (Shannon entropy ${entropy.toFixed(2)} bits/char), indicating an unclassified private token or hash.`,
      });
      detectedLines.add(line);
    }
  }

  return evidence;
}
