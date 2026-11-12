import {createHmac,timingSafeEqual} from 'node:crypto';
export function sealBundle(kind,data,key){const payload=Buffer.from(JSON.stringify({kind,data,expires:Date.now()+2*60*60*1000})).toString('base64url');return payload+'.'+createHmac('sha256',key).update(payload).digest('hex');}
export function openBundle(token,kind,key){
 if(typeof token!=='string'||token.length>350000)throw new Error('Saved workflow evidence is missing or too large. Repeat the relevant stage.');
 const [payload,sig,...rest]=token.split('.');const expected=createHmac('sha256',key).update(payload).digest('hex');
 if(rest.length||!sig||sig.length!==expected.length||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))throw new Error('Workflow evidence was changed. Repeat the relevant stage.');
 const value=JSON.parse(Buffer.from(payload,'base64url').toString());if(value.kind!==kind||value.expires<Date.now())throw new Error('Workflow evidence expired. Repeat the relevant stage.');return value.data;
}
