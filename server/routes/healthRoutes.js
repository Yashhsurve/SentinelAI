import express from 'express';
import { config } from '../config.js';
import { agentCache } from '../utils/cache.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'SentinelAI: Autonomous Security Investigator',
    version: '1.0.0',
    mode: config.isDemoMode ? 'demo (rule-based fallback)' : 'live (Gemini active)',
    model: config.geminiModel,
    uptimeSeconds: Math.floor(process.uptime()),
    cacheSize: agentCache.size(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
