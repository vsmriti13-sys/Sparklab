import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sealEvidence,openEvidence} from '../lib/evidence.mjs';
test('research evidence cannot be changed, reused for another topic, or opened with another key',()=>{const token=sealEvidence('UDL',[{id:'S1'}],'test-key');assert.deepEqual(openEvidence(token,'UDL','test-key'),[{id:'S1'}]);assert.throws(()=>openEvidence(token,'AI','test-key'));assert.throws(()=>openEvidence(token,'UDL','other-key'));assert.throws(()=>openEvidence(token+'x','UDL','test-key'));});
