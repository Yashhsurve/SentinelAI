import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDemoMode: !process.env.GEMINI_API_KEY,
  cacheTtlMs: 10 * 60 * 1000, // 10 minutes cache TTL
  maxInputLength: 50000, // Max characters allowed per request
};
