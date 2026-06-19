import { createHash, createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

/** Generates an O(safe URL length) opaque random token, base64url encoded. */
export const generateOpaqueToken = (bytes = 48): string =>
  randomBytes(bytes).toString('base64url');

/** Generate a one-time 10-char recovery code in groups of 5 (XXXXX-XXXXX). */
export const generateRecoveryCode = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/1/I/O
  const chars: string[] = [];
  for (let i = 0; i < 10; i++) {
    const byte = randomBytes(1)[0] ?? 0;
    chars.push(alphabet[byte % alphabet.length]!);
  }
  return `${chars.slice(0, 5).join('')}-${chars.slice(5).join('')}`;
};

export const sha256Hex = (input: string): string =>
  createHash('sha256').update(input).digest('hex');

// ---------------------------------------------------------------------------
// Symmetric encryption for the TOTP secret at rest.
// We use AES-256-GCM with a key derived from TOTP_SECRET_ENC_KEY via scrypt.
// ---------------------------------------------------------------------------

const SCRYPT_SALT = 'petmatchcare-totp-v1';

const deriveKey = (passphrase: string): Buffer =>
  scryptSync(passphrase, SCRYPT_SALT, 32);

export const encryptString = (plain: string, passphrase: string): string => {
  const key = deriveKey(passphrase);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${enc.toString('base64')}.${tag.toString('base64')}`;
};

export const decryptString = (payload: string, passphrase: string): string => {
  const [ivB64, encB64, tagB64] = payload.split('.');
  if (!ivB64 || !encB64 || !tagB64) {
    throw new Error('Malformed encrypted payload');
  }
  const key = deriveKey(passphrase);
  const iv = Buffer.from(ivB64, 'base64');
  const enc = Buffer.from(encB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
};
