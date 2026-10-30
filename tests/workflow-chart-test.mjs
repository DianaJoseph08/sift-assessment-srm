import assert from 'node:assert/strict';
import {workflowChartData} from '../client/src/workflow-chart-data.mjs';
const result=workflowChartData([
 {client:'Bosch',active:2,offered:1,joined:0,hold:0,nonDoable:0,status:'Active',ageing:8},
 {client:'Bosch',active:'1',offered:0,joined:1,hold:0,nonDoable:0,status:'Active',ageing:null},
 {client:'Other',active:0,offered:0,joined:1,status:'Closed',ageing:90}
],[
 {stage:'Offered',source:'Naukri',internalSubmissionDate:'2026-10-01'},
 {stage:'Joined',source:'Naukri',internalSubmissionDate:'2026-10-02'},
 {stage:'Sourced',source:null,internalSubmissionDate:null}
],[{owner:'RM',due:null,overdue:0},{owner:'RM',due:'2026-10-01',overdue:2},{owner:'RM',due:'2026-10-10',overdue:0}]);
assert.equal(result.vacancies.find(r=>r.name==='Active').value,3);
assert.equal(result.customers.find(r=>r.name==='Bosch').joined,1);
assert.equal(result.ageing.find(r=>r.name==='8–14 days').count,1);
assert.equal(result.ageing.find(r=>r.name==='Date missing').count,1);
assert.equal(result.ageing.find(r=>r.name==='61+ days').count,0);
assert.equal(result.sources.find(r=>r.name==='Unassigned').count,1);
assert.equal(result.months[0].submissions,2);assert.equal(result.missingDates,1);
assert.deepEqual(result.workload[0],{name:'RM',overdue:1,upcoming:1,missingDate:1});
assert.equal(workflowChartData([],[],[]).stages.length,0);
console.log('PASS: chart totals, grouping, missing dates, active demand ageing, task workload and empty state.');
