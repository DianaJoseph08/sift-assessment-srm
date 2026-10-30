import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { database as db, getUserById } from './db.js';

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password, stored) {
  if (!stored?.startsWith('scrypt:')) return stored === password;
  const [, salt, hex] = stored.split(':');
  const expected = Buffer.from(hex, 'hex');
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
db.exec(`CREATE TABLE IF NOT EXISTS auth_sessions (digest TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at TEXT NOT NULL)`);
const digest = token => createHash('sha256').update(token).digest('hex');
export function createSession(res, user) {
  const token = randomBytes(32).toString('hex');
  db.prepare('INSERT INTO auth_sessions VALUES (?,?,?)').run(digest(token), user.id, new Date(Date.now()+12*3600000).toISOString());
  res.cookie('cognihire_session', token, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 12*3600000 });
}
export function sessionUser(req) {
  const token = String(req.headers.cookie || '').split(';').map(s=>s.trim()).find(s=>s.startsWith('cognihire_session='))?.split('=')[1];
  if (!token) return null;
  const session = db.prepare('SELECT * FROM auth_sessions WHERE digest=? AND expires_at>?').get(digest(token), new Date().toISOString());
  return session ? getUserById(session.user_id) : null;
}
export function endSession(req,res) {
  const token = String(req.headers.cookie || '').split(';').map(s=>s.trim()).find(s=>s.startsWith('cognihire_session='))?.split('=')[1];
  if (token) db.prepare('DELETE FROM auth_sessions WHERE digest=?').run(digest(token));
  res.clearCookie('cognihire_session');
}
export const ADMIN_EMAIL = 'praveen.ambrose@motherson.com';
