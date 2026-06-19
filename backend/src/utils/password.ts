import bcrypt from 'bcryptjs';
import { env } from '@/config/env';

export const hashPassword = async (plain: string): Promise<string> => {
  if (!plain || plain.length < 8) {
    throw new Error('Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες');
  }
  return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
};

export const verifyPassword = async (plain: string, hash: string): Promise<boolean> => {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
};
