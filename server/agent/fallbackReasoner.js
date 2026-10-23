/**
 * SentinelAI Fallback Reasoning Engine
 * Provides deterministic, reliable security explanations when:
 * 1. No GEMINI_API_KEY is configured (Demo Mode)
 * 2. Gemini API quota is exceeded or network fails
 *
 * Every finding is strictly bound to valid evidence IDs.
 */

/**
 * Creates rule-based message analysis in English, Hindi, or Marathi
 */
export function generateMessageFallback(maskedText, evidenceList, riskScoreObj, language = 'en') {
  const isScam = riskScoreObj.level === 'SCAM';
  const isSuspicious = riskScoreObj.level === 'SUSPICIOUS';
  const verdict = isScam ? 'SCAM' : isSuspicious ? 'SUSPICIOUS' : 'SAFE';

  // Language-specific summaries
  let explanation = '';
  if (language === 'hi') {
    explanation = isScam
      ? '[AI अनुपलब्ध - नियम-आधारित परिणाम] यह संदेश एक उच्च-जोखिम वाला धोखाधड़ी (Scam) प्रतीत होता है। इसमें संदिग्ध लिंक, जल्दबाजी का दबाव या संवेदनशील क्रेडेंशियल (OTP/PIN) मांगने के स्पष्ट संकेत पाए गए हैं।'
      : isSuspicious
      ? '[AI अनुपलब्ध - नियम-आधारित परिणाम] इस संदेश में कुछ संदिग्ध तत्व हैं। कृपया किसी भी लिंक पर क्लिक करने या व्यक्तिगत जानकारी साझा करने से पहले सावधानी बरतें।'
      : '[AI अनुपलब्ध - नियम-आधारित परिणाम] इस संदेश में कोई स्पष्ट फ़िशिंग या धोखाधड़ी के संकेत नहीं मिले हैं।';
  } else if (language === 'mr') {
    explanation = isScam
      ? '[AI अनुपलब्ध - नियम-आधारित निकाल] हा संदेश एक अतिधोकादायक फसवणूक (Scam) असल्याचे निष्पन्न झाले आहे. यामध्ये संशयास्पद लिंक्स किंवा गोपनीय माहिती (OTP/PIN) मागण्याचे गंभीर संकेत आहेत.'
      : isSuspicious
      ? '[AI अनुपलब्ध - नियम-आधारित निकाल] या संदेशामध्ये संशयास्पद घटक आढळले आहेत. कोणत्याही लिंकवर क्लिक करण्यापूर्वी खात्री करा.'
      : '[AI अनुपलब्ध - नियम-आधारित निकाल] या संदेशात कोणतीही फसवणूक किंवा सायबर धोक्याचे संकेत आढळले नाहीत.';
  } else {
    explanation = isScam
      ? '[AI unavailable - rule-based result] This message exhibits multiple high-risk indicators characteristic of a targeted scam. It employs coercive psychological tactics and unverified links designed to harvest credentials or funds.'
      : isSuspicious
      ? '[AI unavailable - rule-based result] This message contains suspicious elements that warrant caution. Avoid clicking unverified links or sharing personal information.'
      : '[AI unavailable - rule-based result] No deterministic indicators of phishing, coercion, or credential theft were identified in this message.';
  }

  // Build findings mapped to evidence IDs
  const findings = evidenceList.map((ev) => {
    let explanationText = ev.details || 'Deterministic threat flag detected';
    if (ev.type === 'url_analysis') {
      explanationText = `Suspicious destination address (${ev.subtype}): ${ev.details}`;
    } else if (ev.type === 'manipulation_tactic') {
      explanationText = `Psychological manipulation tactic (${ev.subtype}): ${ev.details}`;
    } else if (ev.type === 'prompt_injection') {
      explanationText = `Prompt injection attempt detected: ${ev.details}`;
    }

    return {
      evidenceId: ev.id,
      explanation: explanationText,
      severity: ev.severity || 'HIGH',
    };
  });

  // Actionable Indian & Global Cyber Defense Checklist
  const checklist = [
    'NEVER share OTP, UPI PIN, ATM PIN, CVV, or passwords with anyone under any circumstances.',
    'Immediately report cyber fraud to the Indian National Cyber Crime Helpline by dialing 1930.',
    'Lodge an official incident complaint on the government portal at https://cybercrime.gov.in.',
    'Contact your bank or card issuer immediately to freeze your account or block payment cards.',
    'Forward scam SMS to 1909 (Telecom Regulatory Authority of India spam reporting).',
    'Block and report the sender number/address on WhatsApp or your messaging application.',
  ];

  // Defang message for safe archiving and sharing
  const defangedRewrite = maskedText
    .replace(/https?:\/\//gi, (m) => m.toLowerCase().replace('http', 'hxxp'))
    .replace(/\.([a-z0-9]{2,})/gi, '[.]$1');

  return {
    verdict,
    explanation,
    findings,
    checklist,
    defangedRewrite,
    isRuleBasedFallback: true,
  };
}

/**
 * Creates rule-based code remediation and findings
 */
export function generateCodeFallback(maskedCode, evidenceList, securityScoreObj) {
  const findings = evidenceList.map((ev) => {
    let suggestedFix = ev.fixSuggestion || '// Security remediation required for line ' + (ev.lineNumber || 1);

    if (ev.subtype === 'google_api_key' || ev.subtype === 'aws_access_key') {
      suggestedFix = `// Load secret securely from environment variable\nconst API_KEY = process.env.API_KEY || '';`;
    } else if (ev.subtype === 'sql_injection') {
      suggestedFix = `// Use parameterized query with placeholder variables\nconst result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);`;
    } else if (ev.subtype === 'dom_xss') {
      suggestedFix = `// Use textContent to avoid executing untrusted HTML\nelement.textContent = userSuppliedInput;`;
    } else if (ev.subtype === 'dynamic_code_execution') {
      suggestedFix = `// Replace eval with safe JSON.parse or structured lookup\nconst parsed = JSON.parse(safePayloadString);`;
    } else if (ev.subtype === 'disabled_tls') {
      suggestedFix = `// Maintain strict TLS verification\nconst agent = new https.Agent({ rejectUnauthorized: true });`;
    } else if (ev.subtype === 'wildcard_cors') {
      suggestedFix = `// Restrict CORS to authorized domain\napp.use(cors({ origin: ['https://trusted.app.domain'] }));`;
    } else if (ev.subtype === 'weak_crypto_hash') {
      suggestedFix = `// Use modern SHA-256 or bcrypt\nconst hash = crypto.createHash('sha256').update(data).digest('hex');`;
    }

    return {
      evidenceId: ev.id,
      explanation: `Deterministic security scanner identified ${ev.subtype} on line ${ev.lineNumber || 'N/A'}: ${ev.details}`,
      severity: ev.severity || 'HIGH',
      suggestedFix,
    };
  });

  const summary = `[AI unavailable - rule-based result] Automated deterministic audit identified ${evidenceList.length} security finding(s). Overall security rating: ${securityScoreObj.grade} (${securityScoreObj.score}/100). Immediate remediation recommended.`;

  return {
    summary,
    findings,
    isRuleBasedFallback: true,
  };
}
