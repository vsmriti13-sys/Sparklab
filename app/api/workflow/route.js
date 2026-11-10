import {validateBrief,demoActivity} from '../../../lib/workflow.mjs';
import {research,createActivity,reviewActivity} from '../../../lib/providers.mjs';
import {sealEvidence,openEvidence} from '../../../lib/evidence.mjs';
export const maxDuration=180;
export async function GET(){return Response.json({liveAvailable:Boolean(process.env.GEMINI_API_KEY)});}
export async function POST(request){
 let stage='workflow';
 try{
 const text=await request.text();if(text.length>60000)return Response.json({error:'Brief is too large.'},{status:413});
 const body=JSON.parse(text);const brief=validateBrief(body.brief);stage=body.stage;
 if(body.mode==='demo')return Response.json({mode:'demo',sources:[],activity:demoActivity(brief),stages:['Demonstration research: no search performed','Example activity assembled','Example quality review completed']});
 const key=process.env.GEMINI_API_KEY;
 if(!key)return Response.json({error:'Live mode needs a server-side GEMINI_API_KEY. Select demonstration mode to explore.'},{status:503});
 if(stage==='research'){
 const sources=await research(brief.topic);
 return Response.json({sources,evidence:sealEvidence(brief.topic,sources,key)});
 }
 if(stage==='create'){
 const sources=openEvidence(body.evidence,brief.topic,key);
 const activity=await createActivity(brief,sources);
 return Response.json({activity});
 }
 if(stage==='review'){
 if(!body.activity||!Array.isArray(body.activity.steps)||!body.activity.title)return Response.json({error:'Activity is missing. Restart the workflow.'},{status:400});
 const activity=await reviewActivity(brief,body.activity);
 return Response.json({activity});
 }
 return Response.json({error:'Unknown workflow stage. Refresh SparkLab and try again.'},{status:400});
 }catch(e){
 const timeout=e.name==='TimeoutError'||e.name==='AbortError';
 const label={research:'Scholarly search',create:'Gemini activity creation',review:'Gemini quality review'}[stage]||'Workflow';
 return Response.json({error:timeout?`${label} took too long. Your completed stages are kept; click Retry to continue.`:e instanceof SyntaxError?'Invalid request.':e.message||'Workflow failed.',stage},{status:timeout?504:400});
 }
}
