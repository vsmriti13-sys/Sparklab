import {validateBrief,demoActivity} from '../../../lib/workflow.mjs';
import {research,generateActivity} from '../../../lib/providers.mjs';
export const maxDuration=60;
export async function GET(){return Response.json({liveAvailable:Boolean(process.env.GEMINI_API_KEY)});}
export async function POST(request){
 try{
 const text=await request.text();if(text.length>16000)return Response.json({error:'Brief is too large.'},{status:413});
 const body=JSON.parse(text);const brief=validateBrief(body.brief);
 if(body.mode==='demo')return Response.json({mode:'demo',sources:[],activity:demoActivity(brief),stages:['Demonstration research: no search performed','Example activity assembled','Example quality review completed']});
 if(!process.env.GEMINI_API_KEY)return Response.json({error:'Live mode needs a server-side GEMINI_API_KEY. Select demonstration mode to explore.'},{status:503});
 // Research is a separate tool call; generation receives only retrieved source records.
 const sources=await research(brief.topic);
 const activity=await generateActivity(brief,sources);
 return Response.json({mode:'live',sources,activity,stages:[`${sources.length} Crossref records retrieved`,'Gemini created an activity from the brief and metadata','A separate Gemini call completed a critical quality review; human approval required']});
 }catch(e){return Response.json({error:e instanceof SyntaxError?'Invalid request.':e.message || 'Workflow failed.'},{status:400});}
}
