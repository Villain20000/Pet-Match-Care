/**
 * TOTP implementation per RFC 6238. We deliberately keep it dependency-free
 * so the core auth package stays small and auditable.
 *
 * Algorithm: SHA-1, 30-second period, 6-digit codes (de-facto industry
 * standard; all major authenticator apps speak it).
 */
import { createHmac } from 'node:crypto';
import { env } from '@/config/env';
import { decryptString, encryptString } from '@/utils/crypto';

/** Decode / encode base32 (RFC 4648, no padding). */
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export const fromBase32 = (s: string): Buffer => {
  const clean = s.replace(/=+$/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  let i = 0;
  const out: Buffer[] = [];
  while (i < clean.length) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]!);
    if (idx < 0) {
      i++;
      continue;
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push(Buffer.from([(value >>> (bits - 8)) & 0xff]));
      bits -= 8;
      value &= (1 << bits) - 1;
    }
    i++;
  }
  return Buffer.concat(out);
};

export const toBase32 = (buf: Buffer): string => {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
      value &= (1 << bits) - 1;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  return out;
};

export const generateSecret = (): string => {
  // 20 bytes → 160 bits (recommended by RFC 6238 §5.1)
  const buf = Buffer.alloc(20);
  for (let i = 0; i < 20; i++) buf[i] = Math.floor(Math.random() * 256);
  return toBase32(buf);
};

const counterAt = (now: Date, periodSeconds = 30): number =>
  Math.floor(now.getTime() / 1000 / periodSeconds);

const computeHotp = (secret: Buffer, counter: number, digits = 6): string => {
  const buf = Buffer.alloc(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    buf[i] = c & 0xff;
    c = Math.floor(c / 256);
  }
  const hmac = createHmac('sha1', secret).update(buf).digest();
  const offset = hmac[hmac.length - 1]! & 0xf;
  const binary =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);
  const mod = binary % 10 ** digits;
  return mod.toString().padStart(digits, '0');
};

/** Returns the 6-digit code for `now` or null if `code` doesn't match either of ±1 windows. */
export const verifyTotp = (
  secretBase32: string,
  code: string,
  now: Date = new Date(),
): boolean => {
  if (!/^\d{6}$/.test(code)) return false;
  const secret = fromBase32(secretBase32);
  const counter = counterAt(now);
  return (
    computeHotp(secret, counter) === code ||
    computeHotp(secret, counter - 1) === code || // ±30 s for clock drift
    computeHotp(secret, counter + 1) === code
  );
};

export const buildOtpAuthUri = (secretBase32: string, accountName: string): string => {
  const label = encodeURIComponent(`${env.TOTP_ISSUER}:${accountName}`);
  const issuer = encodeURIComponent(env.TOTP_ISSUER);
  return `otpauth://totp/${label}?secret=${secretBase32}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
};

// Encrypted-at-rest helpers -------------------------------------------------
export const encryptSecret = (plain: string): string => encryptString(plain, env.TOTP_SECRET_ENC_KEY);
export const decryptSecret = (cipher: string): string => decryptString(cipher, env.TOTP_SECRET_ENC_KEY);
