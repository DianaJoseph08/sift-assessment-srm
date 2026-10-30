import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { getSetting, saveSetting } from './db.js';
let secret=getSetting('INTERVIEW_SIGNING_SECRET');
if(!secret){secret=randomBytes(32).toString('hex');saveSetting('INTERVIEW_SIGNING_SECRET',secret);}
export function interviewToken(id) {
  const expires=Date.now()+7*86400000;
  const payload=`${id}|${expires}`;
  return `${expires}.${createHmac('sha256',secret).update(payload).digest('hex')}`;
}
export function validInterviewToken(id,token) {
  if(!id||typeof token!=='string')return false;
  const [expires,signature]=token.split('.');if(!/^\d+$/.test(expires)||Number(expires)<Date.now()||!signature)return false;
  const expected=Buffer.from(createHmac('sha256',secret).update(`${id}|${expires}`).digest('hex'));const given=Buffer.from(signature);
  return expected.length===given.length && timingSafeEqual(expected,given);
}
