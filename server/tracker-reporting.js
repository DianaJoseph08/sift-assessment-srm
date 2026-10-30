import {TRACKER_SCHEMA,TRACKER_TABS} from '../shared/daily-tracker-schema.js';
import {canonicalStage,sowKey} from './workflow-rules.js';
export function trackerTables(state){
 const {demands,applications,config}=state;
 const rows=(kind)=> (kind==='demand'?demands:kind==='offer'?applications.filter(a=>a.offerDate||a.offerProvenance||['Offered','Joined'].includes(a.stage)):applications).map((r,i)=>{
  const d=kind==='demand'?r:demands.find(d=>d.id===r.demandId);
  const view={...r,serial:i+1,jobReference:r.jobReference||d?.jobReference||'',normalizedSow:sowKey(r.sowId),vacancies:r.total??r.vacancies,doable:r.doable??r.raw?.['Doable /Non Doable']??'',candidateNames:kind==='demand'?applications.filter(a=>a.demandId===r.id&&a.stage==='Joined').map(a=>a.name).join(', ')||r.candidateNames||r.raw?.['Candidate Name']||'':undefined,mtslDoj:r.mtslDoj||r.raw?.['MTSL DOJ']||''};
  for(let k=3;k<=10;k++)view[`extra${k}`]=r.extraFields?.[`extra${k}`]??r.raw?.[`Column${k}`]??'';
  return view;
 });
 const tables=TRACKER_SCHEMA.map(s=>({...s,rows:rows(s.kind)}));
 return {tabs:TRACKER_TABS,tables};
}
export function statusMatrix(apps,demands,group,stages){
 const groups=new Map();const ensure=name=>{if(!groups.has(name))groups.set(name,{name,total:0,openPositions:0,stages:Object.fromEntries(stages.map(s=>[s,0]))});return groups.get(name);};
 for(const d of demands)ensure(d[group]||'Unassigned').openPositions+=Number(d.active||0);
 for(const a of apps){const row=ensure(a[group]||'Unassigned');row.total++;const stage=canonicalStage(a.stage);row.stages[stage]=(row.stages[stage]||0)+1;}
 return [...groups.values()].sort((a,b)=>a.name.localeCompare(b.name));
}
