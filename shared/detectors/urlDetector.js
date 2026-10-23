/**
 * SentinelAI URL Threat Detector
 * Analyzes URLs in messages for typosquatting/lookalike domains, punycode,
 * suspicious TLDs, IP hosts, URL shorteners, and text-vs-target mismatches.
 */

// Target brands frequently targeted in phishing / scam attacks (especially Indian context)
const TARGET_BRANDS = [
  'paytm',
  'phonepe',
  'google',
  'sbi',
  'onlinesbi',
  'hdfc',
  'hdfcbank',
  'icici',
  'icicibank',
  'amazon',
  'flipkart',
  'axisbank',
  'kotak',
  'pnb',
  'netflix',
  'microsoft',
  'apple',
  'paypal',
  'whatsapp',
  'telegram',
  'airtel',
  'jio',
];

// High-risk or frequently abused TLDs
const SUSPICIOUS_TLDS = new Set([
  'xyz',
  'top',
  'click',
  'cam',
  'work',
  'link',
  'surf',
  'monster',
  'fit',
  'rest',
  'buzz',
  'loan',
  'gq',
  'cf',
  'tk',
  'ml',
  'ga',
  'cc',
  'icu',
  'vip',
  'quest',
]);

// URL shortener services
const SHORTENER_DOMAINS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'is.gd',
  'cutt.ly',
  'rb.gy',
  'ow.ly',
  'shorturl.at',
  'bl.ink',
  'buff.ly',
  'rebrand.ly',
  't.ly',
]);

/**
 * Calculates Levenshtein edit distance between two strings
 */
export function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[a.length][b.length];
}

/**
 * Normalizes text to detect common leetspeak substitutions
 */
function normalizeLeetspeak(str) {
  return str
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'l')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b');
}

/**
 * Extracts and inspects URLs from text.
 * @param {string} text
 * @returns {Array<{ id: string, type: string, subtype: string, severity: string, span: [number, number], text: string, details: string }>}
 */
