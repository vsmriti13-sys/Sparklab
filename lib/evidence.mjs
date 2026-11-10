import {createHmac,timingSafeEqual} from 'node:crypto';
function sign(value,key){return createHmac('sha256',key).update(value).digest('hex');}
export function sealEvidence(topic,sources,key){const payload=Buffer.from(JSON.stringify({topic,sources,expires:Date.now()+30*60*1000})).toString('base64url');return `${payload}.${sign(payload,key)}`;}
export function openEvidence(token,topic,key){
 if(typeof token!=='string'||token.length>40000)throw new Error('Research evidence is missing. Restart the workflow.');
 const [payload,signature]=token.split('.');const expected=sign(payload,key);
 if(!signature||signature.length!==expected.length||!timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))throw new Error('Research evidence is invalid. Restart the workflow.');
 const data=JSON.parse(Buffer.from(payload,'base64url').toString());
 if(data.topic!==topic||data.expires<Date.now())throw new Error('Research evidence has expired or the topic changed. Restart the workflow.');
 return data.sources;
}
