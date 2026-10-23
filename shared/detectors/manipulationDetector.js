/**
 * SentinelAI Manipulation Tactics Detector
 * Detects psychological coercion patterns (urgency, fear/threats, authority impersonation,
 * reward/lottery bait, credential harvesting, payment demands) in English, Hindi, and Marathi transliteration.
 */

interface TacticDefinition {
  subtype: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
  patterns: RegExp[];
}

const TACTICS = [
  {
    subtype: 'credential_request',
    severity: 'CRITICAL',
    description: 'Direct request for high-security credentials (OTP, UPI PIN, CVV, password). Legitimate organizations never request these.',
    patterns: [
      /\b(?:share|send|enter|provide|tell|verify)\s+(?:your\s+)?(?:otp|one[- ]time[- ]password|pin|upi[- ]pin|cvv|atm[- ]pin|password|net[- ]banking\s+password)\b/gi,
      /\b(?:otp|pin|cvv|password)\s+(?:share|bhejo|bataye|sanga|dya|kare|do)\b/gi,
      /\b(?:kripya|please)\s+(?:otp|pin|cvv)\s+(?:share|bhejo|do|dya)\b/gi,
      /\b(?:apna|tumcha)\s+(?:otp|pin|cvv|password)\s+(?:de|bhejo|sanga)\b/gi,
      /\b(?:enter|update)\s+(?:upi[- ]pin|atm[- ]pin)\s+to\s+(?:receive|claim|unblock)\b/gi,
    ],
  },
  {
    subtype: 'fear_threat',
    severity: 'CRITICAL',
    description: 'Coercive threat of legal punishment, arrest, account freeze, or service disconnection designed to induce panic.',
    patterns: [
      /\b(?:account|sim|card|pan|kyc)\s+(?:will be|is|has been)?\s*(?:blocked|suspended|deactivated|frozen|terminated|cancelled)\b/gi,
      /\b(?:electricity|power|bill)\s+(?:will be\s+)?(?:disconnected|cut\s+off)\s+(?:tonight|today|at\s+\d+)\b/gi,
      /\b(?:police|cbi|ed|income\s+tax|fir|legal\s+notice|arrest\s+warrant|court\s+summons|jail)\b/gi,
      /\b(?:account\s+band\s+ho\s+jayega|sim\s+band|line\s+kat\s+jayegi|police\s+action\s+hogi)\b/gi,
      /\b(?:tumche\s+account\s+band\s+hoil|vij\s+khandit\s+keli\s+jail|kaydeshir\s+karwayi)\b/gi,
      /\b(?:penalized|penalty\s+of\s+rs|heavy\s+fine|legal\s+consequences)\b/gi,
    ],
  },
  {
    subtype: 'authority_impersonation',
    severity: 'HIGH',
    description: 'Impersonation of trusted regulatory, banking, or government authorities to exploit institutional trust.',
    patterns: [
      /\b(?:rbi|reserve\s+bank\s+of\s+india|income\s+tax\s+department|cbi|mumbai\s+police|cyber\s+crime\s+cell|trai|customs\s+department)\b/gi,
      /\b(?:sbi\s+manager|bank\s+manager|electricity\s+officer|govt\s+of\s+india|sarkari\s+yojana)\b/gi,
      /\b(?:trai\s+verification|rbi\s+guidelines|central\s+vigilance)\b/gi,
      /\b(?:cyber\s+police\s+department|delhi\s+police\s+crime\s+branch)\b/gi,
    ],
  },
  {
    subtype: 'urgency',
    severity: 'HIGH',
    description: 'Artificial time pressure forcing victims to bypass critical reasoning before verification.',
    patterns: [
      /\b(?:immediately|urgent(?:ly)?|within\s+(?:24|12|2|1)\s*hours?|expires\s+today|act\s+now|last\s+chance|final\s+notice)\b/gi,
      /\b(?:turant|jaldi|fauran|24\s+ghante\s+ke\s+andar|aaj\s+hi|aaj\s+rat\s+tak)\b/gi,
      /\b(?:ata\s+lagech|aajch|tavdit|velet\s+kara|antim\s+suchana)\b/gi,
      /\b(?:avoid\s+penalty|before\s+it\s+is\s+too\s+late|time\s+is\s+running\s+out)\b/gi,
    ],
  },
  {
    subtype: 'reward_lottery_bait',
    severity: 'HIGH',
    description: 'Fake financial windfall or grand prize bait designed to trigger impulsive compliance.',
    patterns: [
      /\b(?:congratulations|you\s+(?:have\s+)?won|lottery\s+winner|kbc\s+lottery|bumper\s+prize|claim\s+(?:your\s+)?prize)\b/gi,
      /\b(?:won\s+(?:rs\.?|inr|\$|₹)?\s*[\d,]+(?:\s*(?:lakh|crore|thousand))?)\b/gi,
      /\b(?:inami\s+rashi|lottery\s+lagi\s+hai|jeeta\s+hai|cashback\s+credited\s+pending)\b/gi,
      /\b(?:paritoshik\s+patra|tumhala\s+lottery\s+lagli|baksheesh)\b/gi,
      /\b(?:free\s+gift\s+card|lucky\s+draw\s+winner|selected\s+for\s+special\s+reward)\b/gi,
    ],
  },
  {
    subtype: 'payment_demand',
    severity: 'HIGH',
    description: 'Demands for upfront fee, processing charges, deposit, or gift cards to "release" funds or prevent action.',
    patterns: [
      /\b(?:processing\s+fee|registration\s+charges?|delivery\s+fee|customs\s+clearance\s+fee|advance\s+payment)\b/gi,
      /\b(?:pay\s+rs\.?|transfer\s+to\s+upi|send\s+money\s+to|pay\s+via\s+google\s+play\s+recharge)\b/gi,
      /\b(?:shulk\s+bhara|paise\s+transfer\s+kara|advance\s+jama\s+karo|khate\s+me\s+bhejo)\b/gi,
      /\b(?:refundable\s+security\s+deposit|refundable\s+amount\s+of\s+rs)\b/gi,
    ],
  },
];

/**
 * Detects psychological manipulation tactics in message text.
 * @param {string} text
 * @returns {Array<{ id: string, type: string, subtype: string, severity: string, span: [number, number], text: string, details: string }>}
 */
export function detectManipulationTactics(text) {
  if (!text || typeof text !== 'string') return [];

  const evidence = [];
  let counter = 1;
  const processedSpans = new Set();

  for (const tactic of TACTICS) {
    for (const pattern of tactic.patterns) {
      // Reset regex state
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const startIndex = match.index;
        const endIndex = startIndex + match[0].length;
        const spanKey = `${startIndex}-${endIndex}`;

        if (processedSpans.has(spanKey)) continue;
        processedSpans.add(spanKey);

        evidence.push({
          id: `TACTIC-${String(counter++).padStart(2, '0')}`,
          type: 'manipulation_tactic',
          subtype: tactic.subtype,
          severity: tactic.severity,
          span: [startIndex, endIndex],
          text: match[0],
          details: tactic.description,
        });
      }
    }
  }

  return evidence;
}
