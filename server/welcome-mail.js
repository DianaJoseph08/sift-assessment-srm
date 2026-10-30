import nodemailer from 'nodemailer';
import {randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {getSetting,saveSetting,addLog} from './db.js';
import {ADMIN_EMAIL} from './security.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const setting='ACCOUNT_EMAIL_CONFIG';
const read=()=>{try{return JSON.parse(getSetting(setting)||'{}');}catch{return {};}};
function encryptionKey(){
 if(process.env.MAIL_ENCRYPTION_KEY){const key=Buffer.from(process.env.MAIL_ENCRYPTION_KEY,'base64');if(key.length!==32)throw new Error('MAIL_ENCRYPTION_KEY must be a base64 encoded 32-byte key');return key;}
 const keyPath=path.join(root,'scratch','secrets','smtp.key');fs.mkdirSync(path.dirname(keyPath),{recursive:true});
 if(!fs.existsSync(keyPath)){try{fs.writeFileSync(keyPath,randomBytes(32),{flag:'wx',mode:0o600});}catch(e){if(e.code!=='EEXIST')throw e;}}
 const key=fs.readFileSync(keyPath);if(key.length!==32)throw new Error('SMTP encryption key is invalid');return key;
}
function encrypt(text){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',encryptionKey(),iv);const data=Buffer.concat([cipher.update(text,'utf8'),cipher.final()]);return {iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:data.toString('base64')};}
function decrypt(value){if(!value)return '';const decipher=createDecipheriv('aes-256-gcm',encryptionKey(),Buffer.from(value.iv,'base64'));decipher.setAuthTag(Buffer.from(value.tag,'base64'));return Buffer.concat([decipher.update(Buffer.from(value.data,'base64')),decipher.final()]).toString('utf8');}
export function validRecipient(email){return typeof email==='string'&&email.length<=254&&/^[^\s@<>(),;"\r\n]+@[^\s@<>(),;"\r\n]+\.[^\s@<>(),;"\r\n]+$/.test(email);}
function loginLink(value){const url=new URL(value);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw new Error('Use a plain http or https login URL without credentials, query parameters or fragments');if(['localhost','127.0.0.1','[::1]','0.0.0.0'].includes(url.hostname))throw new Error('Use a login URL other laptops can reach, not localhost');if(process.env.NODE_ENV==='production'&&url.protocol!=='https:')throw new Error('Production login URL must use HTTPS');return url.href;}
export function accountMailConfig(){const stored=read();let password='',credentialError=false;try{password=process.env.SMTP_PASSWORD||decrypt(stored.passwordEncrypted);}catch{credentialError=true;}
 const config={host:process.env.SMTP_HOST||stored.host||'',port:Number(process.env.SMTP_PORT||stored.port||587),username:process.env.SMTP_USER||stored.username||ADMIN_EMAIL,password,relay:process.env.SMTP_RELAY==='true'||stored.relay===true,tlsMode:process.env.SMTP_TLS_MODE||stored.tlsMode||'starttls',loginUrl:process.env.APP_LOGIN_URL||stored.loginUrl||'',fromEmail:ADMIN_EMAIL,fromName:'Praveen Ambrose'};
 let reason='';if(process.env.MAIL_DELIVERY_DISABLED==='true')reason='Email delivery is disabled in this environment';else if(!config.host||!config.loginUrl)reason='Configure the company SMTP server and login URL';else if(!config.relay&&(!config.username||!password))reason=credentialError?'Re-enter the SMTP credential; its encryption key is unavailable':'Configure SMTP authentication or an approved company relay';else{try{config.loginUrl=loginLink(config.loginUrl);}catch(e){reason=e.message;}}
 return {...config,configured:!reason,reason};
}
export function publicMailSettings(){const c=accountMailConfig();const {password,...safe}=c;return {...safe,passwordConfigured:!!password};}
export function saveAccountMailSettings(input){
 const old=read();const host=String(input.host||'').trim();if(!host||host.length>253||/[\s/@:\\]/.test(host))throw new Error('Enter a valid SMTP hostname or IPv4 address');
 const port=Number(input.port);if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Enter a valid SMTP port');
 if(!['starttls','implicit'].includes(input.tlsMode))throw new Error('Choose STARTTLS or TLS encryption');
 const username=String(input.username||'').trim();if(/[\r\n]/.test(username))throw new Error('Invalid SMTP username');
 const relay=input.relay===true;const password=typeof input.password==='string'?input.password:'';
 const passwordEncrypted=password?encrypt(password):old.passwordEncrypted;
 if(!relay&&(!username||!passwordEncrypted&&!process.env.SMTP_PASSWORD))throw new Error('SMTP username and credential are required unless using an approved relay');
 const loginUrl=loginLink(input.loginUrl);saveSetting(setting,JSON.stringify({host,port,username,relay,tlsMode:input.tlsMode,loginUrl,passwordEncrypted}));addLog('CONFIG','Updated account welcome email configuration');return publicMailSettings();
}
function transport(c){return nodemailer.createTransport({host:c.host,port:c.port,secure:c.tlsMode==='implicit',requireTLS:c.tlsMode!=='implicit',auth:c.relay?undefined:{user:c.username,pass:c.password},connectionTimeout:8000,greetingTimeout:8000,socketTimeout:12000,dnsTimeout:8000,logger:false,debug:false,disableFileAccess:true,disableUrlAccess:true});}
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function welcomeMessage(user,password,c){const role=user.role==='manager'?'Manager':'Recruiter';return {from:{name:c.fromName,address:c.fromEmail},to:{name:user.name,address:user.email},subject:'Your SIFT account login details',text:`Hello ${user.name},\n\nYour ${role} account has been created.\n\nUsername: ${user.email}\nInitial password: ${password}\nLogin link: ${c.loginUrl}\n\nUse the login link above to sign in. Customer and cluster access is managed separately by Admin.\n\nPraveen Ambrose\nMotherson | SIFT`,html:`<p>Hello ${escape(user.name)},</p><p>Your <strong>${role}</strong> account has been created.</p><p><strong>Username:</strong> ${escape(user.email)}<br><strong>Initial password:</strong> <code>${escape(password)}</code><br><strong>Login:</strong> <a href="${escape(c.loginUrl)}">${escape(c.loginUrl)}</a></p><p>Customer and cluster access is managed separately by Admin.</p><p>Praveen Ambrose<br>Motherson | SIFT</p>`};}
function mailError(error){const code=['EAUTH','ETIMEDOUT','ECONNECTION','ESOCKET','EDNS','EENVELOPE','EMESSAGE','ETLS'].includes(error?.code)?error.code:'EMAIL_DELIVERY_FAILED';const message=code==='EAUTH'?'The mail server rejected authentication':code==='ETLS'?'The mail server did not establish a trusted TLS connection':code==='EENVELOPE'?'The mail server rejected the sender or recipient':'The mail server could not accept the email. Check the SMTP connection and sender permissions';return {code,message};}
export async function verifyAccountMail(){const c=accountMailConfig();if(!c.configured)return {ok:false,message:c.reason};try{await transport(c).verify();return {ok:true,message:'SMTP connection and authentication verified. Sending as Admin still requires permission on the mail server.'};}catch(e){return {ok:false,...mailError(e)};}}
export async function sendWelcomeEmail(user,password,{config=accountMailConfig(),createTransport=transport,audit=addLog}={}){
 if(!validRecipient(user.email))return {status:'failed',code:'EENVELOPE',message:'Account created. Welcome email was not sent: invalid recipient email address'};
 if(!['manager','recruiter'].includes(user.role))return {status:'not_applicable',message:'No staff welcome email required'};
 if(!config.configured)return {status:'not_configured',message:'Account created. Welcome email was not sent: '+config.reason};
 try{const info=await createTransport(config).sendMail(welcomeMessage(user,password,config));if(info.rejected?.length||!info.accepted?.length)throw Object.assign(new Error('Recipient rejected'),{code:'EENVELOPE'});audit('WELCOME_EMAIL',`Mail server accepted account welcome email for user ${user.id}`);return {status:'accepted',message:'Account created. The mail server accepted the welcome email for '+user.email,messageId:info.messageId||null};}
 catch(e){const failure=mailError(e);audit('WELCOME_EMAIL_FAILED',`Welcome email failed for user ${user.id}: ${failure.code}`);return {status:'failed',code:failure.code,message:'Account created. Welcome email was not sent: '+failure.message};}
}

