import assert from 'node:assert/strict';
import {SessionTimer} from '../dist/timer.mjs';
import {PromptPicker,pools} from '../dist/prompts.mjs';
let draws=0;
const s={total:90,min:8,max:15,checkpoint:20};
const t=new SessionTimer(s,()=>{draws++;return .5;});
t.start(0); assert.equal(draws,1); assert.equal(t.boundary,690000);
t.tick(690000);assert.equal(t.phase,'checkpoint');assert.equal(draws,1);assert.equal(t.checkpointRemaining(690000),20000);
t.pause(695000);t.resume(705000);assert.equal(t.checkpointRemaining(705000),15000);assert.equal(t.end,5410000);
t.tick(720000);assert.equal(t.phase,'focus');assert.equal(draws,2);assert.equal(t.boundary,1410000);
t.tick(1410000);assert.equal(t.phase,'checkpoint');assert.equal(draws,2);
t.tick(1430000);assert.equal(draws,3);
t.tick(5410000);assert.equal(t.status,'done');assert.equal(t.remaining(9999999),0);
const delayed=new SessionTimer(s,()=>0);delayed.start(0);delayed.tick(1500000);assert.equal(delayed.phase,'focus');assert.equal(delayed.count,3);assert.equal(delayed.boundary,1980000);
const nearEnd=new SessionTimer({total:1,min:.9,max:.9,checkpoint:20});nearEnd.start(0);nearEnd.tick(54000);assert.equal(nearEnd.checkpointRemaining(54000),6000);nearEnd.tick(60000);assert.equal(nearEnd.status,'done');
for(const r of [0,.999999]){const b=new SessionTimer(s,()=>r);b.start(0);assert.ok(b.boundary>=480000&&b.boundary<=900000);}
const p=new PromptPicker();let recent=[];let types=new Set();for(let i=0;i<20000;i++){let value=p.next();assert.ok(value.text);assert.ok(!recent.includes(value.text));types.add(value.type);recent.push(value.text);if(recent.length>24)recent.shift();}assert.equal(types.size,3);assert.equal(Object.values(pools).flat().length,90);
const constant=new PromptPicker(()=>0);for(let i=0;i<100;i++)assert.ok(constant.next().text);
console.log('PASS: fresh random intervals, automatic transitions, checkpoint pause/resume, delayed updates, session cutoff, interval bounds, 90 prompts and 24-prompt non-repetition.');
