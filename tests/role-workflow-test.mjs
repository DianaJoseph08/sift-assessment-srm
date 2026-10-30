import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const testPort=process.env.ROLE_TEST_PORT||'8793';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const dir=path.join(root,'scratch/release-test');await fs.mkdir(dir,{recursive:true});const dbPath=path.join(dir,`role-flow-${Date.now()}-${randomUUID()}.db`);
const child=spawn(process.execPath,['server/index.js'],{cwd:root,env:{...process.env,DB_PATH:dbPath,PORT:testPort,NODE_ENV:'development',DATA_DIR:'',MAIL_DELIVERY_DISABLED:'true'},windowsHide:true,stdio:['ignore','pipe','pipe']});let logs='';child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);
async function api(url,body,cookie=''){const r=await fetch('http://127.0.0.1:'+testPort+'/api'+url,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
const ok=r=>{assert.equal(r.status,200,JSON.stringify(r.data));return r.data;};
try{
 let ready=false;for(let i=0;i<300;i++){try{if((await fetch('http://127.0.0.1:'+testPort+'/api/version')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}assert.ok(ready,logs);
 const admin=(await api('/auth/setup-admin',{email:'Praveen.Ambrose@motherson.com',password:'Role-test-only-2026'})).cookie;
 let state=ok(await api('/workflow/state',undefined,admin));const cluster=state.clusters[0],company=state.companies.find(c=>c.id===cluster.customerId);
 const preview=ok(await api('/workflow/import/local/preview',{},admin));assert.equal(preview.demands,91);const imported=ok(await api('/workflow/import/commit',{token:preview.token},admin));assert.equal(imported.summary.applications,224);assert.equal(imported.summary.offers,27);
 const makeUser=async(role,email)=>ok(await api('/users',{name:`Test ${role}`,email,password:'Role-test-only-2026',role,customerId:company.id,clusterId:cluster.id},admin)).user;
 const managerUser=await makeUser('manager','role-manager@example.test'),recruiterUser=await makeUser('recruiter','role-recruiter@example.test');
 const login=async email=>(await api('/auth/login',{email,password:'Role-test-only-2026'})).cookie;
 const manager=await login(managerUser.email),recruiter=await login(recruiterUser.email);
 assert.equal((await api('/mail/settings',undefined,manager)).status,403);assert.equal((await api('/mail/settings',undefined,recruiter)).status,403);
 const mailSettings=ok(await api('/mail/settings',undefined,admin));assert.equal(mailSettings.password,undefined);assert.equal(mailSettings.configured,false);
 assert.equal((await api('/users/'+managerUser.id+'/welcome-email',{password:'Reset-test-only-2026'},recruiter)).status,403);
 let job={id:'role_job',companyId:company.id,companyName:company.name,clusterId:cluster.id,title:'Embedded Software Engineer',description:'Embedded C++ role',status:'draft',candidates:[],mustHave:['C++'],niceToHave:[]};
 assert.equal((await api('/save-jobs',{jobs:[job]},admin)).status,403);assert.equal((await api('/save-jobs',{jobs:[job]},recruiter)).status,403);
 ok(await api('/save-jobs',{jobs:[job]},manager));assert.equal(ok(await api('/jobs',undefined,recruiter)).length,0);
 assert.equal((await api('/jobs/role_job/status',{status:'posted'},admin)).status,403);assert.equal((await api('/jobs/role_job/status',{status:'posted'},recruiter)).status,403);
 ok(await api('/jobs/role_job/status',{status:'posted'},manager));job=ok(await api('/jobs',undefined,recruiter)).find(j=>j.id==='role_job');assert.ok(job.jobReference);assert.equal(job.status,'posted');
 const reference=job.jobReference;
 assert.equal((await api('/save-jobs',{jobs:[{...job,description:'Forged JD'}]},recruiter)).status,403);
 assert.equal((await api('/save-jobs',{jobs:[{...job,mustHave:['Forged criteria']}]},recruiter)).status,403);
 assert.equal((await api('/save-jobs',{jobs:[{...job,candidates:[{id:'bad',status:'done',result:{overallScore:100}}]}]},manager)).status,403);
 state=ok(await api('/workflow/state',undefined,admin));assert.equal(state.sourceControls[0].total,163);assert.equal(state.sourceControls[0].joined,8);assert.equal(state.sourceControls[0].linkedTotals.joined,7);
 const noAI=['/analyze','/candidate-compare','/interview/chat','/interview/video-evaluate','/interview/evaluate','/send-interview-email'];
 for(const role of [admin,manager])for(const route of noAI)assert.equal((await api(route,{job,candidateId:'cv1'},role)).status,403,route);
 job.candidates=[{id:'cv1',kind:'text',label:'Uploaded CV',text:'Test CV',status:'queued',result:null,error:null}];let saved=ok(await api('/save-jobs',{jobs:[job]},recruiter));assert.ok(saved.interviewTokens.cv1);const token=saved.interviewTokens.cv1;
 state=ok(await api('/workflow/state',undefined,recruiter));let a=state.applications.find(a=>a.screeningCandidateId==='cv1');assert.equal(a.stage,'Sourced');assert.equal(a.recruiterId,recruiterUser.id);assert.equal(a.jobReference,reference);
 assert.equal((await api('/workflow/applications',{...a,stage:'Joined',actualJoining:state.asOf},admin)).status,403);assert.equal((await api('/workflow/applications',{...a,stage:'Joined',actualJoining:state.asOf},manager)).status,403);
 assert.equal((await api('/workflow/applications/'+a.id+'/recruiter',{recruiterId:recruiterUser.id,version:a.version},admin)).status,403);
 assert.equal((await api('/workflow/applications/'+a.id+'/recruiter',{recruiterId:recruiterUser.id,version:a.version},recruiter)).status,403);
 a=ok(await api('/workflow/applications/'+a.id+'/recruiter',{recruiterId:recruiterUser.id,version:a.version},manager));assert.equal(a.recruiterId,recruiterUser.id);
 const demand=state.demands.find(d=>d.id===a.demandId);assert.equal((await api('/workflow/demands',{...demand,title:'Admin JD'},admin)).status,403);assert.equal((await api('/workflow/demands',{...demand,title:'Recruiter JD'},recruiter)).status,403);
 assert.equal((await api('/workflow/demands/'+demand.id+'/screening-job',{},admin)).status,403);assert.equal((await api('/workflow/demands/'+demand.id+'/screening-job',{},recruiter)).status,403);
 // Simulate a trusted provider result in this test database, without spending API credits.
 const db=new DatabaseSync(dbPath);const result={candidateName:'Screened candidate',email:'candidate@example.test',yearsExperience:7,education:'B.Tech',overallScore:82,recommendation:'Good Match',trackerDetails:{noticePeriod:'30 days',currentCTC:'12 LPA'}};db.prepare('UPDATE candidates SET result=?,status=? WHERE id=?').run(JSON.stringify(result),'done','cv1');
 ok(await api('/workflow/sync-screening',{},admin));job=ok(await api('/jobs',undefined,recruiter)).find(j=>j.id==='role_job');
 assert.equal((await api('/save-jobs',{jobs:[{...job,candidates:job.candidates.map(c=>({...c,result:{...c.result,overallScore:100}}))}]},recruiter)).status,403);
 saved=ok(await api('/save-jobs',{jobs:[job]},recruiter));assert.equal(saved.trackerSync.changed,0);
 state=ok(await api('/workflow/state',undefined,recruiter));a=state.applications.find(a=>a.screeningCandidateId==='cv1');assert.equal(a.screeningScore,82);assert.equal(a.noticePeriod,'30 days');assert.equal(a.currentCTC,'12 LPA');assert.equal(a.stage,'Internal Feedback Pending');
 for(const cookie of [admin,manager]){const monitor=ok(await api('/jobs',undefined,cookie)).find(j=>j.id==='role_job');assert.equal(monitor.candidates[0].result.overallScore,82);assert.equal(monitor.candidates[0].interviewToken,undefined);}
 // Preserving unrelated jobs avoids losing data from filtered or stale snapshots.
 const other={...job,id:'other_job',title:'Another role',candidates:[]};ok(await api('/save-jobs',{jobs:[other]},manager));assert.ok(ok(await api('/jobs',undefined,manager)).some(j=>j.id==='role_job'));
 const badInterview=await api('/candidate-interview-submit',{candidateId:'cv1',score:100,summary:'Forged score',transcript:[]},recruiter);assert.equal(badInterview.status,409);
 const interview={score:77,summary:'Provider evaluated transcript',completedAt:new Date().toISOString()};db.prepare('UPDATE candidates SET result=? WHERE id=?').run(JSON.stringify({...result,interview}),'cv1');ok(await api('/workflow/sync-screening',{},admin));
 state=ok(await api('/workflow/state',undefined,recruiter));a=state.applications.find(a=>a.screeningCandidateId==='cv1');assert.equal(a.interviewScore,77);
 a=ok(await api('/workflow/applications',{...a,stage:'Customer Feedback Pending'},recruiter));assert.ok(a.customerSubmissionDate);
 assert.equal((await api('/workflow/applications',{...a,version:a.version-1},recruiter)).status,409);
 a=ok(await api('/workflow/applications',{...a,stage:'Offered',expectedJoining:state.asOf},recruiter));assert.equal(a.counted,true);
 assert.equal((await api('/workflow/applications',{...a,stage:'Joined'},recruiter)).status,400);
 a=ok(await api('/workflow/applications',{...a,stage:'Joined',actualJoining:state.asOf},recruiter));assert.equal(a.stage,'Joined');
 for(const cookie of [admin,manager])assert.equal(ok(await api('/workflow/state',undefined,cookie)).applications.find(x=>x.id===a.id).stage,'Joined');
 ok(await api('/jobs/role_job/status',{status:'closed'},manager));job=ok(await api('/jobs',undefined,recruiter)).find(j=>j.id==='role_job');
 assert.equal((await api('/save-jobs',{jobs:[{...job,candidates:[...job.candidates,{id:'late',status:'queued',kind:'text',label:'Late resume',text:'CV'}]}]},recruiter)).status,409);
 assert.equal((await api('/analyze',{job,resume:{candidateId:'cv1',type:'db'}},recruiter)).status,409);
 assert.equal((await api('/interview/evaluate',{job,candidate:job.candidates[0],history:[]},recruiter)).status,409);
 a=ok(await api('/workflow/applications',{...a,remarks:'Joining confirmed after job closure'},recruiter));assert.ok(a.remarks);
 const tracker=ok(await api('/workflow/tracker',undefined,admin));assert.equal(tracker.tabs.length,7);assert.deepEqual(tracker.tables.map(t=>t.columns.length),[39,36,21]);
 assert.equal((await api('/workflow/sync-screening',{},recruiter)).status,403);assert.equal((await api('/jobs',undefined,'')).status,401);
 ok(await api('/workflow/assignments',{userId:managerUser.id,customerId:company.id,clusterId:cluster.id,remove:true},admin));assert.equal(ok(await api('/jobs',undefined,manager)).length,0);
 assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');db.close();
 console.log('PASS: full workbook import; manager-only JD/posting; admin/manager read-only candidate monitoring; recruiter-only upload/screen/interview/follow-up; score tampering denied; draft/closed job gates; unique Job ID; automatic tracker fields; offer→join allocations, dates, versions, scope revocation, seven-tab coverage and DB integrity. Real AI services were not called.');
}catch(e){console.error(logs);throw e;}finally{child.kill();}

