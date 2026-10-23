/**
 * SentinelAI Deterministic Scam Type Classifier
 * Classifies messages into actionable threat taxonomy:
 * - UPI/KYC Fraud
 * - Fake Job / Task Scam
 * - Lottery / Prize Bait
 * - Parcel Delivery Trap
 * - Bank Impersonation
 * - Other / Generic Suspicious
 */

const SCAM_CATEGORIES = [
  {
    type: 'upi_kyc',
    label: 'UPI / KYC Deactivation Fraud',
    description: 'Fraudulent alert claiming your bank account, SIM, or digital wallet KYC is expired or suspended to steal banking credentials or install malicious APKs.',
    keywords: [
      /\b(?:kyc\s+update|pan\s+linked|aadhaar\s+kyc|sim\s+kyc|paytm\s+kyc|wallet\s+blocked|yono\s+sbi\s+kyc|de-?activated|complete\s+kyc)\b/i,
      /\b(?:kyc\s+nahi\s+karwaya|kyc\s+adhura|kyc\s+khatam)\b/i,
    ],
  },
  {
    type: 'bank_impersonation',
    label: 'Bank Account & Card Fraud',
    description: 'Impersonation of a major bank claiming unauthorized transactions, reward points expiration, or immediate card blocking.',
    keywords: [
      /\b(?:sbi|hdfc|icici|axis\s*bank|punjab\s*national|kotak|bank\s+alert|netbanking\s+blocked|credit\s+card\s+points|debit\s+card\s+blocked)\b/i,
      /\b(?:khata\s+band|bank\s+khata|bank\s+se\s+sampark)\b/i,
    ],
  },
  {
    type: 'parcel_delivery',
    label: 'Failed Delivery / Customs Trap',
    description: 'Fake postal or courier notification claiming address failure or customs fees requiring payment or clicking malicious links.',
    keywords: [
      /\b(?:india\s+post|speed\s+post|parcel\s+pending|delivery\s+failed|package\s+held|customs\s+duty|dhl|fedex|courier\s+address|reschedule\s+delivery)\b/i,
      /\b(?:parcel\s+atka\s+hai|delivery\s+ke\s+liye)\b/i,
    ],
  },
  {
    type: 'fake_job',
    label: 'Fake Task / Job Scam',
    description: 'Work-from-home or part-time task offer promising high daily earnings for liking videos or rating hotels, leading to cryptocurrency/deposit fraud.',
    keywords: [
      /\b(?:part[- ]time\s+job|work\s+from\s+home|daily\s+income|earn\s+rs\.?\s*\d+|like\s+(?:and|&)\s+subscribe|telegram\s+task|youtube\s+review|hr\s+recruiter)\b/i,
      /\b(?:ghar\s+baithe\s+kamaye|roj\s+ka\s+paisa|task\s+pura\s+karo)\b/i,
    ],
  },
  {
    type: 'lottery_prize',
    label: 'Lottery / Prize Scheme',
    description: 'Fraudulent notification claiming a lottery or contest win requiring a processing fee or credential disclosure.',
    keywords: [
      /\b(?:kbc\s+lottery|bumper\s+lottery|lucky\s+draw|car\s+winner|prize\s+money|won\s+rs\.?\s*\d+\s*(?:lakh|crore)|claim\s+reward)\b/i,
      /\b(?:inami\s+rashi|lottery\s+vijeta)\b/i,
    ],
  },
];

/**
 * Classifies message scam category and returns evidence if matching
 * @param {string} text
 * @returns {{ category: { type: string, label: string, description: string }, evidence: Array<any> }}
 */
export function classifyScamType(text) {
  if (!text || typeof text !== 'string') {
    return {
      category: {
        type: 'none',
        label: 'No Scam Category Detected',
        description: 'Text does not match any recognized deterministic scam patterns.',
      },
      evidence: [],
    };
  }

  const evidence = [];
  let detectedCategory = null;

  for (const cat of SCAM_CATEGORIES) {
    for (const pattern of cat.keywords) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match) {
        if (!detectedCategory) {
          detectedCategory = cat;
        }
        evidence.push({
          id: `SCAM-${String(evidence.length + 1).padStart(2, '0')}`,
          type: 'scam_classification',
          subtype: cat.type,
          severity: 'HIGH',
          span: [match.index, match.index + match[0].length],
          text: match[0],
          details: `Identified indicators characteristic of ${cat.label}: "${match[0]}".`,
        });
        break;
      }
    }
  }

  return {
    category: detectedCategory
      ? { type: detectedCategory.type, label: detectedCategory.label, description: detectedCategory.description }
      : { type: 'unknown_or_safe', label: 'Unclassified / Potential Phishing', description: 'No specific vertical category matched.' },
    evidence,
  };
}
