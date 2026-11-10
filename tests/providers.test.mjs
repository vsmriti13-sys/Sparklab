import {test} from 'node:test';
import assert from 'node:assert/strict';
import {research,generateActivity} from '../lib/providers.mjs';
import {demoActivity} from '../lib/workflow.mjs';
test('research retains only returned source records and constructs DOI links',async()=>{const old=global.fetch;global.fetch=async()=>Response.json({message:{items:[{DOI:'10.1234/example',title:['Actual returned title'],published:{'date-parts':[[2024]]}},{title:['Missing DOI']}]}});try{const r=await research('UDL');assert.equal(r.length,1);assert.equal(r[0].url,'https://doi.org/10.1234%2Fexample');assert.match(r[0].verification,/not verified/);}finally{global.fetch=old;}});
test('creation invokes a separate reviewer and removes unsupported source IDs',async()=>{const old=global.fetch;const activity=demoActivity({topic:'UDL'});activity.sourceIds=['S1','invented'];let calls=0;global.fetch=async()=>{calls++;return Response.json({candidates:[{content:{parts:[{text:JSON.stringify(calls===1?activity:{review:activity.review.map(r=>({...r,status:'Reviewed independently'}))})}]}}]});};try{const r=await generateActivity({topic:'UDL'},[{id:'S1'}]);assert.equal(calls,2);assert.deepEqual(r.sourceIds,['S1']);assert.equal(r.review[0].status,'Reviewed independently');}finally{global.fetch=old;}});

test('404 discovers an available stable Flash model and retries only that model',async()=>{
 const {requestGeneration,normalizeModel}=await import('../lib/providers.mjs');
 assert.equal(normalizeModel(' models/gemini-2.5-flash '),'gemini-2.5-flash');
 assert.throws(()=>normalizeModel('https://example.com/model'));
 const old=global.fetch;const urls=[];
 global.fetch=async(url)=>{urls.push(url);if(urls.length===1)return new Response('',{status:404});if(urls.length===2)return Response.json({models:[{name:'models/gemini-9.0-pro',supportedGenerationMethods:['generateContent']},{name:'models/gemini-9.0-flash-preview',supportedGenerationMethods:['generateContent']},{name:'models/gemini-3.0-flash',supportedGenerationMethods:['generateContent']}]});return Response.json({candidates:[]});};
 try{const r=await requestGeneration({},'retired-model',1000);assert.equal(r.model,'gemini-3.0-flash');assert.equal(urls.length,3);assert.match(urls[2],/gemini-3.0-flash:generateContent$/);}finally{global.fetch=old;}
});
test('quota failures are explicit and never trigger model switching',async()=>{const {requestGeneration}=await import('../lib/providers.mjs');const old=global.fetch;let calls=0;global.fetch=async()=>{calls++;return new Response('',{status:429});};try{await assert.rejects(()=>requestGeneration({},'gemini-2.5-flash',1000),/usage limit reached/);assert.equal(calls,1);}finally{global.fetch=old;}});
test('404 with no eligible models fails clearly without inventing a model',async()=>{const {requestGeneration}=await import('../lib/providers.mjs');const old=global.fetch;let calls=0;global.fetch=async()=>++calls===1?new Response('',{status:404}):Response.json({models:[]});try{await assert.rejects(()=>requestGeneration({},'retired',1000),/No compatible stable Flash model/);assert.equal(calls,2);}finally{global.fetch=old;}});
