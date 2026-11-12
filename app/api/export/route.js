import {exportMaterial} from '../../../lib/exports.mjs';
import {validateReview} from '../../../lib/material-schema.mjs';
export const maxDuration=60;
export async function POST(request){try{
 const raw=await request.text();if(raw.length>200000)return Response.json({error:'Export too large.'},{status:413});
 const {format,pack}=JSON.parse(raw);if(!pack?.approved)throw new Error('Approve the reviewed design before downloading.');
 const review=validateReview(pack.review);if(!review.ready)throw new Error('Resolve the quality-review issues before downloading.');
 const file=await exportMaterial(format,pack);
 return new Response(new Uint8Array(file.bytes),{headers:{'Content-Type':file.mime,'Content-Disposition':`attachment; filename="sparklab-${file.filename}"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }catch(e){return Response.json({error:e.message||'Export failed.'},{status:400});}}
