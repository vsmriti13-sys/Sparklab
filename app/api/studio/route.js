import {discover} from '../../../lib/research.mjs';
import {studioBrief,validateDesign} from '../../../lib/material-schema.mjs';
import {designMaterials,reviewMaterials} from '../../../lib/studio-provider.mjs';
import {sealBundle,openBundle} from '../../../lib/bundle-token.mjs';
export const maxDuration=180;
export async function GET(){return Response.json({generationAvailable:Boolean(process.env.GEMINI_API_KEY),researchProvider:'Crossref',version:'research-studio-1'});}
export async function POST(request){
 let stage='request';
 try{
 const raw=await request.text();if(raw.length>450000)return Response.json({error:'Request too large.'},{status:413});const body=JSON.parse(raw);stage=body.stage;
 const key=process.env.GEMINI_API_KEY;
 if(stage==='research'){
 const sources=await discover(body.query);return Response.json({sources,researchToken:key?sealBundle('research',{sources,query:body.query},key):null});
 }
 if(!key)return Response.json({error:'Research works without a key. Configure GEMINI_API_KEY on the server to generate materials.'},{status:503});
 if(stage==='design'){
 const brief=studioBrief(body.brief);const research=openBundle(body.researchToken,'research',key);
 if(!Array.isArray(body.selectedIds)||!body.selectedIds.length||body.selectedIds.length>5)throw new Error('Select 1–5 retrieved resources.');
 const sources=research.sources.filter(s=>body.selectedIds.includes(s.id));if(sources.length!==new Set(body.selectedIds).size)throw new Error('Selected sources must come from this research search.');
 let prior=null;if(body.priorToken)prior=openBundle(body.priorToken,'design',key).design;
 const {design,model}=await designMaterials(brief,sources,prior);
 const payload={brief,sources,design,model,createdAt:new Date().toISOString()};
 return Response.json({...payload,designToken:sealBundle('design',payload,key)});
 }
 if(stage==='review'){
 const pack=openBundle(body.designToken,'design',key);validateDesign(pack.design,pack.sources);
 const {review,model}=await reviewMaterials(pack.brief,pack.design,pack.sources);
 return Response.json({review,reviewModel:model,reviewedAt:new Date().toISOString()});
 }
 throw new Error('Unknown studio stage.');
 }catch(e){const timeout=['TimeoutError','AbortError'].includes(e.name);return Response.json({error:timeout?`${stage} took too long. Completed stages are kept. Retry this stage.`:e instanceof SyntaxError?'Invalid request data.':e.message,stage},{status:timeout?504:400});}
}
