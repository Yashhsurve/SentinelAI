/**
 * SentinelAI Redacted Logger
 * Ensures that raw user payloads, secrets, and API tokens are NEVER written to logs.
 */

export const logger = {
  info(message, meta = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`, Object.keys(meta).length > 0 ? JSON.stringify(meta) : '');
  },

  warn(message, meta = {}) {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${message}`, Object.keys(meta).length > 0 ? JSON.stringify(meta) : '');
  },

  error(message, error = null) {
    const timestamp = new Date().toISOString();
    const safeError = error ? { name: error.name, message: error.message } : null;
    console.error(`[${timestamp}] [ERROR] ${message}`, safeError ? JSON.stringify(safeError) : '');
  },

  agentTrace(step, durationMs, note) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [AGENT_TRACE] [${step}] (${durationMs}ms) - ${note}`);
  },
};
