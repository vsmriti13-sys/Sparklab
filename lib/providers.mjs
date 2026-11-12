// Server-side provider boundary: add another provider here without changing the UI.
const apiRoot='https://generativelanguage.googleapis.com/v1beta';
export function normalizeModel(value) {
 const model=(value || 'gemini-2.5-flash').trim().replace(/^models\//,'');
 if(!/^[a-zA-Z0-9._-]+$/.test(model))throw new Error('GEMINI_MODEL must be a model ID, not a URL. Update it in Vercel Environment Variables and redeploy.');
 return model;
}
function providerError(status,stage) {
 if(status===400||status===401||status===403)return new Error(`Gemini ${stage} was rejected (${status}). Check the server API key, its API restrictions, and regional availability in Google AI Studio.`);
 if(status===429)return new Error('Gemini usage limit reached (429). Check your free-tier quota in Google AI Studio and try again later.');
 if(status===404)return new Error('The configured Gemini model is unavailable (404). No compatible stable Flash model could be selected. Check model access in Google AI Studio, update GEMINI_MODEL in Vercel, and redeploy.');
 return new Error(`Gemini ${stage} failed (${status}). Please try again later.`);
}
export async function requestGeneration(payload, model, timeout) {
 const signal=AbortSignal.timeout(timeout);
 const send=id=>fetch(`${apiRoot}/models/${encodeURIComponent(id)}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},signal,body:JSON.stringify({...payload,generationConfig:{...payload.generationConfig,...(/^gemini-2\.5-flash(?:-lite)?$/.test(id)?{thinkingConfig:{thinkingBudget:0}}:{})}})});
 let response=await send(model);
 if(response.status===404){
  // Ask the authenticated API which stable Flash models actually support this method.
  const listed=await fetch(`${apiRoot}/models?pageSize=1000`,{headers:{'x-goog-api-key':process.env.GEMINI_API_KEY},signal});
  if(!listed.ok)throw providerError(listed.status,'model discovery');
  const data=await listed.json();
  const candidates=(data.models||[]).filter(m=>/^models\/gemini-[0-9.]+-flash(?:-lite)?$/.test(m.name)&&m.supportedGenerationMethods?.includes('generateContent')&&m.name!==`models/${model}`).sort((a,b)=>a.name.includes('lite')-b.name.includes('lite')||b.name.localeCompare(a.name,undefined,{numeric:true}));
  if(!candidates.length)throw providerError(404,'model discovery');
  model=normalizeModel(candidates[0].name);
  response=await send(model);
 }
 if(!response.ok)throw providerError(response.status,'generation');
 return {response,model};
}
