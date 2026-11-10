import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateBrief,demoActivity,exportPack} from '../lib/workflow.mjs';
test('rejects empty and oversized brief fields',()=>{assert.throws(()=>validateBrief({topic:''}));assert.throws(()=>validateBrief({topic:'UDL',context:'a'.repeat(2001)}));});
test('demo does not fabricate research and exports a complete pack',()=>{const b=validateBrief({topic:'Inclusive learning',objectives:'Identify participation barriers'});const a=demoActivity(b);assert.equal(a.sourceIds.length,0);assert.equal(a.steps.length,5);assert.equal(a.review.length,5);const p=exportPack(a,b,[],'demo');for(const t of ['DEMONSTRATION','No sources retrieved','Participant','Materials','UDL','Quality review'])assert.ok(p.includes(t));});
