import assert from 'node:assert/strict';
import { pools } from '../dist/prompts.mjs';
import { EncouragementPicker, compliments } from '../dist/encouragement.mjs';
import { CompletedCycles } from '../dist/cycles.mjs';
import { SessionTimer } from '../dist/timer.mjs';
const praise = new EncouragementPicker(()=>0);
for(const [type,texts] of Object.entries(pools)) {
 assert.equal(compliments[type].length,texts.length);
 for(const text of texts) {
  const results=[0,30,60].map(m=>praise.next({type,text},m*60000,90*60000));
  assert.deepEqual(results.map(r=>r.stage),[0,1,2]);
  assert.equal(new Set(results.map(r=>r.text)).size,3);
  for(const result of results) {assert.ok(result.text.length>10);assert.ok(!result.text.includes('undefined'));}
 }
}
assert.equal(praise.next({type:'rest',text:pools.rest[0]},20000,60000).stage,1);
assert.equal(praise.next({type:'rest',text:pools.rest[0]},40000,60000).stage,2);
const values=new Map(); const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
const completed=new CompletedCycles(storage);
const t=new SessionTimer({total:1,min:.1,max:.1,checkpoint:5},()=>0);t.start(0);
assert.equal(completed.record(t),false);t.pause(1000);assert.equal(completed.record(t),false);t.resume(11000);
t.tick(60999);assert.equal(completed.record(t),false);t.tick(70000);
for(let i=0;i<100;i++)completed.record(t);
assert.equal(completed.total,1);assert.equal(completed.visit,1);
const reload=new CompletedCycles(storage);assert.equal(reload.total,1);assert.equal(reload.visit,0);
const second=new SessionTimer({total:1,min:.1,max:.1,checkpoint:5});second.start(0);
// Completion can happen inside pause(), consuming tick's event before the UI renders.
second.pause(60000);assert.equal(second.status,'done');assert.equal(reload.record(second),true);assert.equal(reload.total,2);
const interrupted=new SessionTimer({total:1,min:.1,max:.1,checkpoint:5});interrupted.start(0);interrupted.tick(1000);assert.equal(reload.record(interrupted),false);
const blocked=new CompletedCycles({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});blocked.record(second);blocked.record(second);assert.equal(blocked.total,1);assert.equal(blocked.saved,false);
values.set('ouer-completed-cycles-v1','broken');assert.equal(new CompletedCycles(storage).total,0);
console.log('PASS: all 90 prompts have contextual praise at 3 time stages; stages scale with session length; pauses and incomplete sessions do not count; completion counts once; reload retains totals; unavailable storage has an honest fallback.');
