const countBy=(rows,key)=>Object.entries(rows.reduce((out,row)=>{const name=String(row[key]||'Unassigned');out[name]=(out[name]||0)+1;return out;},{})).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
const number=v=>Number.isFinite(Number(v))?Number(v):0;
export function workflowChartData(demands,applications,tasks){
 const vacancies=['active','offered','joined','hold','nonDoable'].map((key,i)=>({name:['Active','Reserved','Joined','Hold / cancelled','Non doable'][i],value:demands.reduce((sum,d)=>sum+number(d[key]),0)}));
 const customers=Object.values(demands.reduce((out,d)=>{const name=d.client||'Unassigned';out[name]||={name,active:0,offered:0,joined:0,hold:0,nonDoable:0};for(const k of ['active','offered','joined','hold','nonDoable'])out[name][k]+=number(d[k]);return out;},{})).sort((a,b)=>b.active-a.active||a.name.localeCompare(b.name));
 const ageing=[{name:'0–7 days',count:0},{name:'8–14 days',count:0},{name:'15–30 days',count:0},{name:'31–60 days',count:0},{name:'61+ days',count:0},{name:'Date missing',count:0}];
 for(const d of demands.filter(d=>d.status==='Active')){const age=d.ageing;ageing[age==null||!Number.isFinite(Number(age))?5:age<=7?0:age<=14?1:age<=30?2:age<=60?3:4].count++;}
 const months={};let missingDates=0;
 for(const a of applications){if(!/^\d{4}-\d{2}-\d{2}$/.test(a.internalSubmissionDate||'')){missingDates++;continue;}const name=a.internalSubmissionDate.slice(0,7);months[name]||={name,submissions:0,currentOffered:0,currentJoined:0};months[name].submissions++;if(a.stage==='Offered')months[name].currentOffered++;if(a.stage==='Joined')months[name].currentJoined++;}
 const workload=Object.values(tasks.reduce((out,t)=>{const name=t.owner||'Unassigned';out[name]||={name,overdue:0,upcoming:0,missingDate:0};out[name][!t.due?'missingDate':t.overdue>0?'overdue':'upcoming']++;return out;},{})).sort((a,b)=>b.overdue-a.overdue||a.name.localeCompare(b.name));
 return {vacancies,customers,ageing,demandStatuses:countBy(demands,'status'),stages:countBy(applications,'stage'),sources:countBy(applications,'source'),months:Object.values(months).sort((a,b)=>a.name.localeCompare(b.name)),workload,missingDates};
}

