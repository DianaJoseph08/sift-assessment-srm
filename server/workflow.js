import {createScreeningSynchronizer} from './screening-sync.js';
import {trackerTables} from './tracker-reporting.js';
import {TRACKER_REFERENCE} from '../shared/daily-tracker-schema.js';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash, randomBytes } from 'node:crypto';
import { database as db, getCompanies, getClusters, getUsers, getJobs, syncToPersistentStorage } from './db.js';
import { hashPassword } from './passwords.js';
import { parseWorkbooks } from './workbook-import.js';
import { STAGES, DEMAND_STATUSES, SOURCES, clean, key, sowKey, canonicalStage, category, isoDate, validDate, ageDays, indiaToday, nextTask, vacancyMetrics } from './workflow-rules.js';

db.exec(`CREATE TABLE IF NOT EXISTS workflow_records(kind TEXT NOT NULL,id TEXT NOT NULL,data TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,PRIMARY KEY(kind,id));
CREATE TABLE IF NOT EXISTS workflow_events(id TEXT PRIMARY KEY,entity_id TEXT NOT NULL,actor_id TEXT NOT NULL,occurred_at TEXT NOT NULL,action TEXT NOT NULL,before_data TEXT,after_data TEXT);
CREATE TABLE IF NOT EXISTS workflow_imports(id TEXT PRIMARY KEY,actor_id TEXT NOT NULL,created_at TEXT NOT NULL,summary TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS workflow_assignments(user_id TEXT NOT NULL,customer_id TEXT NOT NULL,cluster_id TEXT NOT NULL,PRIMARY KEY(user_id,customer_id,cluster_id));`);
if(!db.prepare("SELECT id FROM workflow_records WHERE kind='migration' AND id='access_scopes'").get()){
  db.prepare('INSERT OR IGNORE INTO workflow_assignments SELECT id,customer_id,cluster_id FROM users WHERE customer_id IS NOT NULL AND cluster_id IS NOT NULL').run();
  db.prepare("INSERT INTO workflow_records(kind,id,data) VALUES('migration','access_scopes','{}')").run();
}
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const uuid=prefix=>`${prefix}_${randomUUID()}`;
export function records(kind) { return db.prepare('SELECT * FROM workflow_records WHERE kind=?').all(kind).map(r=>({...JSON.parse(r.data),version:r.version})); }
function record(kind,id) { const r=db.prepare('SELECT * FROM workflow_records WHERE kind=? AND id=?').get(kind,id); return r?{...JSON.parse(r.data),version:r.version}:null; }
function write(kind,obj,actor,action='Updated') {
  const before=record(kind,obj.id); const {version,...data}=obj;
  db.prepare('INSERT INTO workflow_records(kind,id,data,version) VALUES(?,?,?,1) ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data,version=workflow_records.version+1').run(kind,obj.id,JSON.stringify(data));
  db.prepare('INSERT INTO workflow_events VALUES(?,?,?,?,?,?,?)').run(uuid('event'),obj.id,actor,new Date().toISOString(),action,before?JSON.stringify(before):null,JSON.stringify(data));
  return record(kind,obj.id);
}
function transaction(fn) { db.exec('BEGIN IMMEDIATE'); try { const result=fn(); db.exec('COMMIT'); syncToPersistentStorage(true); return result; } catch(e){db.exec('ROLLBACK');throw e;} }
export function scopes(user) {
  const list=db.prepare('SELECT customer_id,cluster_id FROM workflow_assignments WHERE user_id=?').all(user.id);
  return list;
}
export function canAccess(user,obj) {
  if(user.role==='super_admin')return true;
  return scopes(user).some(s=>s.customer_id===(obj.customerId||obj.companyId) && s.cluster_id===obj.clusterId);
}
function assertAccess(req,obj) { if(!obj)throw Object.assign(new Error('Record not found'),{status:404}); if(!canAccess(req.user,obj))throw Object.assign(new Error('Access denied for this customer/cluster'),{status:403}); }
function admin(req) { if(req.user.role!=='super_admin')throw Object.assign(new Error('Super Admin access required'),{status:403}); }
function manager(req) { if(req.user.role!=='manager')throw Object.assign(new Error('Manager access required'),{status:403}); }
function conflict(old,version) { if(old && version!==old.version)throw Object.assign(new Error('This record changed. Refresh before saving.'),{status:409}); }
function config() { return record('config','workflow') || {id:'workflow',feedbackDays:2,escalationDays:5,doableRate:null}; }
function stages() {return [...new Set([...STAGES,...records('dictionary').filter(d=>d.kind==='stage').map(d=>canonicalStage(d.label))])];}
function sources() {return [...new Set([...SOURCES,...records('dictionary').filter(d=>d.kind==='source').map(d=>d.label)])];}
const clusterAlias=s=>key(s)==='ms it'?'IT':clean(s);
function resolveMaster(client,cluster) {
  const company=getCompanies().find(c=>key(c.name)===key(client));
  const cl=company && getClusters(company.id).find(c=>key(c.name)===key(clusterAlias(cluster)));
  return {customerId:company?.id||null,clusterId:cl?.id||null,client:company?.name||client,cluster:cl?.name||cluster};
}
function requireScopeFields(data) {
  const c=getCompanies().find(c=>c.id===data.customerId); const cl=getClusters(data.customerId).find(c=>c.id===data.clusterId);
  if(!c||!cl)throw new Error('Choose a valid customer and its cluster');
  data.client=c.name;data.cluster=cl.name;
}
function demandView(d,apps) { return {...d,...vacancyMetrics(d,apps),missingJD:!d.description}; }
function tasks(apps,demands) {
  const cfg=config(),today=indiaToday(),users=getUsers(); const out=[];
  for(const a of apps) {
    const t=nextTask(a,cfg);if(!t)continue;
    const overdue=t.due?Math.max(0,ageDays(t.due,today)):0;
    out.push({id:`task_${a.id}`,applicationId:a.id,name:a.name,client:a.client,cluster:a.cluster,sowId:a.sowId,owner:users.find(u=>u.id===a.recruiterId)?.name||a.recruiter||'Unassigned',...t,overdue,escalated:overdue>=cfg.escalationDays});
  }
  for(const d of demands)if(d.status==='Active' && d.deadline && d.active>0)out.push({id:`deadline_${d.id}`,demandId:d.id,name:d.title,client:d.client,cluster:d.cluster,sowId:d.sowId,owner:d.mtslSpoc||'Unassigned',action:'Fill demand before deadline',due:d.deadline,overdue:Math.max(0,ageDays(d.deadline,today)),escalated:ageDays(d.deadline,today)>=cfg.escalationDays});
  return out.sort((a,b)=>b.overdue-a.overdue || (a.due||'9999').localeCompare(b.due||'9999'));
}
function stampDates(a,old) {
  if(a.stage==='Joined'&&!a.actualJoining)throw new Error('Actual joining date is required before marking Joined');
  if(a.stage===old?.stage)return;
  a.stageChangedAt=new Date().toISOString(); const today=indiaToday();a.stageChangedDate=today;
  if(a.stage==='Internal Feedback Pending')a.internalSubmissionDate ||= today;
  if(a.stage==='Customer Feedback Pending'){a.internalFeedbackDate ||= today;a.customerSubmissionDate ||=today;}
  if(['Customer Select','To be offered','Offered'].includes(a.stage))a.selectionDate ||=today;
  if(a.stage==='Customer Select')a.customerFeedbackDate ||=today;
  if(a.stage==='Offered')a.offerDate ||=today;
  if(a.stage==='Joined'&&!a.actualJoining)throw new Error('Actual joining date is required before marking Joined');
}
function validateDates(data,fields) {
  for(const field of fields)if(data[field] && !validDate(data[field]))throw new Error(`Invalid date: ${field}`);
}
function allocate(a,old,actor) {
  if(old && !old.counted && old.demandId===a.demandId && old.stage===a.stage){a.counted=false;return;}
  if(old?.counted && (old.demandId!==a.demandId || category(old.stage)!==category(a.stage)))a.counted=false;
  if(!category(a.stage)){a.counted=false;return;}
  if(old?.counted && old.demandId===a.demandId && category(old.stage)===category(a.stage)){a.counted=true;return;}
  const d=record('demand',a.demandId); if(!d)throw new Error('Link a demand before allocating an offer or joining');
  const apps=records('application').filter(x=>x.id!==a.id); const available=vacancyMetrics(d,apps).active;
  if(available<1)throw new Error('No active vacancy remains. Reconcile demand allocations before offering/joining.');
  a.counted=true;
}
const demandFields=['sowId','customerId','clusterId','openDate','status','title','combinationSkills','description','clientHead','clientManager','clientSpoc','mtslSpoc','grade','experience','positionType','replacementName','lwd','vacancies','location','baseline','profileStatus','budget','actualGM','source','industry','reason','holdDate','deadline','remarks','targetCompanies','challenges','rmId','candidateNames','mtslDoj','doable'];
const applicationFields=['name','email','phone','demandId','customerId','clusterId','clientManager','sowId','skill','recruiter','recruiterId','source','stage','internalSubmissionDate','internalFeedbackDate','customerSubmissionDate','customerFeedbackDate','interviewDate','actualJoining','expectedJoining','experience','relevantExperience','noticePeriod','currentCompany','currentLocation','preferredLocation','qualification','currentCTC','expectedCTC','employmentType','grade','selectionDate','offerDate','department','tagLead','pmo','remarks','reason','extraFields'];
function select(data,fields) { return Object.fromEntries(fields.filter(k=>k in data).map(k=>[k,data[k]])); }
const pending=new Map();
export const workflowRouter=express.Router();
const route=(method,url,fn)=>workflowRouter[method](url,async(req,res)=>{try{res.json(await fn(req,res));}catch(e){res.status(e.status||400).json({error:e.message});}});
export function workflowState(user){
  const apps=records('application').filter(a=>canAccess(user,a));const demands=records('demand').filter(d=>canAccess(user,d)).map(d=>demandView(d,apps));
  const visibleCompanies=getCompanies().filter(c=>user.role==='super_admin'||scopes(user).some(s=>s.customer_id===c.id));
  const users=getUsers().map(u=>({...u,assignments:scopes(u).map(s=>({customerId:s.customer_id,clusterId:s.cluster_id}))})).filter(u=>user.role==='super_admin'||u.id===user.id||u.assignments.some(a=>canAccess(user,a)));
  const unassignedScreeningJobs=user.role==='super_admin'?getJobs().filter(j=>!getCompanies().some(c=>c.id===j.companyId)||!getClusters(j.companyId).some(c=>c.id===j.clusterId)).map(j=>({id:j.id,title:j.title,jobReference:jobReference(j.id)})):[];
  return {unassignedScreeningJobs,tracker:trackerTables({demands,applications:apps,config:config()}),trackerReference:user.role==='super_admin'?TRACKER_REFERENCE:null,demands,applications:apps,tasks:tasks(apps,demands),companies:visibleCompanies,clusters:getClusters().filter(c=>user.role==='super_admin'||scopes(user).some(s=>s.cluster_id===c.id)),users,sourceControls:user.role==='super_admin'?records('sourceControl'):[],dictionaries:records('dictionary'),rmDirectory:records('rm'),stages:stages(),demandStatuses:DEMAND_STATUSES,sources:sources(),config:config(),issues:records('issue').filter(i=>user.role==='super_admin'||apps.some(a=>a.id===i.recordId)||demands.some(d=>d.id===i.recordId)),imports:user.role==='super_admin'?db.prepare('SELECT * FROM workflow_imports ORDER BY created_at DESC LIMIT 10').all().map(i=>({...i,summary:JSON.parse(i.summary)})):[],assignments:user.role==='super_admin'?db.prepare('SELECT * FROM workflow_assignments').all():scopes(user),asOf:indiaToday()};
}
route('get','/state',req=>workflowState(req.user));
route('get','/tracker',req=>({...trackerTables(workflowState(req.user)),reference:req.user.role==='super_admin'?TRACKER_REFERENCE:null}));

