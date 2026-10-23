/**
 * SentinelAI API Service Client
 */

const API_BASE = '/api';

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (err) {
    return {
      status: 'offline',
      service: 'SentinelAI',
      mode: 'client-only fallback',
    };
  }
}

export async function analyzeMessageApi({ text, language, clientMaskCounts }) {
  const res = await fetch(`${API_BASE}/analyze-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language, clientMaskCounts }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Failed to analyze message');
  }

  return await res.json();
}

export async function analyzeCodeApi({ code, language, clientMaskCounts }) {
  const res = await fetch(`${API_BASE}/analyze-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language, clientMaskCounts }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Failed to analyze code');
  }

  return await res.json();
}

export async function verifyFixApi({ originalCode, fixedCode }) {
  const res = await fetch(`${API_BASE}/verify-fix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ originalCode, fixedCode }),
  });

  if (!res.ok) {
    throw new Error('Failed to verify code remediation');
  }

  return await res.json();
}
