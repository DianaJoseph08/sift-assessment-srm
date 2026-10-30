import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {DatabaseSync,backup} from 'node:sqlite';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
await fs.mkdir(new URL('../scratch/release-test/',import.meta.url),{recursive:true});
const dbPath=new URL(`../scratch/release-test/production-${Date.now()}.db`,import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1');
const source=new DatabaseSync(root+'/sift.db',{readOnly:true});
assert.equal(source.prepare('PRAGMA quick_check').get().quick_check,'ok');await backup(source,dbPath);source.close();
const child=spawn(process.execPath,['server/index.js'],{cwd:root,env:{...process.env,DB_PATH:dbPath,PORT:'8791',NODE_ENV:'production',DATA_DIR:''},windowsHide:true,stdio:['ignore','pipe','pipe']});
let logs='';child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);
const base='http://127.0.0.1:8791';
try{
 for(let i=0;i<100;i++){try{await fetch(base+'/api/version');break;}catch{}await new Promise(r=>setTimeout(r,100));}
 assert.equal((await fetch(base+'/')).status,200);
 assert.equal((await (await fetch(base+'/api/auth/setup-status')).json()).available,false);
 assert.ok([403,409].includes((await fetch(base+'/api/auth/setup-admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'Praveen.Ambrose@motherson.com',password:'Test-only-password-2026'})})).status));
 const protectedPaths=['/api/workflow/state','/api/jobs','/api/users','/api/logs','/api/settings','/api/candidate-interview-info?candidateId=fake'];
 for(const p of protectedPaths)assert.equal((await fetch(base+p)).status,401,p);
 const start=Date.now();const results=await Promise.all(Array.from({length:100},()=>fetch(base+'/healthz')));assert.ok(results.every(r=>r.status===200));
 const check=new DatabaseSync(dbPath,{readOnly:true});assert.equal(check.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.equal(check.prepare('SELECT COUNT(*) n FROM workflow_records WHERE kind=?').get('demand').n,91);check.close();
 console.log(JSON.stringify({result:'PASS',productionBootstrap:'disabled',unauthenticatedRoutes:'denied',databaseIntegrity:'ok',backupRestore:'91 demands preserved',healthRequests:100,elapsedMs:Date.now()-start}));
}catch(e){console.error(logs);throw e;}finally{child.kill();}
