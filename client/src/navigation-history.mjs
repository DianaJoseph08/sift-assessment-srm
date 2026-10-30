const fields={tab:'tab',customerId:'customer',jobId:'job',step:'step',workflowTab:'workflow',workflowJobId:'workflow-job'};
export function readNavigation(href){const p=new URL(href).searchParams;return {tab:p.get('tab')||'dashboard',customerId:p.get('customer')||null,jobId:p.get('job')||null,step:Math.max(1,Math.min(5,Number(p.get('step'))||1)),workflowTab:p.get('workflow')||'dashboard',workflowJobId:p.get('workflow-job')||null};}
export function navigationURL(href,patch){const url=new URL(href);for(const [key,value] of Object.entries(patch)){if(!fields[key])continue;if(value==null||value==='')url.searchParams.delete(fields[key]);else url.searchParams.set(fields[key],String(value));}return url;}
export function createNavigationHistory(win){
 let pending=null,scheduled=false;
 const flush=()=>{scheduled=false;const url=pending;pending=null;if(url&&url.href!==win.location.href){win.history.pushState(null,'',url.href);win.dispatchEvent(new win.Event('app-navigation'));}};
 return {read:()=>readNavigation(pending?.href||win.location.href),update(patch){pending=navigationURL(pending?.href||win.location.href,patch);if(!scheduled){scheduled=true;queueMicrotask(flush);}return readNavigation(pending.href);},subscribe(callback){const handle=()=>callback(readNavigation(win.location.href));win.addEventListener('popstate',handle);win.addEventListener('app-navigation',handle);return()=>{win.removeEventListener('popstate',handle);win.removeEventListener('app-navigation',handle);};}};
}
