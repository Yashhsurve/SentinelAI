/**
 * SentinelAI Privacy Masking Engine
 * Executed in the browser BEFORE sending to server,
 * and re-executed on the server as defense-in-depth.
 */

// Regex patterns for sensitive entity detection
const PATTERNS = {
  // 1. Private Key Blocks (RSA, EC, DSA, PGP, OPENSSH)
  privateKey: /-----BEGIN(?:[A-Z\s]+)?PRIVATE KEY-----[\s\S]*?-----END(?:[A-Z\s]+)?PRIVATE KEY-----/g,

  // 2. AWS Access Key ID (20 alphanumeric starting with AKIA or ASIA)
  awsKey: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g,

  // 3. Google API Key (AIzaSy...)
  googleApiKey: /\bAIza[0-9A-Za-z\-_]{35}\b/g,

  // 4. GitHub Tokens
  githubToken: /\b(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{40,80}|gho_[a-zA-Z0-9]{36}|ghs_[a-zA-Z0-9]{36})\b/g,

  // 5. Generic API keys/tokens in variable assignments or headers (Bearer / secret=...)
  keyValueSecret: /(?:\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|jwt[_-]?token|app[_-]?secret|password|passwd|pwd)\b\s*[:=]\s*["'])([^"'\r\n]{8,})(?:["'])/gi,
  bearerToken: /(?:Bearer\s+)([A-Za-z0-9\-_=]{20,})/g,

  // 6. Credit / Debit Card Numbers (13-19 digits, with spaces or hyphens)
  creditCard: /\b(?:\d{4}[ -]?){3}\d{4}\b|\b(?:\d{4}[ -]?){2}\d{4}[ -]?\d{3}\b/g,

  // 7. Aadhaar Number (12 digits, optional space/hyphen separator in groups of 4)
  aadhaar: /\b[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}\b/g,

  // 8. Indian PAN Card (5 uppercase letters, 4 digits, 1 uppercase letter)
  pan: /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g,

  // 9. Email addresses
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,

  // 10. Phone numbers (Indian +91 / 0 / 10-digit mobile, plus international formats)
  phone: /(?:\+91[\s.-]?)?(?:\(?0\d{2,4}\)?[\s.-]?)?[6-9]\d{4}[\s.-]?\d{5}\b|(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
};

/**
 * Masks sensitive entities in text with deterministic placeholders.
 * @param {string} text - Raw input string (message or code)
 * @returns {{ maskedText: string, replacements: Array<{type: string, placeholder: string, original: string}>, counts: Record<string, number>, totalMasked: number }}
 */
export function maskSensitiveData(text) {
  if (!text || typeof text !== 'string') {
    return {
      maskedText: '',
      replacements: [],
      counts: { email: 0, phone: 0, aadhaar: 0, pan: 0, card: 0, secret: 0 },
      totalMasked: 0,
    };
  }

  let result = text;
  const replacements = [];
  const counts = {
    email: 0,
    phone: 0,
    aadhaar: 0,
    pan: 0,
    card: 0,
    secret: 0,
  };

  // Helper to record replacement
  const recordReplacement = (type, original, placeholder) => {
    replacements.push({ type, placeholder, original });
    counts[type] = (counts[type] || 0) + 1;
  };

  // 1. Private keys
  result = result.replace(PATTERNS.privateKey, (match) => {
    const placeholder = `[PRIVATE_KEY_${counts.secret + 1}]`;
    recordReplacement('secret', match, placeholder);
    return placeholder;
  });

  // 2. AWS Keys
  result = result.replace(PATTERNS.awsKey, (match) => {
    const placeholder = `[AWS_KEY_${counts.secret + 1}]`;
    recordReplacement('secret', match, placeholder);
    return placeholder;
  });

  // 3. Google API Keys
  result = result.replace(PATTERNS.googleApiKey, (match) => {
    const placeholder = `[GOOGLE_KEY_${counts.secret + 1}]`;
    recordReplacement('secret', match, placeholder);
    return placeholder;
  });

  // 4. GitHub Tokens
  result = result.replace(PATTERNS.githubToken, (match) => {
    const placeholder = `[GITHUB_TOKEN_${counts.secret + 1}]`;
    recordReplacement('secret', match, placeholder);
    return placeholder;
  });

  // 5. Key-Value secrets
  result = result.replace(PATTERNS.keyValueSecret, (match, secretVal) => {
    const placeholder = `[SECRET_${counts.secret + 1}]`;
    recordReplacement('secret', secretVal, placeholder);
    return match.replace(secretVal, placeholder);
  });

  // 6. Bearer tokens
  result = result.replace(PATTERNS.bearerToken, (match, tokenVal) => {
    const placeholder = `[BEARER_TOKEN_${counts.secret + 1}]`;
    recordReplacement('secret', tokenVal, placeholder);
    return `Bearer ${placeholder}`;
  });

  // 7. Credit Cards
  result = result.replace(PATTERNS.creditCard, (match) => {
    // Avoid masking 16 zeros or simple sequence like 1111111111111111 if not plausible
    const digitsOnly = match.replace(/\D/g, '');
    if (digitsOnly.length >= 13 && digitsOnly.length <= 19) {
      const placeholder = `[CARD_${counts.card + 1}]`;
      recordReplacement('card', match, placeholder);
      return placeholder;
    }
    return match;
  });

  // 8. Aadhaar Numbers (12 digits, valid starting digit 2-9)
  result = result.replace(PATTERNS.aadhaar, (match) => {
    const digitsOnly = match.replace(/\D/g, '');
    if (digitsOnly.length === 12) {
      const placeholder = `[AADHAAR_${counts.aadhaar + 1}]`;
      recordReplacement('aadhaar', match, placeholder);
      return placeholder;
    }
    return match;
  });

  // 9. Indian PAN Card (ABCDE1234F)
  result = result.replace(PATTERNS.pan, (match) => {
    const placeholder = `[PAN_${counts.pan + 1}]`;
    recordReplacement('pan', match, placeholder);
    return placeholder;
  });

  // 10. Email addresses
  result = result.replace(PATTERNS.email, (match) => {
    const placeholder = `[EMAIL_${counts.email + 1}]`;
    recordReplacement('email', match, placeholder);
    return placeholder;
  });

  // 11. Phone numbers
  result = result.replace(PATTERNS.phone, (match) => {
    // Prevent masking if it's part of a date or version number
    const digitsOnly = match.replace(/\D/g, '');
    if (digitsOnly.length >= 10 && digitsOnly.length <= 13) {
      const placeholder = `[PHONE_${counts.phone + 1}]`;
      recordReplacement('phone', match, placeholder);
      return placeholder;
    }
    return match;
  });

  const totalMasked = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return {
    maskedText: result,
    replacements,
    counts,
    totalMasked,
  };
}
