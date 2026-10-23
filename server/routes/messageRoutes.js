import express from 'express';
import { validateBody, messageAnalysisSchema } from '../middleware/validator.js';
import { runMessagePipeline } from '../agent/pipeline.js';
import { agentCache } from '../utils/cache.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.post('/analyze-message', validateBody(messageAnalysisSchema), async (req, res) => {
  try {
    const { text, language, clientMaskCounts } = req.validatedBody;
    const cacheKey = `msg:${agentCache.hashKey({ text, language })}`;

    // Check LRU cache
    const cached = agentCache.get(cacheKey);
    if (cached) {
      logger.info('Message analysis served from LRU cache');
      return res.json({
        ...cached,
        isCached: true,
        agentTrace: [
          {
            step: 'CACHE',
            status: 'HIT',
            durationMs: 1,
            note: 'Retrieved instantaneous analysis from in-memory LRU cache',
          },
          ...cached.agentTrace,
        ],
      });
    }

    const result = await runMessagePipeline({ text, language, clientMaskCounts });
    agentCache.set(cacheKey, result);

    return res.json(result);
  } catch (err) {
    logger.error('Error during message analysis pipeline', err);
    return res.status(500).json({
      error: 'Security analysis failed',
      message: 'An internal error occurred while processing the message. Please retry.',
    });
  }
});

export default router;
