import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {TRACKER_SCHEMA,TRACKER_TABS} from '../shared/daily-tracker-schema.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const output=path.join(root,'scratch',`tracker-ui-${Date.now()}.mjs`);await fs.mkdir(path.dirname(output),{recursive:true});
await build({entryPoints:[path.join(root,'client/src/DailyTracker.jsx')],bundle:true,format:'esm',platform:'node',packages:'external',outfile:output});
const {default:DailyTracker}=await import(pathToFileURL(output));
const state={asOf:'2026-10-29',applications:[{id:'a',name:'Test',client:'Customer',cluster:'SAP',customerId:'c',clusterId:'cl',sowId:'REQ-1',stage:'Internal Feedback Pending',recruiter:'Recruiter',clientManager:'Manager',internalSubmissionDate:'2026-10-29'}],demands:[{id:'d',client:'Customer',cluster:'SAP',customerId:'c',clusterId:'cl',sowId:'REQ-1',clientManager:'Manager',active:1,total:1}],companies:[{id:'c',name:'Customer'}],clusters:[{id:'cl',name:'SAP'}],stages:['Internal Feedback Pending'],dictionaries:[],tracker:{tables:TRACKER_SCHEMA.map(s=>({...s,rows:[]}))}};
for(const tab of TRACKER_TABS){const html=renderToStaticMarkup(React.createElement(DailyTracker,{state,customer:'',cluster:'',query:'',currentUser:{role:'super_admin'},initialSheet:tab}));assert.ok(html.includes('Daily Tracker'));if(tab==='Supply Master Data')assert.ok(html.includes('Column10'));if(tab==='Open Position Tracker Master')assert.ok(html.includes('CTC Budget'));if(tab==='Offered Tracker')assert.ok(html.includes('Date of Selection'));if(['Dashboard','Summary_Bosch','Recruiter Vise'].includes(tab))assert.ok(html.includes('Internal Feedback Pending'));}
console.log('PASS: all seven tracker screens render, original terminal columns are visible, and live summary matrices render. This is static rendering, not a browser interaction test.');
