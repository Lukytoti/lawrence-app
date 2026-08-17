import crypto from 'crypto';

export function isSsrfTargetBlocked(urlStr: string, allowlist: string[] = []): boolean {
  try {
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();

    // Check explicit allowlist
    if (allowlist.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) {
      return false;
    }

    // Block localhost, 127.0.0.1, 0.0.0.0, ::1, [::1]
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname === '[::1]' ||
      hostname === '::' ||
      hostname === '[::]' ||
      hostname.includes('::1')
    ) {
      return true;
    }

    // Block Cloud Metadata endpoints
    if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
      return true;
    }

    // Block RFC1918 Private IPv4 Ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x) and Link-Local (169.254.x.x)
    const ipParts = hostname.split('.').map((p) => parseInt(p, 10));
    if (ipParts.length === 4 && !ipParts.some(isNaN)) {
      const [b1, b2] = ipParts;
      if (b1 === 10) return true;
      if (b1 === 172 && b2 >= 16 && b2 <= 31) return true;
      if (b1 === 192 && b2 === 168) return true;
      if (b1 === 169 && b2 === 254) return true;
    }

    return false;
  } catch (err) {
    return true; // Block unparseable URLs for safety
  }
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  secret: string,
  algorithm: string = 'HMAC_SHA256'
): boolean {
  if (!signatureHeader || !secret) return false;

  try {
    const computed = generateHmacSignature(rawBody, secret, algorithm);
    
    // Normalize signature header (support "sha256=...", "v1=...", or plain hex)
    let expectedSig = signatureHeader.trim();
    if (expectedSig.includes('=')) {
      expectedSig = expectedSig.split('=')[1];
    }

    const computedBuf = Buffer.from(computed);
    const expectedBuf = Buffer.from(expectedSig);

    if (computedBuf.length !== expectedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuf, expectedBuf);
  } catch (err) {
    return false;
  }
}

export function generateHmacSignature(
  payload: string,
  secret: string,
  algorithm: string = 'HMAC_SHA256'
): string {
  const algo = algorithm.toLowerCase().replace('_', '').replace('hmac', '');
  const hashAlgo = algo.includes('sha256') ? 'sha256' : 'sha512';
  return crypto.createHmac(hashAlgo, secret).update(payload).digest('hex');
}

export function isPayloadSizeExceeded(payloadString: string, maxBytes: number = 10 * 1024 * 1024): boolean {
  return Buffer.byteLength(payloadString, 'utf8') > maxBytes;
}

export function sanitizeIntegrationMetadata(data: any): any {
  if (!data) return data;

  if (typeof data === 'string') {
    let sanitized = data;
    sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9\-\._~\+\/]+=*/gi, 'Bearer [REDACTED]');
    sanitized = sanitized.replace(/sk_[live|test]_[0-9a-zA-Z]+/gi, '[REDACTED_API_KEY]');
    return sanitized;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeIntegrationMetadata);
  }

  if (typeof data === 'object') {
    const clean: Record<string, any> = {};
    const sensitiveKeys = [
      'password',
      'secret',
      'token',
      'apikey',
      'api_key',
      'clientsecret',
      'client_secret',
      'authorization',
      'bearer',
      'webhooksecret',
      'webhook_secret',
      'privatekey',
      'private_key',
      'cvv',
      'creditcard',
    ];

    for (const [key, val] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((s) => lowerKey.includes(s))) {
        clean[key] = '[REDACTED]';
      } else {
        clean[key] = sanitizeIntegrationMetadata(val);
      }
    }
    return clean;
  }

  return data;
}
