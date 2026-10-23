import { describe, it, expect } from 'vitest';
import { maskSensitiveData } from '../shared/masking.js';

describe('Privacy Masking Engine', () => {
  it('masks email addresses with [EMAIL_X] placeholders', () => {
    const input = 'Contact our support officer at alert@fraud-sbi.com or admin@bank.in immediately.';
    const result = maskSensitiveData(input);

    expect(result.maskedText).toContain('[EMAIL_1]');
    expect(result.maskedText).toContain('[EMAIL_2]');
    expect(result.maskedText).not.toContain('alert@fraud-sbi.com');
    expect(result.counts.email).toBe(2);
  });

  it('masks Indian and international phone numbers', () => {
    const input = 'Call officer Sharma at +91 9876543210 or 8888877777 now.';
    const result = maskSensitiveData(input);

    expect(result.maskedText).toContain('[PHONE_1]');
    expect(result.maskedText).not.toContain('9876543210');
    expect(result.counts.phone).toBeGreaterThanOrEqual(1);
  });

  it('masks 12-digit Indian Aadhaar numbers', () => {
    const input = 'Your Aadhaar number 5432 1098 7654 requires biometric update.';
    const result = maskSensitiveData(input);

    expect(result.maskedText).toContain('[AADHAAR_1]');
    expect(result.maskedText).not.toContain('5432 1098 7654');
    expect(result.counts.aadhaar).toBe(1);
  });

  it('masks Indian PAN card numbers (5 letters, 4 digits, 1 letter)', () => {
    const input = 'PAN ABCDE1234F is deactivated. Link PAN now.';
    const result = maskSensitiveData(input);

    expect(result.maskedText).toContain('[PAN_1]');
    expect(result.maskedText).not.toContain('ABCDE1234F');
    expect(result.counts.pan).toBe(1);
  });

  it('masks Credit Card numbers', () => {
    const input = 'Payment from card 4111 2222 3333 4444 failed.';
    const result = maskSensitiveData(input);

    expect(result.maskedText).toContain('[CARD_1]');
    expect(result.maskedText).not.toContain('4111 2222 3333 4444');
    expect(result.counts.card).toBe(1);
  });

  it('masks AWS access keys and Google API keys', () => {
    const input = 'const aws = "AKIAIOSFODNN7EXAMPLE"; const gKey = "AIzaSyD-1234567890abcdefghijklmnopqrstuv";';
    const result = maskSensitiveData(input);

    expect(result.maskedText).toContain('[AWS_KEY_1]');
    expect(result.maskedText).toContain('[GOOGLE_KEY_2]');
    expect(result.maskedText).not.toContain('AKIAIOSFODNN7EXAMPLE');
    expect(result.maskedText).not.toContain('AIzaSyD-1234567890abcdefghijklmnopqrstuv');
    expect(result.counts.secret).toBe(2);
  });

  it('masks GitHub tokens and private key blocks', () => {
    const input = `const token = "ghp_123456789012345678901234567890123456";
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0m...fakekey...
-----END RSA PRIVATE KEY-----`;
    const result = maskSensitiveData(input);

    expect(result.maskedText).toContain('[PRIVATE_KEY_1]');
    expect(result.maskedText).toContain('[GITHUB_TOKEN_2]');
    expect(result.maskedText).not.toContain('ghp_1234567890');
    expect(result.maskedText).not.toContain('BEGIN RSA PRIVATE KEY');
  });

  it('returns clean results on empty or null inputs', () => {
    const emptyResult = maskSensitiveData('');
    expect(emptyResult.maskedText).toBe('');
    expect(emptyResult.totalMasked).toBe(0);

    const nullResult = maskSensitiveData(null);
    expect(nullResult.maskedText).toBe('');
    expect(nullResult.totalMasked).toBe(0);
  });
});
