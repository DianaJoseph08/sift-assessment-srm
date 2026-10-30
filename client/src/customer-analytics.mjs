export function customerAnalytics(customerId,clusterId,jobs,clusters,users){
 const customerClusters=clusters.filter(c=>c.customerId===customerId);
 const filteredJobs=jobs.filter(j=>j.companyId===customerId&&(!clusterId||j.clusterId===clusterId));
 const belongs=u=>(u.assignments?.length?u.assignments:[{customerId:u.customerId,clusterId:u.clusterId}]).some(a=>a.customerId===customerId&&(!clusterId||a.clusterId===clusterId));
 const managers=users.filter(u=>u.role==='manager'&&belongs(u)),recruiters=users.filter(u=>u.role==='recruiter'&&belongs(u));
 const count=list=>({jobs:list.length,active:list.filter(j=>['posted','active'].includes(j.status)).length,closed:list.filter(j=>j.status==='closed').length,screened:list.reduce((n,j)=>n+(j.candidates||[]).filter(c=>c.status==='done'&&c.result).length,0),resumes:list.reduce((n,j)=>n+(j.candidates||[]).length,0)});
 const summary=count(filteredJobs);
 const clusterStats=customerClusters.filter(c=>!clusterId||c.id===clusterId).map(c=>({name:c.name,id:c.id,...count(filteredJobs.filter(j=>j.clusterId===c.id)),managers:managers.filter(u=>(u.assignments?.length?u.assignments:[u]).some(a=>a.clusterId===c.id)).length,recruiters:recruiters.filter(u=>(u.assignments?.length?u.assignments:[u]).some(a=>a.clusterId===c.id)).length}));
 const statuses=Object.entries(filteredJobs.reduce((g,j)=>{const name=j.status||'Unspecified';g[name]=(g[name]||0)+1;return g;},{})).map(([name,count])=>({name,count}));
 return {summary,customerClusters,clusterStats,managers,recruiters,jobs:filteredJobs,statuses};
}
