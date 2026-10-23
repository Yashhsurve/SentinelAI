import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

let aiInstance = null;

function getAiClient() {
  if (!config.geminiApiKey) {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: config.geminiApiKey });
  }
  return aiInstance;
}

/**
 * Message Analysis Response Schema for Gemini
 */
export const MESSAGE_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    verdict: {
      type: 'STRING',
      enum: ['SAFE', 'SUSPICIOUS', 'SCAM'],
      description: 'Overall classification of the message',
    },
    explanation: {
      type: 'STRING',
      description: 'Clear, plain-language breakdown of the security findings in the requested language',
    },
    findings: {
      type: 'ARRAY',
      description: 'Detailed analysis for each deterministic evidence item',
      items: {
        type: 'OBJECT',
        properties: {
          evidenceId: {
            type: 'STRING',
            description: 'The exact deterministic evidence ID this finding grounds on (e.g. URL-01, TACTIC-01)',
          },
          explanation: {
            type: 'STRING',
            description: 'Why this specific item is dangerous or suspicious',
          },
          severity: {
            type: 'STRING',
            enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
          },
        },
        required: ['evidenceId', 'explanation', 'severity'],
      },
    },
    checklist: {
      type: 'ARRAY',
      description: 'Actionable emergency steps to protect oneself, including Indian cyber helpline 1930 and cybercrime.gov.in',
      items: { type: 'STRING' },
    },
    defangedRewrite: {
      type: 'STRING',
      description: 'Defanged, safe-to-share version of the message with URLs neutralized (e.g. hxxp://...) and sensitive entities masked',
    },
  },
  required: ['verdict', 'explanation', 'findings', 'checklist', 'defangedRewrite'],
};

/**
 * Code Analysis Response Schema for Gemini
 */
export const CODE_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: {
      type: 'STRING',
      description: 'Executive security assessment of the analyzed source code snippet',
    },
    findings: {
      type: 'ARRAY',
      description: 'Verified explanations and remediations mapped to deterministic evidence IDs',
      items: {
        type: 'OBJECT',
        properties: {
          evidenceId: {
            type: 'STRING',
            description: 'The exact deterministic evidence ID (e.g. SEC-01, VULN-01)',
          },
          explanation: {
            type: 'STRING',
            description: 'Technical explanation of the vulnerability and attack vector',
          },
          severity: {
            type: 'STRING',
            enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
          },
          suggestedFix: {
            type: 'STRING',
            description: 'Concrete, production-ready replacement code that resolves the vulnerability without side-effects',
          },
        },
        required: ['evidenceId', 'explanation', 'severity', 'suggestedFix'],
      },
    },
  },
  required: ['summary', 'findings'],
};

/**
 * Calls Gemini with structured JSON output, timeout, and exponential backoff retry.
 * @param {string} prompt - Prompt to submit
 * @param {object} schema - JSON schema to enforce
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<object>} Structured parsed JSON
 */
export async function callGeminiStructured(prompt, schema, maxRetries = 2) {
  const client = getAiClient();
  if (!client) {
    throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
  }

  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    try {
      const response = await client.models.generateContent({
        model: config.geminiModel,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.1, // Low temperature for consistent deterministic reasoning
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Empty response received from Gemini API');
      }

      return JSON.parse(text);
    } catch (err) {
      lastError = err;
      attempt++;
      if (attempt <= maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 800;
        logger.warn(`Gemini call failed (attempt ${attempt}/${maxRetries}), retrying in ${backoffMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw lastError;
}
