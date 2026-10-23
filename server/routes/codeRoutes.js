import express from 'express';
import { z } from 'zod';
import { validateBody, codeAnalysisSchema } from '../middleware/validator.js';
import { runCodePipeline } from '../agent/pipeline.js';
import { scanCodeSecrets } from '../../shared/detectors/codeSecretScanner.js';
import { scanCodeVulnerabilities } from '../../shared/detectors/codeVulnerabilityScanner.js';
import { detectPromptInjection } from '../../shared/detectors/promptInjectionDetector.js';
import { calculateCodeSecurityScore } from '../../shared/scoring.js';
import { agentCache } from '../utils/cache.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

const verifyFixSchema = z
  .object({
    originalCode: z.string().max(50000),
    fixedCode: z.string().max(50000),
  })
  .strict();

router.post('/analyze-code', validateBody(codeAnalysisSchema), async (req, res) => {
  try {
    const { code, language, clientMaskCounts } = req.validatedBody;
    const cacheKey = `code:${agentCache.hashKey({ code, language })}`;

    const cached = agentCache.get(cacheKey);
    if (cached) {
      logger.info('Code analysis served from LRU cache');
      return res.json({
        ...cached,
        isCached: true,
        agentTrace: [
          {
            step: 'CACHE',
            status: 'HIT',
            durationMs: 1,
            note: 'Retrieved code audit from in-memory LRU cache',
          },
          ...cached.agentTrace,
        ],
      });
    }

    const result = await runCodePipeline({ code, language, clientMaskCounts });
    agentCache.set(cacheKey, result);

    return res.json(result);
  } catch (err) {
    logger.error('Error during code analysis pipeline', err);
    return res.status(500).json({
      error: 'Security audit failed',
      message: 'An internal error occurred while analyzing code.',
    });
  }
});

/**
 * FIX VERIFICATION LOOP Endpoint
 * Re-runs the deterministic scanners on original vs fixed code
 * and computes exact score improvement and remaining issues.
 */
router.post('/verify-fix', validateBody(verifyFixSchema), (req, res) => {
  try {
    const { originalCode, fixedCode } = req.validatedBody;

    // Scan original
    const origEvidence = [
      ...scanCodeSecrets(originalCode),
      ...scanCodeVulnerabilities(originalCode),
      ...detectPromptInjection(originalCode),
    ];
    const origScore = calculateCodeSecurityScore(origEvidence);

    // Scan fixed
    const fixedEvidence = [
      ...scanCodeSecrets(fixedCode),
      ...scanCodeVulnerabilities(fixedCode),
      ...detectPromptInjection(fixedCode),
    ];
    const fixedScore = calculateCodeSecurityScore(fixedEvidence);

    const improvement = fixedScore.score - origScore.score;

    return res.json({
      original: {
        score: origScore.score,
        grade: origScore.grade,
        issuesCount: origEvidence.length,
        evidence: origEvidence,
      },
      fixed: {
        score: fixedScore.score,
        grade: fixedScore.grade,
        issuesCount: fixedEvidence.length,
        evidence: fixedEvidence,
      },
      scoreImprovement: improvement,
      isResolved: fixedEvidence.length === 0,
      newIssuesIntroduced: fixedEvidence.filter(
        (f) => !origEvidence.some((o) => o.subtype === f.subtype && o.lineNumber === f.lineNumber)
      ),
    });
  } catch (err) {
    logger.error('Error during fix verification loop', err);
    return res.status(500).json({ error: 'Fix verification failed' });
  }
});

export default router;
