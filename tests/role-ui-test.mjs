import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {TRACKER_SCHEMA} from '../shared/daily-tracker-schema.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const dir=path.join(root,'scratch',`role-ui-${Date.now()}`);await fs.mkdir(dir,{recursive:true});
for(const name of ['DailyTracker','JobMonitor'])await build({entryPoints:[path.join(root,`client/src/${name}.jsx`)],bundle:true,format:'esm',platform:'node',packages:'external',loader:{'.css':'empty'},outfile:path.join(dir,name+'.mjs')});
const {default:DailyTracker}=await import(pathToFileURL(path.join(dir,'DailyTracker.mjs')));const {default:JobMonitor}=await import(pathToFileURL(path.join(dir,'JobMonitor.mjs')));
const state={asOf:'2026-10-29',applications:[],demands:[],companies:[],clusters:[],stages:[],dictionaries:[],tracker:{tables:TRACKER_SCHEMA.map(t=>({...t,rows:[]}))}};
for(const role of ['super_admin','manager','recruiter'])for(const sheet of ['Open Position Tracker Master','Supply Master Data','Offered Tracker']){const html=renderToStaticMarkup(React.createElement(DailyTracker,{state,currentUser:{id:'user',role},initialSheet:sheet}));assert.equal(html.includes('Add record'),sheet==='Open Position Tracker Master'?role==='manager':role==='recruiter',role+' '+sheet);}
const job={id:'j',jobReference:'SKODA-EMB-SE-000001',title:'Software Engineer',description:'Manager-owned JD',status:'posted',candidates:[{id:'cv',label:'Candidate',status:'done',result:{overallScore:82,recommendation:'Good Match',interview:{score:77}}}]};
const monitor=renderToStaticMarkup(React.createElement(JobMonitor,{job,C:{paper:'#fff',ink:'#111',sub:'#666',line:'#ddd'}}));assert.ok(monitor.includes('82'));assert.ok(monitor.includes('77'));assert.ok(monitor.includes('Manager-owned JD'));assert.ok(monitor.includes('Export compiled results'));assert.ok(!monitor.includes('Post job'));assert.ok(!monitor.includes('<input'));assert.ok(!monitor.includes('<textarea'));
console.log('PASS: role-specific tracker creation controls and read-only job monitoring with screening/interview scores and compiled export. Static rendering only.');