export function detectUrlThreats(text) {
  if (!text || typeof text !== 'string') return [];

  const evidence = [];
  let counter = 1;

  // 1. Check for Markdown link mismatches e.g. [https://sbi.co.in](http://evil-sbi.xyz)
  const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let mdMatch;
  while ((mdMatch = mdLinkRegex.exec(text)) !== null) {
    const linkText = mdMatch[1].trim();
    const actualUrl = mdMatch[2].trim();
    // If the visible anchor text looks like a trusted domain or URL, but actual URL differs
    if (
      linkText.startsWith('http://') ||
      linkText.startsWith('https://') ||
      linkText.includes('.com') ||
      linkText.includes('.in') ||
      linkText.includes('.org')
    ) {
      try {
        const actualHost = new URL(actualUrl).hostname.toLowerCase();
        const textHost = linkText
          .replace(/^https?:\/\//, '')
          .split('/')[0]
          .toLowerCase();
        if (actualHost !== textHost && !actualHost.endsWith('.' + textHost)) {
          evidence.push({
            id: `URL-${String(counter++).padStart(2, '0')}`,
            type: 'url_analysis',
            subtype: 'anchor_text_mismatch',
            severity: 'CRITICAL',
            span: [mdMatch.index, mdMatch.index + mdMatch[0].length],
            text: mdMatch[0],
            details: `Link text shows "${linkText}" but redirects to completely different domain "${actualHost}". Classic spoofing technique.`,
          });
        }
      } catch {
        // Invalid URL
      }
    }
  }

  // 2. Extract standard URLs and IP addresses
  // Handles http, https, and bare domains with paths or query params
  const urlRegex =
    /(?:https?:\/\/|www\.)[^\s<>"'()[\]{}]+|\b[a-zA-Z0-9-]+\.(?:com|in|org|net|xyz|top|click|co|io|app|live|info|me|store|biz|gov|edu)(?:\/[^\s<>"'()[\]{}]*)?/gi;

  let match;
  const processedSpans = new Set();

  while ((match = urlRegex.exec(text)) !== null) {
    const rawUrl = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + rawUrl.length;

    // Avoid duplicate evidence for overlapping spans
    const spanKey = `${startIndex}-${endIndex}`;
    if (processedSpans.has(spanKey)) continue;
    processedSpans.add(spanKey);

    let parsedUrl;
    let urlString = rawUrl;
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
      urlString = 'http://' + urlString;
    }

    try {
      parsedUrl = new URL(urlString);
    } catch {
      continue;
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    const parts = hostname.split('.');
    const tld = parts[parts.length - 1];
    const domainWithoutTld = parts.slice(0, -1).join('.');

    // Check for raw IP address hostname
    const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    if (isIpAddress) {
      evidence.push({
        id: `URL-${String(counter++).padStart(2, '0')}`,
        type: 'url_analysis',
        subtype: 'ip_address_host',
        severity: 'CRITICAL',
        span: [startIndex, endIndex],
        text: rawUrl,
        details: `Direct IP address used instead of domain name: ${hostname}. Legitimate services never request user credentials or payments over raw IP addresses.`,
      });
      continue;
    }

    // Check for Punycode homograph attack
    if (hostname.includes('xn--')) {
      evidence.push({
        id: `URL-${String(counter++).padStart(2, '0')}`,
        type: 'url_analysis',
        subtype: 'punycode_homograph',
        severity: 'CRITICAL',
        span: [startIndex, endIndex],
        text: rawUrl,
        details: `Punycode internationalized domain (${hostname}) detected. Often used for homoglyph attacks that look identical to genuine brand names.`,
      });
    }

    // Check for URL shorteners
    if (SHORTENER_DOMAINS.has(hostname) || SHORTENER_DOMAINS.has(parts.slice(-2).join('.'))) {
      evidence.push({
        id: `URL-${String(counter++).padStart(2, '0')}`,
        type: 'url_analysis',
        subtype: 'url_shortener',
        severity: 'HIGH',
        span: [startIndex, endIndex],
        text: rawUrl,
        details: `Obfuscated URL shortener (${hostname}) masks the real destination. Attackers frequently use shorteners to bypass security filters.`,
      });
    }

    // Check for Suspicious TLD
    if (SUSPICIOUS_TLDS.has(tld)) {
      evidence.push({
        id: `URL-${String(counter++).padStart(2, '0')}`,
        type: 'url_analysis',
        subtype: 'suspicious_tld',
        severity: 'HIGH',
        span: [startIndex, endIndex],
        text: rawUrl,
        details: `High-risk suspicious top-level domain (.${tld}) commonly associated with disposable fraud and phishing infrastructure.`,
      });
    }

    // Check for Brand Typosquatting / Lookalike domains
    const normalizedDomain = normalizeLeetspeak(domainWithoutTld);
    for (const brand of TARGET_BRANDS) {
      // 1. Check direct inclusion of brand with suspicious keywords (e.g., sbi-kyc-verify, paytm-wallet-update)
      const hasBrandKeyword = domainWithoutTld.includes(brand);
      const isOfficialDomain =
        hostname === `${brand}.com` ||
        hostname === `${brand}.in` ||
        hostname === `${brand}.co.in` ||
        hostname.endsWith(`.${brand}.com`) ||
        hostname.endsWith(`.${brand}.in`) ||
        hostname.endsWith(`.${brand}.co.in`);

      if (hasBrandKeyword && !isOfficialDomain) {
        evidence.push({
          id: `URL-${String(counter++).padStart(2, '0')}`,
          type: 'url_analysis',
          subtype: 'brand_impersonation',
          severity: 'CRITICAL',
          span: [startIndex, endIndex],
          text: rawUrl,
          details: `Brand impersonation detected: domain incorporates "${brand}" but is not on an official domain (${hostname}).`,
        });
        break;
      }

      // 2. Check Levenshtein distance on main SLD (e.g. paytmm, g00gle, flpkart)
      const sld = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
      const dist = levenshteinDistance(sld, brand);
      const normDist = levenshteinDistance(normalizeLeetspeak(sld), brand);

      if (
        (dist === 1 || dist === 2 || normDist === 0 || normDist === 1) &&
        sld !== brand &&
        !isOfficialDomain
      ) {
        evidence.push({
          id: `URL-${String(counter++).padStart(2, '0')}`,
          type: 'url_analysis',
          subtype: 'typosquatting_lookalike',
          severity: 'CRITICAL',
          span: [startIndex, endIndex],
          text: rawUrl,
          details: `Typosquatted lookalike domain for "${brand}": "${sld}" differs by only ${Math.min(dist, normDist)} character(s) from genuine brand.`,
        });
        break;
      }
    }

    // Check for excessive subdomains or fake security tokens
    if (parts.length > 4) {
      evidence.push({
        id: `URL-${String(counter++).padStart(2, '0')}`,
        type: 'url_analysis',
        subtype: 'excessive_subdomains',
        severity: 'MEDIUM',
        span: [startIndex, endIndex],
        text: rawUrl,
        details: `Domain has excessive subdomain depth (${parts.length} levels), commonly used in dynamic DNS phishing kits.`,
      });
    }
  }

  return evidence;
}
