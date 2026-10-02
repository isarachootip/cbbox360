// RFC 6238 TOTP (Time-Based One-Time Password) & Base32 Engine
// Fully compatible with Microsoft Authenticator and Google Authenticator

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decodes a Base32 string into a Uint8Array
 */
export function base32Decode(input: string): Uint8Array {
  const cleaned = input.toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

/**
 * Encodes a Uint8Array into a Base32 string
 */
export function base32Encode(buffer: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Generates a cryptographically secure Base32 secret for TOTP (default 20 bytes = 32 Base32 characters)
 */
export function generateTotpSecret(byteLength = 20): string {
  const randomBytes = new Uint8Array(byteLength);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(randomBytes);
  } else if (typeof crypto !== 'undefined') {
    crypto.getRandomValues(randomBytes);
  }
  return base32Encode(randomBytes);
}

/**
 * Generates standard otpauth URI for Microsoft Authenticator / Google Authenticator
 */
export function generateTotpUri(username: string, secret: string, issuer = 'CustBox360'): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(username);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Formats a secret key in chunks of 4 characters for manual user entry
 */
export function formatSecretForDisplay(secret: string): string {
  return secret.replace(/\s+/g, '').match(/.{1,4}/g)?.join(' ') || secret;
}

/**
 * Calculates a 6-digit TOTP code for a given timestamp
 */
export async function generateTotpCode(secret: string, timestamp = Date.now()): Promise<string> {
  const stepSeconds = 30;
  const counter = Math.floor(timestamp / 1000 / stepSeconds);
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  
  // Set counter as 64-bit big endian integer
  counterView.setUint32(0, 0, false);
  counterView.setUint32(4, counter, false);

  const keyBytes = base32Decode(secret);
  const keyBuffer = keyBytes.buffer.slice(
    keyBytes.byteOffset,
    keyBytes.byteOffset + keyBytes.byteLength
  ) as ArrayBuffer;
  const subtle = typeof window !== 'undefined' ? window.crypto.subtle : crypto.subtle;

  const cryptoKey = await subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await subtle.sign('HMAC', cryptoKey, counterBuffer);
  const signatureBytes = new Uint8Array(signature);

  // Dynamic truncation (RFC 4226)
  const offset = signatureBytes[signatureBytes.length - 1] & 0x0f;
  const binary =
    ((signatureBytes[offset] & 0x7f) << 24) |
    ((signatureBytes[offset + 1] & 0xff) << 16) |
    ((signatureBytes[offset + 2] & 0xff) << 8) |
    (signatureBytes[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verifies a 6-digit TOTP code with time-drift tolerance (default +/- 2 steps of 30s = +/- 60s)
 */
export async function verifyTotpCode(token: string, secret: string, windowSteps = 2): Promise<boolean> {
  const cleanToken = token.trim().replace(/\s+/g, '');
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
    return false;
  }

  const now = Date.now();
  const stepMs = 30 * 1000;

  for (let i = -windowSteps; i <= windowSteps; i++) {
    const expected = await generateTotpCode(secret, now + i * stepMs);
    if (expected === cleanToken) {
      return true;
    }
  }

  return false;
}
