// Real research + real model + actual export endpoint. No fixtures or fallback content.
// Usage: node scripts/validate-live.mjs https://YOUR-CURRENT-PRODUCTION-DOMAIN.vercel.app
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const base=process.argv[2];
if(!base||!/^https?:\/\//.test(base))throw new Error('Supply the current deployed SparkLab URL, or a local running server with a real GEMINI_API_KEY.');
const out=process.argv[3]||`/tmp/sparklab-live-${new Date().toISOString().replace(/[:.]/g,'-')}`;
await mkdir(out,{recursive:true});
const status=await fetch(new URL('/api/studio',base));
if(!status.ok)throw new Error(`Studio endpoint returned ${status.status}. Deploy the research-studio version first.`);
const config=await status.json();if(!config.generationAvailable)throw new Error('The target deployment has no Gemini key.');
async function call(body){const res=await fetch(new URL('/api/studio',base),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(175000)});const text=await res.text();let data;try{data=JSON.parse(text);}catch{throw new Error(`Server returned non-JSON (${res.status}). Check deployment duration and logs.`);}if(!res.ok)throw new Error(data.error);return data;}
const brief={topic:'Retrieval practice and durable learning',objectives:'Distinguish retrieval practice from rereading; evaluate what a small classroom comparison can establish; design an accessible low-stakes retrieval task with feedback.',kind:'workshop',ageGroup:'Adult secondary-school teachers',duration:45,participants:16,context:'Erasmus+ professional development; multilingual teachers with mixed English confidence; pens and printed materials, optional devices. All needed original texts and task stimulus must be included.',revision:''};
const research=await call({stage:'research',query:'retrieval practice learning classroom'});
await writeFile(path.join(out,'retrieved-sources.json'),JSON.stringify({query:'retrieval practice learning classroom',retrievedAt:new Date().toISOString(),sources:research.sources},null,2));
const ranked=research.sources.filter(s=>s.abstract&&/retriev|test.enhanced/i.test(s.title)).slice(0,3);
if(!ranked.length)throw new Error('Search returned no relevant abstracts. Inspect retrieved-sources.json and refine the query; no substitute references were created.');
console.log('Selected real sources:');for(const s of ranked)console.log(`${s.title} (${s.year})\n${s.url}\n`);
let generated=await call({stage:'design',brief,researchToken:research.researchToken,selectedIds:ranked.map(s=>s.id)});
let reviewed=await call({stage:'review',designToken:generated.designToken});
if(!reviewed.review.ready){const revision=reviewed.review.checks.filter(c=>!c.pass).map(c=>`${c.criterion}: ${c.note}`).join('\n');console.log('Reviewer identified issues; revising:',revision);generated=await call({stage:'design',brief:{...brief,revision},researchToken:research.researchToken,selectedIds:ranked.map(s=>s.id),priorToken:generated.designToken});reviewed=await call({stage:'review',designToken:generated.designToken});}
const pack={...generated,...reviewed,approved:reviewed.review.ready,approvalContext:'Validation run only; not saved as user-approved in the browser.'};
await writeFile(path.join(out,'generated-pack.json'),JSON.stringify(pack,null,2));
if(!reviewed.review.ready)throw new Error('Quality review still has unresolved issues. No approved deliverables were downloaded; inspect generated-pack.json.');
for(const format of ['slides','worksheetDocx','worksheetPdf','facilitator']){
 const r=await fetch(new URL('/api/export',base),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({format,pack}),signal:AbortSignal.timeout(60000)});
 if(!r.ok)throw new Error(`Download ${format} failed: ${await r.text()}`);
 const filename=r.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1];if(!filename)throw new Error('No download filename.');
 const bytes=Buffer.from(await r.arrayBuffer());if(bytes.length<3000)throw new Error('Downloaded file is unexpectedly small.');
 await writeFile(path.join(out,filename),bytes);console.log('Downloaded',filename,bytes.length,'bytes');
}
console.log('Live research and model run completed. Files:',out,'\nNext: open files in Office/LibreOffice, render and inspect content before reporting end-to-end validation complete.');