route('post','/demands',req=>transaction(()=>{
  manager(req);const input=req.body;const old=input.id?record('demand',input.id):null;if(input.id&&!old)throw new Error('Demand not found');if(old){assertAccess(req,old);conflict(old,input.version);}
  const d={...old,...select(input,demandFields),id:old?.id||uuid('demand')};requireScopeFields(d);assertAccess(req,d);
  if(!clean(d.sowId)||!clean(d.title))throw new Error('SOW ID and skills/title are required');
  if(!DEMAND_STATUSES.includes(d.status))throw new Error('Invalid demand status');
  if(!Number.isInteger(Number(d.vacancies))||Number(d.vacancies)<0)throw new Error('Vacancies must be a nonnegative whole number');d.vacancies=Number(d.vacancies);
  if(records('demand').some(x=>x.id!==d.id&&x.customerId===d.customerId&&sowKey(x.sowId)===sowKey(d.sowId)))throw new Error('This SOW ID already exists for this customer');
  validateDates(d,['openDate','lwd','deadline','holdDate','mtslDoj']);
  if(!d.openDate)throw new Error('Position open date is required');if(ageDays(d.openDate)<0)throw new Error('Open date cannot be in the future');
  d.baseline ||= {joined:0,offered:0,hold:0,nonDoable:0}; if(typeof d.baseline!=='object'||Array.isArray(d.baseline)||Object.keys(d.baseline).some(k=>!['joined','offered','hold','nonDoable'].includes(k)))throw new Error('Invalid allocation counts'); for(const k of ['joined','offered','hold','nonDoable'])if(!Number.isInteger(Number(d.baseline[k]))||Number(d.baseline[k])<0)throw new Error('Allocation counts must be nonnegative integers');
  d.baseline=Object.fromEntries(['joined','offered','hold','nonDoable'].map(k=>[k,Number(d.baseline[k])]));
  if(old && (old.customerId!==d.customerId||old.clusterId!==d.clusterId) && (old.jobId||records('application').some(a=>a.demandId===d.id)))throw new Error('A linked demand cannot move between customer or cluster scopes');
  if(vacancyMetrics(d,records('application')).active<0)throw new Error('Allocations exceed total vacancies');
  return write('demand',d,req.user.id,old?'Demand updated':'Demand created');
}));
route('post','/applications',req=>transaction(()=>{
  if(req.user.role!=='recruiter')throw Object.assign(new Error('Only recruiters can update candidate details and progress. Admin and managers have monitoring access.'),{status:403});
  const input=req.body,old=input.id?record('application',input.id):null;
  if(input.id&&!old)throw new Error('Application not found');if(old){assertAccess(req,old);conflict(old,input.version);}
  const a={...old,...select(input,applicationFields),id:old?.id||uuid('application'),personId:old?.personId||uuid('person')};
  if(req.user.role==='recruiter' && ((old?.recruiterId && old.recruiterId!==req.user.id)||(!old?.recruiterId && old?.recruiter && key(old.recruiter)!==key(req.user.name))))throw Object.assign(new Error('Only the assigned recruiter or manager can edit this application'),{status:403});
  if(req.user.role==='recruiter'){a.recruiterId=req.user.id;a.recruiter=req.user.name;}
  if(a.demandId){const d=record('demand',a.demandId);assertAccess(req,d);Object.assign(a,{customerId:d.customerId,clusterId:d.clusterId,client:d.client,cluster:d.cluster,sowId:d.sowId,skill:d.title});}else requireScopeFields(a);
  if(!old){const d=record('demand',a.demandId),job=d?.jobId&&getJobs().find(j=>j.id===d.jobId);if(!job||job.status!=='posted')throw new Error('Select a manager-posted job before adding a candidate');}
  assertAccess(req,a);if(!clean(a.name))throw new Error('Candidate name is required');if(!stages().includes(a.stage))throw new Error('Choose a valid candidate stage');
  if(a.recruiterId){const u=getUsers().find(x=>x.id===a.recruiterId);if(!u||u.role!=='recruiter'||!canAccess(u,a))throw new Error('Recruiter must have access to this customer/cluster');a.recruiter=u.name;}
  if(a.extraFields){if(typeof a.extraFields!=='object'||Array.isArray(a.extraFields)||Object.keys(a.extraFields).some(k=>!/^extra(?:[3-9]|10)$/.test(k)))throw new Error('Invalid additional source columns');for(const value of Object.values(a.extraFields))if(typeof value!=='string'||value.length>4000)throw new Error('Additional columns must be text up to 4000 characters');}
  validateDates(a,['internalSubmissionDate','internalFeedbackDate','customerSubmissionDate','customerFeedbackDate','interviewDate','actualJoining','expectedJoining','selectionDate','offerDate']);
  if(a.actualJoining&&ageDays(a.actualJoining)<0)throw new Error('Actual joining cannot be in the future');
  if((a.stage.includes('Reject')||['Candidate Drop','Position Hold','Profile Hold','Position Closed'].includes(a.stage))&&a.stage!==old?.stage&&!clean(a.reason))throw new Error('A reason is required for rejection, hold, drop, or closure');
  if(a.email && records('application').some(x=>x.id!==a.id&&key(x.email)===key(a.email)&&x.demandId===a.demandId))throw new Error('This candidate email already has an application for this demand');
  stampDates(a,old);allocate(a,old,req.user.id);
  write('person',{...record('person',a.personId),id:a.personId,name:a.name,email:a.email||'',phone:a.phone||''},req.user.id,'Candidate details updated');
  const saved=write('application',a,req.user.id,old?.stage!==a.stage?`Stage: ${a.stage}`:'Application updated');
  if(a.demandId){const d=record('demand',a.demandId);const v=vacancyMetrics(d,records('application'));if(v.joined===v.total&&v.total>0&&d.status==='Active')write('demand',{...d,status:'Closed',autoClosed:true,closedAt:new Date().toISOString()},req.user.id,'All vacancies joined');else if(d.autoClosed&&v.active>0)write('demand',{...d,status:'Active',autoClosed:false,closedAt:null},req.user.id,'Vacancy reopened');}
  return saved;
}));
route('post','/config',req=>transaction(()=>{admin(req);const c={...config(),...select(req.body,['feedbackDays','escalationDays','doableRate'])};conflict(record('config','workflow'),req.body.version);for(const k of ['feedbackDays','escalationDays'])if(!Number.isInteger(Number(c[k]))||Number(c[k])<1)throw new Error('Reminder days must be positive whole numbers');if(c.doableRate!==null&&(!Number.isFinite(Number(c.doableRate))||Number(c.doableRate)<0||Number(c.doableRate)>1))throw new Error('Doable rate must be between 0 and 1, or unset');return write('config',c,req.user.id,'Automation rules updated');}));
route('get','/history/:id',req=>{
  const obj=record('application',req.params.id)||record('demand',req.params.id);assertAccess(req,obj);
  return db.prepare('SELECT id,actor_id,occurred_at,action FROM workflow_events WHERE entity_id=? ORDER BY occurred_at DESC').all(obj.id);
});
route('post','/assignments',req=>transaction(()=>{admin(req);const {userId,customerId,clusterId,remove}=req.body;const u=getUsers().find(u=>u.id===userId);if(!u||!['manager','recruiter'].includes(u.role))throw new Error('Choose a manager or recruiter');requireScopeFields({customerId,clusterId});if(remove)db.prepare('DELETE FROM workflow_assignments WHERE user_id=? AND customer_id=? AND cluster_id=?').run(userId,customerId,clusterId);else db.prepare('INSERT OR IGNORE INTO workflow_assignments VALUES(?,?,?)').run(userId,customerId,clusterId);write('assignment',{id:`${userId}_${customerId}_${clusterId}`,userId,customerId,clusterId,removed:!!remove},req.user.id,remove?'Access removed':'Access granted');return {ok:true};}));
route('post','/issues/:id/resolve',req=>transaction(()=>{admin(req);const i=record('issue',req.params.id);if(!i)throw new Error('Issue not found');return write('issue',{...i,resolved:true,resolution:clean(req.body.resolution)||'Reviewed'},req.user.id,'Import issue reviewed');}));
route('post','/dictionaries',req=>transaction(()=>{admin(req);const {kind,label}=req.body;if(!['stage','source','clientManager','clientSpoc','clientHead'].includes(kind)||!clean(label))throw new Error('Choose a list and enter a label');if(records('dictionary').some(d=>d.kind===kind&&key(d.label)===key(label)))throw new Error('This option already exists');return write('dictionary',{id:uuid('option'),kind,label:clean(label)},req.user.id,'Dropdown option added');}));
route('post','/users/:id/password',req=>transaction(()=>{admin(req);const user=getUsers().find(u=>u.id===req.params.id);if(!user)throw new Error('User not found');db.prepare('UPDATE users SET password=? WHERE id=?').run(hashPassword(req.body.password),user.id);db.prepare('DELETE FROM auth_sessions WHERE user_id=?').run(user.id);write('credentialChange',{id:uuid('credential'),userId:user.id},req.user.id,'Staff password changed');return {ok:true};}));
function linkReservations(actor) {
  for(const a of records('application')){
    const cat=category(a.stage),d=record('demand',a.demandId); if(!cat||!d||a.counted)continue;
    if(Number(d.baseline?.[cat]||0)>0){d.baseline[cat]--;write('demand',d,actor,'Historical allocation linked');write('application',{...a,counted:true},actor,'Historical allocation linked');}
    else write('issue',{id:`allocation_${a.id}`,recordId:a.id,...a.provenance,message:'Historical offer/joining is not allocated to a vacancy; reconcile demand before further allocation'},actor,'Import exception');
  }
}
async function preview(req,files) {
  admin(req);const parsed=await parseWorkbooks(files);const token=randomBytes(24).toString('hex');
  if(!parsed.customers.length&&!parsed.rms.length&&!parsed.demands.length&&!parsed.applications.length&&!parsed.offers.length)throw new Error('No recognized recruitment data found. Use the supplied workbook layouts.');
  for(const source of [...parsed.demands,...parsed.applications]){
    const existing=record(source.name?'application':'demand',source.id);
    if(existing?.raw && JSON.stringify(existing.raw)!==JSON.stringify(source.raw))parsed.issues.push({...source.provenance,recordId:source.id,message:'Source row changed since import; existing app record will be preserved for manual reconciliation',raw:source.raw});
  }
  const fingerprint=createHash('sha256');for(const f of files)fingerprint.update(f.name).update(f.buffer);const digest=fingerprint.digest('hex');
  pending.set(token,{actor:req.user.id,expires:Date.now()+30*60000,parsed,digest});
  for(const [k,v] of pending)if(v.expires<Date.now())pending.delete(k);
  return {token,customers:parsed.customers,rms:parsed.rms,demands:parsed.demands.length,applications:parsed.applications.length,offers:parsed.offers.length,sheets:parsed.sheets,controls:parsed.controls,issues:parsed.issues,sampleDemands:parsed.demands.slice(0,5).map(({raw,...d})=>d),alreadyImported:!!db.prepare('SELECT id FROM workflow_imports WHERE id=?').get(digest)};
}
export async function previewLocal(req) {
  admin(req);const files=[];for(const name of ['customers and clusters and rms.xlsx','Daily Tracker _ SAP Backup.xlsx'])files.push({name,buffer:await fs.readFile(path.join(root,name))});return preview(req,files);
}
route('post','/import/local/preview',previewLocal);
route('post','/import/preview',async req=>{
  admin(req);if(!Array.isArray(req.body.files)||req.body.files.length<1||req.body.files.length>2)throw new Error('Upload one or both workbooks');
  const files=req.body.files.map(f=>{if(!f.name?.endsWith('.xlsx')||typeof f.base64!=='string')throw new Error('Only .xlsx workbooks are accepted');const buffer=Buffer.from(f.base64,'base64');if(buffer.length>12*1024*1024)throw new Error('Workbook must be smaller than 12 MB');return {name:path.basename(f.name),buffer};});return preview(req,files);
});
export function commitImport(req) { return transaction(()=>{
  admin(req);const batch=pending.get(req.body.token);if(!batch||batch.actor!==req.user.id||batch.expires<Date.now())throw new Error('Import preview expired; preview again');
  if(db.prepare('SELECT id FROM workflow_imports WHERE id=?').get(batch.digest))return {ok:true,alreadyImported:true};
  const {parsed}=batch;const summary={customers:0,rms:0,demands:0,applications:0,offers:0,skipped:0,issues:parsed.issues.length};
  const customers=[...new Set([...parsed.customers,...parsed.demands.map(d=>d.client),...parsed.applications.map(a=>a.client),...parsed.offers.map(a=>a.client)].filter(Boolean))];
  for(const name of customers){if(!getCompanies().some(c=>key(c.name)===key(name))){db.prepare('INSERT INTO companies(id,name,industry,contact_email,sender_name,notes,created_at) VALUES(?,?,?,?,?,?,?)').run(uuid('comp'),name,'','','','Imported from recruitment workbook',new Date().toISOString());summary.customers++;}}
  for(const item of [...parsed.demands,...parsed.applications,...parsed.offers]){const c=getCompanies().find(c=>key(c.name)===key(item.client));const name=clusterAlias(item.cluster);if(c&&name&&!getClusters(c.id).some(cl=>key(cl.name)===key(name)))db.prepare('INSERT INTO clusters(id,customer_id,name,description,created_at) VALUES(?,?,?,?,?)').run(uuid('cluster'),c.id,name,'Imported cluster',new Date().toISOString());}
  for(const rm of parsed.rms){const id=`rm_${createHash('sha256').update(rm.email+'|'+rm.cluster).digest('hex').slice(0,16)}`;if(!record('rm',id)){write('rm',{id,...rm},req.user.id,'RM directory imported');summary.rms++;}
    if(!getUsers().some(u=>key(u.email)===rm.email))db.prepare('INSERT INTO users(id,name,email,password,role,created_at) VALUES(?,?,?,?,?,?)').run(uuid('user'),rm.name,rm.email,hashPassword(randomBytes(32).toString('hex')),'manager',new Date().toISOString());}
  for(const d of parsed.demands){if(record('demand',d.id)){summary.skipped++;continue;}const master=resolveMaster(d.client,d.cluster);const duplicates=records('demand').filter(x=>x.customerId===master.customerId&&sowKey(x.sowId)===sowKey(d.sowId));if(duplicates.length)parsed.issues.push({...d.provenance,recordId:d.id,message:'Duplicate SOW identifier; retained separately for reconciliation'});write('demand',{...d,...master},req.user.id,'Workbook demand imported');summary.demands++;}
  for(const a of parsed.applications){if(record('application',a.id)){summary.skipped++;continue;}const master=resolveMaster(a.client,a.cluster);const matches=records('demand').filter(d=>key(d.client)===key(a.client)&&sowKey(d.sowId)===sowKey(a.sowId));a.demandId=matches.length===1?matches[0].id:null;write('person',{id:a.personId,name:a.name,provenance:a.provenance},req.user.id,'Workbook candidate imported');write('application',{...a,...master,counted:false},req.user.id,'Workbook application imported');summary.applications++;}
  for(const o of parsed.offers){const matches=records('application').filter(a=>key(a.name)===key(o.name)&&key(a.client)===key(o.client)&&sowKey(a.sowId)===sowKey(o.sowId));const id=matches.length===1?matches[0].id:o.id;const existing=record('application',id);if(existing?.offerProvenance || (existing&&id===o.id)){summary.skipped++;continue;}
    const master=resolveMaster(o.client,o.cluster);const demandMatches=records('demand').filter(d=>key(d.client)===key(o.client)&&sowKey(d.sowId)===sowKey(o.sowId));const a={...existing,...o,...master,id,demandId:demandMatches.length===1?demandMatches[0].id:null,personId:existing?.personId||o.personId,provenance:existing?.provenance||o.provenance,raw:existing?.raw||o.raw,offerRaw:o.raw,offerProvenance:o.provenance,counted:existing?.counted||false};if(matches.length>1)parsed.issues.push({...o.provenance,recordId:id,message:'Ambiguous candidate match; offer retained separately'});if(!existing)write('person',{id:a.personId,name:a.name,provenance:o.provenance},req.user.id,'Offer candidate imported');write('application',a,req.user.id,'Workbook offer imported');summary.offers++;}
  for(const i of parsed.issues){const id=`issue_${createHash('sha256').update(JSON.stringify(i)).digest('hex').slice(0,20)}`;if(!record('issue',id))write('issue',{id,...i,resolved:false},req.user.id,'Import exception');}
  for(const control of parsed.controls){const importedIds=new Set(parsed.demands.map(d=>d.id));const linked=records('demand').filter(d=>importedIds.has(d.id)).reduce((t,d)=>{const v=vacancyMetrics(d,records('application'));for(const k of ['total','active','joined','offered','hold','nonDoable'])t[k]+=v[k];return t;},{total:0,active:0,joined:0,offered:0,hold:0,nonDoable:0});write('sourceControl',{id:`control_${batch.digest}`, ...control,linkedTotals:linked},req.user.id,'Workbook totals retained');}
  for(const option of parsed.dictionaries){const id=`option_${createHash('sha256').update(option.kind+'|'+key(option.label)).digest('hex').slice(0,20)}`;if(!record('dictionary',id))write('dictionary',{id,...option},req.user.id,'Dropdown directory imported');}
  linkReservations(req.user.id);summary.issues=records('issue').filter(i=>!i.resolved).length;
  db.prepare('INSERT INTO workflow_imports VALUES(?,?,?,?)').run(batch.digest,req.user.id,new Date().toISOString(),JSON.stringify(summary));pending.delete(req.body.token);return {ok:true,summary};
}); }
route('post','/import/commit',commitImport);
route('post','/demands/:id/screening-job',req=>transaction(()=>{
  manager(req);const d=record('demand',req.params.id);assertAccess(req,d);
  if(d.jobId&&getJobs().some(j=>j.id===d.jobId))return {jobId:d.jobId};
  const jobId=uuid('job');db.prepare('INSERT INTO jobs(id,company_id,company_name,cluster_id,client_manager_name,status,posted_at,title,location,description,mustHave,niceToHave,screening) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').run(jobId,d.customerId,d.client,d.clusterId,d.clientManager||'','posted',new Date().toISOString(),d.title,d.location||'',d.description||d.remarks||d.title,JSON.stringify((d.combinationSkills||d.title).split(/[,;\n]/).map(clean).filter(Boolean)), '[]','idle');write('demand',{...d,jobId},req.user.id,'Screening job linked');return {jobId};
}));
route('post','/screened-candidates',req=>transaction(()=>{
  if(req.user.role!=='recruiter')throw Object.assign(new Error('Recruiter access required'),{status:403});
  const {demandId,candidateId}=req.body;const d=record('demand',demandId);assertAccess(req,d);const j=getJobs().find(j=>j.id===d.jobId);const c=j?.candidates.find(c=>c.id===candidateId);if(!c)throw new Error('Candidate must belong to this demand’s screening job');
  const id=`screened_${candidateId}`;if(record('application',id))return record('application',id);const a={id,personId:uuid('person'),name:c.result?.candidateName||c.label,client:d.client,cluster:d.cluster,customerId:d.customerId,clusterId:d.clusterId,demandId:d.id,sowId:d.sowId,skill:d.title,stage:'Internal Feedback Pending',internalSubmissionDate:indiaToday(),stageChangedAt:new Date().toISOString(),recruiterId:req.user.id,recruiter:req.user.name,screeningCandidateId:candidateId,counted:false};write('person',{id:a.personId,name:a.name},req.user.id,'Screened candidate linked');return write('application',a,req.user.id,'Screening linked to pipeline');
}));

const screeningSync=createScreeningSynchronizer({db,getJobs,record,records,write,transaction,canAccess,getCompanies,getClusters});
export const synchronizeScreeningWorkflow=screeningSync.sync;
export const jobReference=screeningSync.reference;

route('post','/sync-screening',req=>{admin(req);return synchronizeScreeningWorkflow(req.user);});


route('post','/applications/:id/recruiter',req=>transaction(()=>{
 manager(req);const a=record('application',req.params.id);assertAccess(req,a);conflict(a,req.body.version);
 const user=getUsers().find(u=>u.id===req.body.recruiterId&&u.role==='recruiter');if(!user||!canAccess(user,a))throw new Error('Choose a recruiter assigned to this customer and cluster');
 return write('application',{...a,recruiterId:user.id,recruiter:user.name},req.user.id,'Recruiter responsibility assigned');
}));
