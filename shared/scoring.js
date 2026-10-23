/**
 * SentinelAI Deterministic Risk & Security Scoring Engine
 * Computes transparent, auditable scores with detailed factor breakdowns.
 * Note: AI never decides scores; deterministic code decides, AI only explains.
 */

/**
 * Calculates Threat Risk Score (0 to 100) for messages
 * 0 = Safe, 100 = Imminent High-Risk Scam
 * @param {Array<any>} evidenceList
 * @returns {{ score: number, level: 'SAFE' | 'SUSPICIOUS' | 'SCAM', breakdown: Record<string, number>, factors: Array<{ label: string, points: number, reason: string }> }}
 */
export function calculateMessageRiskScore(evidenceList = []) {
  let score = 0;
  const factors = [];
  const breakdown = {
    urlThreats: 0,
    psychologicalManipulation: 0,
    credentialHarvesting: 0,
    impersonation: 0,
    promptInjection: 0,
  };

  for (const item of evidenceList) {
    let points = 0;
    let category = 'other';

    if (item.type === 'url_analysis') {
      points = item.severity === 'CRITICAL' ? 35 : item.severity === 'HIGH' ? 20 : 10;
      breakdown.urlThreats += points;
      category = 'URL Threats';
    } else if (item.type === 'manipulation_tactic') {
      if (item.subtype === 'credential_request') {
        points = 40;
        breakdown.credentialHarvesting += points;
        category = 'Credential Harvesting';
      } else if (item.subtype === 'fear_threat' || item.subtype === 'urgency') {
        points = item.severity === 'CRITICAL' ? 30 : 20;
        breakdown.psychologicalManipulation += points;
        category = 'Urgency / Fear Coercion';
      } else if (item.subtype === 'authority_impersonation') {
        points = 25;
        breakdown.impersonation += points;
        category = 'Authority Impersonation';
      } else if (item.subtype === 'reward_lottery_bait' || item.subtype === 'payment_demand') {
        points = 25;
        breakdown.credentialHarvesting += points;
        category = 'Financial Exploitation';
      }
    } else if (item.type === 'scam_classification') {
      points = 15;
      breakdown.impersonation += points;
      category = 'Pattern Match';
    } else if (item.type === 'prompt_injection') {
      points = 30;
      breakdown.promptInjection += points;
      category = 'Prompt Injection Shield';
    }

    if (points > 0) {
      score += points;
      factors.push({
        id: item.id,
        label: `${category}: ${item.subtype || item.type}`,
        points,
        reason: item.details || item.text,
      });
    }
  }

  // Cap total score at 100
  const normalizedScore = Math.min(100, Math.max(0, score));

  let level = 'SAFE';
  if (normalizedScore >= 60) {
    level = 'SCAM';
  } else if (normalizedScore >= 25) {
    level = 'SUSPICIOUS';
  }

  return {
    score: normalizedScore,
    level,
    breakdown,
    factors,
  };
}

/**
 * Calculates Code Security Score (0 to 100)
 * 100 = Pristine / Secure, 0 = Critically Vulnerable
 * @param {Array<any>} evidenceList
 * @returns {{ score: number, grade: 'A+' | 'A' | 'B' | 'C' | 'F', status: 'SECURE' | 'NEEDS_REVIEW' | 'VULNERABLE', deductions: Array<{ id: string, label: string, points: number, reason: string }> }}
 */
export function calculateCodeSecurityScore(evidenceList = []) {
  let score = 100;
  const deductions = [];

  for (const item of evidenceList) {
    let penalty = 0;
    if (item.severity === 'CRITICAL') {
      penalty = 30;
    } else if (item.severity === 'HIGH') {
      penalty = 15;
    } else if (item.severity === 'MEDIUM') {
      penalty = 8;
    } else {
      penalty = 4;
    }

    score -= penalty;
    deductions.push({
      id: item.id,
      label: `${item.subtype || item.type} (Line ${item.lineNumber || 'N/A'})`,
      points: penalty,
      reason: item.details,
    });
  }

  const finalScore = Math.max(0, Math.min(100, score));

  let grade = 'A+';
  let status = 'SECURE';

  if (finalScore >= 90) {
    grade = 'A';
    status = 'SECURE';
  } else if (finalScore >= 75) {
    grade = 'B';
    status = 'NEEDS_REVIEW';
  } else if (finalScore >= 50) {
    grade = 'C';
    status = 'VULNERABLE';
  } else {
    grade = 'F';
    status = 'VULNERABLE';
  }

  return {
    score: finalScore,
    grade,
    status,
    deductions,
  };
}
