import { DatabaseSync, backup } from 'node:sqlite';
import { randomUUID, randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const backupDir=path.join(root,'scratch','workflow-backup-20261008');await fs.mkdir(backupDir,{recursive:true});
const backupPath=path.join(backupDir,'sift-pre-workflow.db');
try {await fs.access(backupPath);}catch{
  const original=new DatabaseSync(process.env.DB_PATH||path.join(root,'sift.db'),{readOnly:true});await backup(original,backupPath);original.close();
}
const {database:db,getUserByEmail,getUserById,syncToPersistentStorage}=await import('./db.js');
const {previewLocal,commitImport,records}=await import('./workflow.js');
const {hashPassword}=await import('./passwords.js');
const email='praveen.ambrose@motherson.com';let user=getUserByEmail(email);
if(!user){const id='user_praveen_ambrose';db.prepare('INSERT INTO users(id,name,email,password,role,created_by,created_at) VALUES(?,?,?,?,?,?,?)').run(id,'Praveen Ambrose',email,'activation_pending','super_admin','workflow_migration',new Date().toISOString());user=getUserByEmail(email);}
// Retain working demo credentials
const req={user:{id:user.id,role:'super_admin'}};const preview=await previewLocal(req);
const result=commitImport({...req,body:{token:preview.token}});syncToPersistentStorage(true);
const demands=records('demand'),applications=records('application');
console.log(JSON.stringify({result,demands:demands.length,applications:applications.length,unresolvedIssues:records('issue').filter(i=>!i.resolved).length,adminActivationRequired:user.password==='activation_pending',backup:backupPath},null,2));
db.close();
