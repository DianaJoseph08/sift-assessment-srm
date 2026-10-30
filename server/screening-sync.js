import {formattedJobReference} from './job-reference-format.js';
import {randomUUID} from 'node:crypto';
import {indiaToday,isoDate} from './workflow-rules.js';
// Dependency injection avoids a db/workflow import cycle. Called after committed job writes.
export function createScreeningSynchronizer({db,getJobs,record,records,write,transaction,canAccess,getCompanies,getClusters}){
 db.exec('CREATE TABLE IF NOT EXISTS job_tracking(sequence INTEGER PRIMARY KEY AUTOINCREMENT,job_id TEXT NOT NULL UNIQUE,created_at TEXT NOT NULL)');
 if(!db.prepare('PRAGMA table_info(job_tracking)').all().some(c=>c.name==='reference'))db.exec('ALTER TABLE job_tracking ADD COLUMN reference TEXT');
 db.exec('CREATE UNIQUE INDEX IF NOT EXISTS job_tracking_reference ON job_tracking(reference); CREATE TABLE IF NOT EXISTS job_reference_aliases(reference TEXT PRIMARY KEY,job_id TEXT NOT NULL)');
 const reference=jobId=>{
  let row=db.prepare('SELECT sequence,reference FROM job_tracking WHERE job_id=?').get(jobId);
  if(!row){db.prepare('INSERT OR IGNORE INTO job_tracking(job_id,created_at) VALUES(?,?)').run(jobId,new Date().toISOString());row=db.prepare('SELECT sequence,reference FROM job_tracking WHERE job_id=?').get(jobId);}
  if(row.reference)return row.reference;
  const old=`JOB-${String(row.sequence).padStart(6,'0')}`;
  const job=getJobs().find(j=>j.id===jobId),company=job&&getCompanies().find(c=>c.id===job.companyId),cluster=job&&getClusters(job.companyId).find(c=>c.id===job.clusterId);
  if(!company||!cluster||!job.title?.trim())return old;
  const code=formattedJobReference(company.name,cluster.name,job.title,row.sequence);
  db.prepare('INSERT OR IGNORE INTO job_reference_aliases(reference,job_id) VALUES(?,?)').run(old,jobId);
  db.prepare('UPDATE job_tracking SET reference=? WHERE job_id=? AND reference IS NULL').run(code,jobId);
  return db.prepare('SELECT reference FROM job_tracking WHERE job_id=?').get(jobId).reference;
 };

 const resultDetails=c=>{const r=c.result||{},t=r.trackerDetails||{};const val=v=>v==null||['n/a','na','unknown','not specified'].includes(String(v).trim().toLowerCase())?'':String(v).trim();return {name:val(r.candidateName)||c.label,email:val(r.email),phone:val(t.phone),experience:val(t.totalExperience)||(r.yearsExperience!=null?String(r.yearsExperience):''),relevantExperience:val(t.relevantExperience),noticePeriod:val(t.noticePeriod),currentCompany:val(t.currentCompany),currentLocation:val(t.currentLocation),preferredLocation:val(t.preferredLocation),qualification:val(t.qualification)||val(r.education),currentCTC:val(t.currentCTC),expectedCTC:val(t.expectedCTC),employmentType:val(t.employmentType),grade:val(t.grade)};};
 const sync=actor=>transaction(()=>{
  let changed=0;const unassignedJobs=[];
  for(const j of getJobs()){
   if(!canAccess(actor,j))continue;
   const jobReference=reference(j.id);const cluster=getClusters(j.companyId).find(c=>c.id===j.clusterId),company=getCompanies().find(c=>c.id===j.companyId);
   if(!cluster||!company){unassignedJobs.push(jobReference);continue;} // Do not guess an access scope for legacy unassigned jobs.
   let d=records('demand').find(d=>d.jobId===j.id);
   if(!d && !['posted','closed'].includes(j.status))continue;
   if(!d){d=write('demand',{id:`job_demand_${j.id}`,jobId:j.id,jobReference,sowId:jobReference,customerId:company.id,clusterId:cluster.id,client:company.name,cluster:cluster.name,title:j.title,description:j.description,clientManager:j.clientManagerName||'',openDate:isoDate(j.postedAt?.slice(0,10))||indiaToday(),status:j.status==='closed'?'Closed':'Active',vacancies:1,baseline:{joined:0,offered:0,hold:0,nonDoable:0},location:j.location||'',combinationSkills:(j.mustHave||[]).join(', '),autoCreatedFromJob:true,autoJobValues:{title:j.title,description:j.description,location:j.location||'',status:j.status},createdBy:actor.id},actor.id,'Posted job automatically added to tracker');changed++;}
   else if(d.jobReference!==jobReference){const sowId=d.autoCreatedFromJob&&d.sowId===d.jobReference?jobReference:d.sowId;d=write('demand',{...d,jobReference,sowId},actor.id,'Company and cluster job reference assigned');changed++;}
   if(d.autoCreatedFromJob){const values={title:j.title,description:j.description,location:j.location||'',status:j.status},before=d.autoJobValues||values;const patch={};for(const k of ['title','description','location'])if(before[k]!==values[k])patch[k]=values[k];if(before.status!==values.status)patch.status=j.status==='closed'?'Closed':j.status==='draft'?'Hold':d.autoClosed?'Closed':'Active';if(Object.keys(patch).length||!d.autoJobValues){d=write('demand',{...d,...patch,autoJobValues:values},actor.id,'Posted job updated in tracker');changed++;}}
   for(const c of j.candidates||[]){
    const id=`screened_${c.id}`,old=record('application',id),screened=c.status==='done'&&!!c.result;
    const details=resultDetails(c),fingerprint=JSON.stringify({status:c.status,result:c.result,label:c.label});
    if(old?.screeningFingerprint===fingerprint&&old.jobReference===jobReference)continue;
    const a={...old,id,personId:old?.personId||`person_${randomUUID()}`,customerId:company.id,clusterId:cluster.id,client:company.name,cluster:cluster.name,demandId:d.id,jobId:j.id,jobReference,sowId:d.sowId,skill:d.title,clientManager:d.clientManager||'',screeningCandidateId:c.id,screeningStatus:c.status||'queued',screeningScore:screened?c.result.overallScore:null,screeningRecommendation:screened?c.result.recommendation:null,interviewScore:c.result?.interview?.score??old?.interviewScore??null,interviewSummary:c.result?.interview?.summary||old?.interviewSummary||'',interviewCompletedAt:c.result?.interview?.completedAt||old?.interviewCompletedAt||null,screeningFingerprint:fingerprint,uploadedAt:old?.uploadedAt||new Date().toISOString(),recruiterId:old?.recruiterId||(actor.role==='recruiter'?actor.id:null),recruiter:old?.recruiter||(actor.role==='recruiter'?actor.name:''),uploadedBy:old?.uploadedBy||actor.id,counted:old?.counted||false,stage:old?.stage||'Sourced'};
    for(const [key,value] of Object.entries(details))if(!old?.[key]||key==='name'&&old?.name===c.label||value&&old?.autoExtracted?.[key]===old?.[key])a[key]=value;
    a.autoExtracted=details;
    if(screened){a.screenedAt=old?.screenedAt||new Date().toISOString();if(!old?.stage||old.stage==='Sourced'){a.stage='Internal Feedback Pending';a.internalSubmissionDate=old?.internalSubmissionDate||indiaToday();a.stageChangedAt=new Date().toISOString();a.stageChangedDate=indiaToday();}}
    write('person',{...record('person',a.personId),id:a.personId,name:a.name,email:a.email,phone:a.phone},actor.id,'Resume details synchronized');
    write('application',a,actor.id,screened?'Screening details automatically synchronized':'Resume upload automatically tracked');changed++;
   }
  }
  return {changed,unassignedJobs};
 });
 return {sync,reference};
}

