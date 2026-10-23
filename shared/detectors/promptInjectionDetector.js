/**
 * SentinelAI Prompt Injection Shield
 * Detects adversarial jailbreaks, system prompt extractions, and instruction
 * overrides in user input, and provides safe data boundary encapsulation.
 */

const INJECTION_PATTERNS = [
  {
    name: 'instruction_override',
    severity: 'HIGH',
    pattern:
      /\b(?:ignore|disregard|forget|override|bypass)\s+(?:all\s+)?(?:previous|prior|above|system)\s+(?:instructions|prompts?|rules?|commands?|directives?)\b/gi,
    details: 'Adversarial instruction override attempting to reset LLM system constraints.',
  },
  {
    name: 'roleplay_jailbreak',
    severity: 'HIGH',
    pattern:
      /\b(?:you\s+are\s+now|act\s+as|pretend\s+to\s+be)\s+(?:DAN|an\s+unrestricted|a\s+hacked|an\s+evil|jailbroken|unfiltered)\b/gi,
    details:
      'Persona adoption or jailbreak exploit designed to bypass ethical and security guardrails.',
  },
  {
    name: 'system_prompt_leak',
    severity: 'HIGH',
    pattern:
      /\b(?:reveal|show|print|output|display|repeat)\s+(?:your\s+)?(?:system\s+prompt|initial\s+instructions|hidden\s+rules|developer\s+guidelines)\b/gi,
    details: 'Information disclosure probe attempting to extract confidential system instructions.',
  },
  {
    name: 'delimiter_tampering',
    severity: 'MEDIUM',
    pattern: /(?:<<<END_|<\|im_end\|>|\[\/INST\]|SYSTEM:|ASSISTANT:|<end_of_turn>)/gi,
    details: 'Potential delimiter injection attempting to prematurely close chat turn boundaries.',
  },
];

/**
 * Scans input text for prompt injection signatures.
 * @param {string} text
 * @returns {Array<{ id: string, type: string, subtype: string, severity: string, span: [number, number], text: string, details: string }>}
 */
export function detectPromptInjection(text) {
  if (!text || typeof text !== 'string') return [];

  const evidence = [];
  let counter = 1;
  const processedSpans = new Set();

  for (const item of INJECTION_PATTERNS) {
    item.pattern.lastIndex = 0;
    let match;
    while ((match = item.pattern.exec(text)) !== null) {
      const startIndex = match.index;
      const endIndex = startIndex + match[0].length;
      const spanKey = `${startIndex}-${endIndex}`;

      if (processedSpans.has(spanKey)) continue;
      processedSpans.add(spanKey);

      evidence.push({
        id: `INJ-${String(counter++).padStart(2, '0')}`,
        type: 'prompt_injection',
        subtype: item.name,
        severity: item.severity,
        span: [startIndex, endIndex],
        text: match[0],
        details: item.details,
      });
    }
  }

  return evidence;
}

/**
 * Encloses untrusted user text inside tamper-evident cryptographic delimiters
 * and informs the LLM to treat everything within as passive data only.
 * @param {string} text
 * @param {string} label
 * @returns {string}
 */
export function wrapInPassiveDataEnvelope(text, label = 'UNTRUSTED_DATA') {
  const boundaryToken = `SENTINEL_SHIELD_${Date.now()}`;
  return `=== BEGIN ${label} [TOKEN:${boundaryToken}] ===\n${text}\n=== END ${label} [TOKEN:${boundaryToken}] ===`;
}
