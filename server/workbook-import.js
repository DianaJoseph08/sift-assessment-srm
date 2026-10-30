import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { createHash } from 'node:crypto';
import { clean, key, sowKey, canonicalStage, isoDate } from './workflow-rules.js';
const hash=s=>createHash('sha256').update(s).digest('hex').slice(0,24);
function value(cell) {
  const v=cell.value;
  if(v && typeof v==='object' && !(v instanceof Date)) {
    if('formula' in v || 'sharedFormula' in v) return null;
    if(v.richText) return v.richText.map(t=>t.text).join('');
    return v.text ?? v.result ?? null;
  } return v;
}
function sourceRow(sheet,row,header=1) {
  const raw={}; sheet.getRow(header).eachCell((c,col)=>{const name=clean(value(c)); if(name) raw[name]=value(sheet.getRow(row).getCell(col));});
  return raw;
}
const n=v=>{const s=clean(v); return s!=='' && Number.isFinite(Number(s)) ? Number(s) : 0;};
export async function parseWorkbooks(files) {
  const result={customers:[],rms:[],demands:[],applications:[],offers:[],issues:[],sheets:[],controls:[],dictionaries:[]};
  for(const file of files) {
    // Some supplied tables have filter columns beyond their table column count.
    // Strip only table filter metadata from an in-memory copy; source files stay untouched.
    const zip=await JSZip.loadAsync(file.buffer);
    let uncompressed=0;for(const entry of Object.values(zip.files)){uncompressed+=entry._data?.uncompressedSize||0;}
    if(uncompressed>60*1024*1024)throw new Error('Expanded workbook exceeds the 60 MB import limit');
    for(const entry of Object.values(zip.files))if(/^xl\/tables\/[^/]+\.xml$/.test(entry.name)){
      const xml=await entry.async('string');zip.file(entry.name,xml.replace(/<autoFilter\b[^>]*\/>|<autoFilter\b[\s\S]*?<\/autoFilter>/g,''));
    }
    const workbook=new ExcelJS.Workbook(); await workbook.xlsx.load(await zip.generateAsync({type:'nodebuffer'}));
    const name=file.name;
    for(const sheet of workbook.worksheets) {
      result.sheets.push({file:name,sheet:sheet.name,rows:sheet.rowCount});
      const provenance=row=>({file:name,sheet:sheet.name,row});
      const id=(kind,row)=>`${kind}_${hash(`${sheet.name}|${row}`)}`;
      if(sheet.name==='Customers List') {
        sheet.eachRow((row,i)=>{if(i>1 && clean(value(row.getCell(1)))) result.customers.push(clean(value(row.getCell(1))));});
      } else if(sheet.name==='Clusters and RMs') {
        sheet.eachRow((row,i)=>{if(i<2)return; const cluster=clean(value(row.getCell(1))); for(let col=2;col<=5;col++){const s=clean(value(row.getCell(col)));if(!s)continue;const match=s.match(/^(.*?)\s*\(([^)]+@[^)]+)\)$/); if(match) result.rms.push({name:clean(match[1]),email:key(match[2]),cluster,slot:col-1});else result.issues.push({...provenance(i),message:'RM email could not be parsed'});}});
      } else if(sheet.name==='DV_DailyTrack') {
        for(const [column,kind,start] of [[6,'stage',2],[8,'customerAlias',3],[13,'clientManager',2],[14,'demandStatus',3],[15,'clientSpoc',2],[16,'clientHead',3]]){
          for(let row=start;row<=sheet.rowCount;row++){const label=clean(value(sheet.getRow(row).getCell(column)));if(label)result.dictionaries.push({kind,label,provenance:provenance(row)});}
        }
      } else if(sheet.name==='Open Position Tracker Master') {
        const controls={file:name,sheet:sheet.name,total:0,joined:0,offered:0,hold:0,nonDoable:0};
        sheet.eachRow((row,i)=>{if(i<5)return;const raw=sourceRow(sheet,i,4);
          for(const [k,label] of [['total','No. Of Open Position'],['joined','Joined / Closed'],['offered','Offered/Yet to Join / Shortlisted'],['hold','Hold/Cancelled'],['nonDoable','Non Doable/YTC']])controls[k]+=n(raw[label]);
          if(!clean(raw['Position Code'])){if(['No. Of Open Position','Joined / Closed','Offered/Yet to Join / Shortlisted','Hold/Cancelled','Non Doable/YTC'].some(k=>n(raw[k])!==0))result.issues.push({...provenance(i),raw,message:'Vacancy counts without a position code; excluded from demand totals until assigned'});return;}
          const d={id:id('demand',i),sowId:clean(raw['Position Code']),client:clean(raw.Client),cluster:clean(raw['CLUSTER Classification']),openDate:isoDate(raw['Position Open Date']),status:clean(raw['Position Status'])||'Active',title:clean(raw['Skills - Description']),combinationSkills:clean(raw['Combination Skillset']),clientHead:clean(raw['Client Head']),clientManager:clean(raw['Client Manager']),clientSpoc:clean(raw['Client SPOC']),mtslSpoc:clean(raw['MTSL SPOC']),grade:clean(raw.Grade),experience:clean(raw['Experience Range']),positionType:clean(raw['Position Type']),replacementName:clean(raw['Replacement Employee Name']),lwd:isoDate(raw['<-- LWD']),vacancies:n(raw['No. Of Open Position']),location:clean(raw.Location),baseline:{joined:n(raw['Joined / Closed']),offered:n(raw['Offered/Yet to Join / Shortlisted']),hold:n(raw['Hold/Cancelled']),nonDoable:n(raw['Non Doable/YTC'])},profileStatus:clean(raw['Profile Status']),budget:clean(raw['CTC Budget']),actualGM:clean(raw['Actual GM%']),candidateNames:clean(raw['Candidate Name']),mtslDoj:isoDate(raw['MTSL DOJ']),source:clean(raw.Source),industry:clean(raw.Industry),reason:clean(raw['Reason for Cancelled/Lost/Hold']),holdDate:isoDate(raw['Hold / Cancelled Date']),deadline:isoDate(raw.Deadline),remarks:clean(raw.Remarks),targetCompanies:clean(raw['Target Companies']),challenges:clean(raw.Challenges),provenance:provenance(i),raw};
          result.demands.push(d); if(!d.openDate)result.issues.push({...d.provenance,recordId:d.id,message:'Missing or unrecognized position open date'});
          if(d.vacancies<Object.values(d.baseline).reduce((s,n)=>s+n,0))result.issues.push({...d.provenance,recordId:d.id,message:'Historical allocations exceed total vacancies'});
        });
        controls.active=controls.total-controls.joined-controls.offered-controls.hold-controls.nonDoable;result.controls.push(controls);
        result.issues.push({file:name,sheet:'Dashboard',row:6,cell:'C6',message:'Dashboard has a manually entered count (2); app reports recalculate from source records'});
        result.issues.push({file:name,sheet:sheet.name,row:41,cell:'AM41',message:'Challenges formula multiplies the Remarks field by 12; review intended value'});
        result.issues.push({file:name,sheet:'Summary_Bosch',row:5,message:'Summary formulas omit explicit cluster filtering and use inconsistent SOW keys; app uses full linked IDs and selected scope'});
      } else if(sheet.name==='Supply Master Data') {
        sheet.eachRow((row,i)=>{if(i<2)return;const raw=sourceRow(sheet,i);if(!clean(raw['Candidate Name']))return;
          const a={id:id('application',i),personId:id('person',i),name:clean(raw['Candidate Name']),client:clean(raw.Client),cluster:clean(raw.Cluster),sowId:clean(raw['REQ/SOWID']),clientManager:clean(raw['Client Manager']),skill:clean(raw.Skill),recruiter:clean(raw.Recruiter),source:clean(raw.Source),stage:canonicalStage(raw['Internal Feedback Pending']),internalSubmissionDate:isoDate(raw['Internal Submission Date']),internalFeedbackDate:isoDate(raw['Internal feedback date']),customerSubmissionDate:isoDate(raw['Cust.Sub.Date']),customerFeedbackDate:isoDate(raw['Cust.Feed.Date']),interviewDate:isoDate(raw['Customer Interview Date']),actualJoining:isoDate(raw['Onboarding Date MTSL']),experience:clean(raw['Total Exp. (Years)']),relevantExperience:clean(raw['Relevant Exp']),noticePeriod:clean(raw['Notice Period']),currentCompany:clean(raw['Current / Last Company']),currentLocation:clean(raw['Current location']),preferredLocation:clean(raw['Preferred location']),qualification:clean(raw.Qualification),currentCTC:clean(raw['Current CTC']),expectedCTC:clean(raw.ECTC),employmentType:clean(raw['Internal /External']),grade:clean(raw.Grade),extraFields:Object.fromEntries(Array.from({length:8},(_,j)=>[`extra${j+3}`,clean(raw[`Column${j+3}`])])),provenance:provenance(i),raw};
          result.applications.push(a);
        });
      } else if(sheet.name.trim()==='Offered Tracker') {
        sheet.eachRow((row,i)=>{if(i<2)return;const raw=sourceRow(sheet,i); if(!clean(raw['Candidate Name']))return;
          result.offers.push({id:id('offer',i),personId:id('person',i),name:clean(raw['Candidate Name']),client:clean(raw['Client Name']),cluster:clean(raw.Cluster),sowId:clean(raw['SOW ID']),skill:clean(raw.Skill),tagLead:clean(raw['Tag Lead']),pmo:clean(raw.PMO),recruiter:clean(raw['TAG Member']),experience:clean(raw['Exp.']),currentCTC:clean(raw.CTC),expectedCTC:clean(raw.ECTC),noticePeriod:clean(raw.NP),selectionDate:isoDate(raw['Date of Selection']),offerDate:isoDate(raw['Date of Offer']),expectedJoining:isoDate(raw['Joining Date']),actualJoining:isoDate(raw.DOJ),department:clean(raw.Department),stage:key(raw['Joining Status'])==='drop'?'Candidate Drop':key(raw['Joining Status'])==='joined'?'Joined':'Offered',source:clean(raw.Source),remarks:clean(raw.Remarks),provenance:provenance(i),raw});
        });
      }
    }
  }
  for(const a of [...result.applications,...result.offers]) {
    const matches=result.demands.filter(d=>key(d.client)===key(a.client) && sowKey(d.sowId)===sowKey(a.sowId));
    a.demandId=matches.length===1?matches[0].id:null;
    if(!a.demandId)result.issues.push({...a.provenance,recordId:a.id,message:matches.length>1?'Ambiguous SOW match; manual link required':'No exact SOW match; manual link required'});
  }
  return result;
}
