import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {LibraryAmbience,randomDelay,libraryTiming} from '../dist/library.mjs';
import {libraryAssets} from '../dist/library-assets.mjs';
import {Soundscape} from '../dist/audio.mjs';
let timerId=0;const tasks=new Map();
globalThis.setTimeout=(fn,delay)=>{const id=++timerId;tasks.set(id,{fn,delay});return id;};
globalThis.clearTimeout=id=>tasks.delete(id);
globalThis.setInterval=globalThis.setTimeout;globalThis.clearInterval=globalThis.clearTimeout;
function param(){return {value:0,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;},cancelScheduledValues(){}};}
function node(){return {gain:param(),frequency:param(),pan:param(),playbackRate:param(),connect(){},disconnect(){this.disconnected=true;},start(){this.started=true;},stop(){this.stopped=true;}};}
class AudioContext {
 constructor(){this.state='running';this.currentTime=0;this.sampleRate=8000;this.destination=node();this.sources=[];}
 resume(){return Promise.resolve();}createGain(){return node();}createBiquadFilter(){return node();}createStereoPanner(){return node();}createOscillator(){return node();}
 createBufferSource(){const n=node();this.sources.push(n);return n;}
 createBuffer(channels,length){return {getChannelData(){return new Float32Array(length);}};}
 async decodeAudioData(bytes){const b=Buffer.from(bytes);assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WAVE');assert.equal(b.readUInt16LE(22),1);assert.equal(b.readUInt32LE(24),24000);return {duration:b.readUInt32LE(40)/48000};}
}
globalThis.window={AudioContext};
globalThis.fetch=async url=>{const data=await readFile(new URL('../dist/'+url,import.meta.url));return {ok:true,arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)};};
for(const [kind,[low,high]] of Object.entries(libraryTiming)){assert.equal(randomDelay(kind,()=>0),low*1000);assert.ok(randomDelay(kind,()=>.999999)<high*1000);}
const ctx=new AudioContext(),library=new LibraryAmbience(ctx,node());
await library.start({demo:true});assert.equal(library.buffers.size,9);assert.equal(library.tasks.size,4);
assert.equal(library.play('page'),true);const previous=library.last.page;[...library.clips][0].source.onended();assert.equal(library.play('page'),true);assert.notEqual(library.last.page,previous);
assert.equal(library.play('cup'),true);assert.equal(library.play('voice'),false,'Maximum two simultaneous events');
for(const clip of [...library.clips])clip.source.onended();
library.setVoices(false);assert.equal(library.play('voice'),false);library.setVoices(true);assert.equal(library.play('voice'),true);
const playingVoice=[...library.clips][0];library.setVoices(false);assert.equal(playingVoice.source.stopped,true);
const stale=[...library.tasks].map(id=>tasks.get(id).fn);library.stop();const sourceCount=ctx.sources.length;stale.forEach(fn=>fn());assert.equal(ctx.sources.length,sourceCount,'Stopped schedules must not play');assert.equal(library.tasks.size,0);
// Stopping during decoding must not resurrect playback or scheduled events.
const pending=new LibraryAmbience(ctx,node());let finish;pending.load=()=>new Promise(resolve=>{finish=resolve;});const starting=pending.start();pending.stop();finish();await starting;assert.equal(pending.tasks.size,0);assert.equal(pending.active,false);
// A missing recording is isolated; the remaining assets are available.
const originalFetch=fetch;globalThis.fetch=async url=>url.includes('page-1')?{ok:false}:originalFetch(url);let report='';const partial=new LibraryAmbience(ctx,node(),s=>report=s);await partial.start();assert.equal(partial.buffers.size,8);assert.match(report,/1 段/);partial.stop();globalThis.fetch=originalFetch;
// Focus/checkpoint/pause/mute switch the actual sound engine, independent of timer state.
const sound=new Soundscape();await sound.unlock();sound.configure({noise:true,scene:'library',voices:true,jazz:true,volume:35});sound.setMode('focus');assert.equal(sound.mode,'library');sound.setMode('checkpoint');assert.equal(sound.mode,'jazz');assert.equal(sound.library.active,false);sound.setMode('');assert.equal(sound.mode,'');sound.configure({...sound.options,muted:true});sound.setMode('focus');assert.equal(sound.mode,'');
console.log('PASS: 9 valid WAV recordings, bounded randomized delays, no immediate page repeat, overlap limit, human-voice off, cancellation on pause/change, stale loading cannot restart, missing-file fallback, focus/checkpoint/mute switching.');
