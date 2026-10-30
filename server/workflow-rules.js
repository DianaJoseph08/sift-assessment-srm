export const STAGES = ['Sourced','Internal Feedback Pending','Internal Tool Test Scheduled','Internal Interview in Process','L1 Interview Feedback Pending','Customer Feedback Pending','Customer Tool Test Scheduled','Customer Interview Scheduled','Customer Select','To be offered','Offered','Joined','Screen Reject','Internal Tool Reject','Customer Tool Reject','Internal Profile Reject','Customer Profile Reject','Internal Interview Reject','Customer Interview Reject','Candidate Drop','Duplicate from customer end','Duplicate','Position Hold','Profile Hold','Internal Profile Hold','Position Closed','Candidate not interested after sharing'];
STAGES.push('Shared Profile to Customer','Fulfilled','Customer Interview Feedback Pending');
export const DEMAND_STATUSES = ['Active','Closed','Hold','Lost','Cancelled','Non Doable','YTC','YTD','Joined','Offered'];
export const SOURCES = ['Naukri','Vendor','Linkedin','Customer Reference','Manager Reference','Internal Reference','Direct'];
export const clean = v => String(v ?? '').replace(/\u00a0/g,' ').trim();
export const key = v => clean(v).toLowerCase().replace(/\s+/g,' ');
export function canonicalStage(v) {
  const k = key(v).replace('porfile','profile');
  const aliases = {'drop':'Candidate Drop','customer duplicate':'Duplicate from customer end','customer feedback pending':'Customer Feedback Pending','shared profile with the customer':'Customer Feedback Pending','profiles shared':'Customer Feedback Pending','shortlisted':'Customer Select','positions closed':'Position Closed','internal interview scheduled':'Internal Interview in Process'};
  return aliases[k] || STAGES.find(s=>key(s)===k) || clean(v) || 'Sourced';
}
export function sowKey(v) {
  const s=clean(v).toUpperCase();
  const match=s.match(/^(?:REQ[\s_/-]*|SOW[\s_/-]*(?:ID[\s_/-]*)?)?(\d+)(?:\s*\(N\/A\))?$/);
  return match ? match[1] : s;
}
export function category(stage) { return stage === 'Joined' ? 'joined' : stage === 'Offered' ? 'offered' : null; }
export function isoDate(value) {
  if (!value || ['na','n/a','tbc','-'].includes(key(value))) return null;
  if (value instanceof Date) return isNaN(value.getTime())?null:value.toISOString().slice(0,10);
  if (typeof value==='number' && value>20000 && value<100000) return new Date(Date.UTC(1899,11,30)+value*86400000).toISOString().slice(0,10);
  const s=clean(value); if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return validDate(s) ? s : null;
  const m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/); if(m){const d=`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`; return validDate(d)?d:null;} return null;
}
export function validDate(s) { const d=new Date(`${s}T00:00:00Z`); return !isNaN(d) && d.toISOString().slice(0,10)===s; }
export function indiaToday() { return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
export function ageDays(date, asOf=indiaToday()) { return !date ? null : Math.floor((Date.parse(asOf)-Date.parse(date))/86400000); }
export function vacancyMetrics(demand, applications) {
  const totals={joined:0,offered:0,hold:0,nonDoable:0,...demand.baseline};
  for(const a of applications) if(a.demandId===demand.id && a.counted && category(a.stage)) totals[category(a.stage)]++;
  return {...totals,total:Number(demand.vacancies||0),active:Number(demand.vacancies||0)-Object.values(totals).reduce((s,n)=>s+Number(n||0),0),ageing:ageDays(demand.openDate)};
}
export function nextTask(a, config) {
  const stage=a.stage;
  if (['Offered','Customer Interview Scheduled','Internal Tool Test Scheduled','Customer Tool Test Scheduled'].includes(stage)) {
    const due=stage==='Offered'?a.expectedJoining:a.interviewDate;
    return {action:stage==='Offered'?'Confirm joining':'Complete scheduled interview/test',due:due||null,missing:!due};
  }
  const action = stage==='Sourced'?'Screen and submit internally':stage==='Customer Select'||stage==='To be offered'?'Prepare offer':stage.includes('Pending')||stage==='Internal Interview in Process'||stage==='Shared Profile to Customer'?'Collect feedback':null;
  if(!action) return null;
  const start=a.stageChangedDate||(a.stageChangedAt?new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(a.stageChangedAt)):a.internalSubmissionDate);
  if(!start)return {action,due:null,missing:true};
  return {action,due:new Date(Date.parse(start)+Number(config.feedbackDays||2)*86400000).toISOString().slice(0,10)};
}
