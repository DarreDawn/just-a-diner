import { libraryAssets } from './library-assets.mjs';
export const libraryTiming = {page:[25,80],cup:[120,300],voice:[180,420],charge:[300,720]};
export function randomDelay(kind, random = Math.random) { const [min,max]=libraryTiming[kind]; return (min+random()*(max-min))*1000; }
export class LibraryAmbience {
 constructor(ctx, master, report = ()=>{}) { this.ctx=ctx;this.master=master;this.report=report;this.buffers=new Map();this.tasks=new Set();this.clips=new Set();this.last={};this.generation=0;this.active=false;this.voices=true;this.loading=null; }
 async load() {
  if(this.loading)return this.loading;
  this.report('正在准备图书馆音效…');
  this.loading=Promise.all(libraryAssets.map(async asset=>{
   if(this.buffers.has(asset.id))return;
   try {
    let bytes;
    if(asset.url.startsWith('data:')) { const raw=atob(asset.url.split(',')[1]);bytes=Uint8Array.from(raw,c=>c.charCodeAt(0)).buffer; }
    else { const response=await fetch(asset.url);if(!response.ok)throw Error('Audio unavailable');bytes=await response.arrayBuffer(); }
    const buffer=await this.ctx.decodeAudioData(bytes);this.buffers.set(asset.id,{...asset,buffer});
   } catch { /* One failed recording must not stop the other sounds or session. */ }
  })).then(()=>{const missing=libraryAssets.length-this.buffers.size;this.report(missing?`有 ${missing} 段音效未能加载，其余声音照常播放。`:'');this.loading=null;});
  return this.loading;
 }
 later(fn, delay, generation=this.generation) { const task=setTimeout(()=>{this.tasks.delete(task);if(this.active&&generation===this.generation)fn();},delay);this.tasks.add(task); }
 async start({voices=true,demo=false}={}) {
  this.stop();this.active=true;this.voices=voices;const generation=this.generation;
  const bus=this.ctx.createGain();bus.gain.setValueAtTime(0,this.ctx.currentTime);bus.gain.linearRampToValueAtTime(1,this.ctx.currentTime+.6);bus.connect(this.master);this.bus=bus;
  this.startRoom();
  await this.load();if(!this.active||generation!==this.generation)return;
  if(demo) { [['page',600],['cup',3500],['voice',6500],['charge',12000]].forEach(([kind,at])=>this.later(()=>this.play(kind),at,generation)); }
  else { const initial={page:[8000,20000],cup:[40000,90000],voice:[70000,150000],charge:[90000,180000]};for(const kind of Object.keys(libraryTiming)){const [a,b]=initial[kind];this.schedule(kind,a+Math.random()*(b-a),generation);} }
 }
 startRoom() {
  const ctx=this.ctx, buffer=ctx.createBuffer(1,ctx.sampleRate*8,ctx.sampleRate),data=buffer.getChannelData(0);let brown=0;
  for(let i=0;i<data.length;i++){brown=(brown+.035*(Math.random()*2-1))/1.035;data[i]=brown*2;}
  // Smooth the loop seam rather than repeatedly starting a new noise source.
  const edge=1024;for(let i=0;i<edge;i++){const mix=i/edge;data[data.length-edge+i]=data[data.length-edge+i]*(1-mix)+data[0]*mix;}
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=1100;gain.gain.value=.25;
  source.connect(filter);filter.connect(gain);gain.connect(this.bus);source.start();
  const lfo=ctx.createOscillator(),depth=ctx.createGain();lfo.frequency.value=.043;depth.gain.value=.025;lfo.connect(depth);depth.connect(gain.gain);lfo.start();
  this.room=[source,filter,gain,lfo,depth];
 }
 schedule(kind, delay, generation) { this.later(()=>{this.play(kind);this.schedule(kind,randomDelay(kind),generation);},delay,generation); }
 setVoices(enabled) {if(this.voices===enabled)return;this.voices=enabled;if(!enabled)for(const clip of [...this.clips])if(clip.kind==='voice')this.endClip(clip);}
 play(kind) {
  if(!this.active||this.ctx.state!=='running'||this.clips.size>=2||(kind==='voice'&&!this.voices))return false;
  const ctx=this.ctx,at=ctx.currentTime;
  if(kind==='charge') {
   const gain=ctx.createGain();gain.gain.value=.07;gain.connect(this.bus);const oscillators=[];
   for(const [i,f] of [440,554.37].entries()){const osc=ctx.createOscillator(),env=ctx.createGain();osc.type='sine';osc.frequency.value=f;env.gain.setValueAtTime(0,at+i*.16);env.gain.linearRampToValueAtTime(.4,at+i*.16+.025);env.gain.exponentialRampToValueAtTime(.0001,at+i*.16+.4);osc.connect(env);env.connect(gain);osc.start(at+i*.16);osc.stop(at+i*.16+.45);oscillators.push(osc,env);}
   const clip={kind,gain,nodes:oscillators};this.clips.add(clip);this.later(()=>{for(const n of oscillators)n.disconnect();gain.disconnect();this.clips.delete(clip);},800);return true;
  }
  const all=[...this.buffers.values()].filter(a=>a.kind===kind);let candidates=all.filter(a=>a.id!==this.last[kind]);if(!candidates.length)candidates=all;if(!candidates.length)return false;
  const asset=candidates[Math.floor(Math.random()*candidates.length)];this.last[kind]=asset.id;
  const source=ctx.createBufferSource(),gain=ctx.createGain(),pan=ctx.createStereoPanner?.(),filter=ctx.createBiquadFilter();source.buffer=asset.buffer;source.playbackRate.value=.97+Math.random()*.06;
  filter.type='lowpass';filter.frequency.value={page:4000,cup:2600,voice:750}[kind];
  const duration=asset.buffer.duration/source.playbackRate.value,fade=Math.min(kind==='voice'?.6:.04,duration/4),level={page:.28,cup:.16,voice:.25}[kind]*(.8+Math.random()*.3);
  gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(level,at+fade);gain.gain.setValueAtTime(level,at+duration-fade);gain.gain.linearRampToValueAtTime(0,at+duration);
  source.connect(filter);filter.connect(gain);if(pan){pan.pan.value=(Math.random()-.5)*.9;gain.connect(pan);pan.connect(this.bus);}else gain.connect(this.bus);
  const clip={kind,gain,source,nodes:[source,filter,...(pan?[pan]:[])]};this.clips.add(clip);source.onended=()=>{for(const n of clip.nodes)n.disconnect();gain.disconnect();this.clips.delete(clip);};source.start(at);return true;
 }
 endClip(clip) {const at=this.ctx.currentTime;clip.gain.gain.cancelScheduledValues(at);clip.gain.gain.setTargetAtTime(0,at,.04);try{clip.source?.stop(at+.2);}catch{}}
 stop() {
  this.active=false;this.generation++;for(const task of this.tasks)clearTimeout(task);this.tasks.clear();
  const bus=this.bus,room=this.room||[],clips=[...this.clips];this.bus=null;this.room=[];this.clips.clear();
  if(!bus)return;const at=this.ctx.currentTime;bus.gain.cancelScheduledValues(at);bus.gain.setTargetAtTime(0,at,.06);
  for(const n of room)try{n.stop?.(at+.3);}catch{};for(const c of clips)this.endClip(c);
  setTimeout(()=>{for(const n of room)n.disconnect();for(const c of clips){for(const n of c.nodes)n.disconnect();c.gain.disconnect();}bus.disconnect();},350);
 }
}
