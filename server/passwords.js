import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
export function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 8) throw new Error('Password must contain at least 8 characters');
  const salt=randomBytes(16).toString('hex');
  return `scrypt:${salt}:${scryptSync(password,salt,64).toString('hex')}`;
}
export function verifyPassword(password,stored) {
  if(stored==='activation_pending')return false;
  if (!stored?.startsWith('scrypt:')) return stored===password;
  const [,salt,hex]=stored.split(':'); const expected=Buffer.from(hex,'hex'); const actual=scryptSync(password,salt,64);
  return expected.length===actual.length && timingSafeEqual(expected,actual);
}
