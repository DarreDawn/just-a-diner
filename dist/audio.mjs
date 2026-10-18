import { LibraryAmbience } from './library.mjs';
export class Soundscape {
 constructor() { this.ctx = null; this.nodes = []; this.mode = ''; this.beat = null; this.options = {}; this.library = null; this.message = ''; this.unlockFailed = false; }
 async unlock() {
   try { this.ctx ||= new (window.AudioContext || window.webkitAudioContext)(); if (!this.master) { this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination); } await this.ctx.resume(); return this.ctx.state === 'running'; } catch { return false; }
 }
 configure(options) { this.options = options; this.library?.setVoices(options.voices !== false); if (this.master) this.master.gain.setTargetAtTime(options.muted ? 0 : options.volume / 100 * .5, this.ctx.currentTime, .08); }
 note(freq, at, duration, strength = .1, type = 'sine', output = this.master) {
   const osc = this.ctx.createOscillator(), gain = this.ctx.createGain(); osc.type = type; osc.frequency.value = freq;
   gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(strength, at + .025); gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
   osc.connect(gain); gain.connect(output); osc.start(at); osc.stop(at + duration + .05); osc.onended = () => { osc.disconnect(); gain.disconnect(); };
 }
 chime(ending = false) { if (!this.ctx || this.ctx.state !== 'running' || this.options.muted) return; const at = this.ctx.currentTime; [ending ? 523.25 : 659.25, ending ? 659.25 : 783.99].forEach((f, i) => this.note(f, at + i * .17, .8, .17)); }
 setMode(mode) {
   const desired = this.options.muted ? '' : mode === 'focus' && this.options.noise ? (this.options.scene === 'library' ? (this.options.demo ? 'library-demo' : 'library') : 'noise') : mode === 'checkpoint' && this.options.jazz ? 'jazz' : '';
   if (desired === this.mode) return; this.stop(); this.mode = desired;
   if (!this.ctx || this.ctx.state !== 'running') { this.mode = ''; return; }
   if (desired === 'library' || desired === 'library-demo') {
     this.library ||= new LibraryAmbience(this.ctx, this.master, message => { this.message = message; });
     this.library.start({voices:this.options.voices !== false,demo:desired === 'library-demo'}).catch(()=>{this.message='图书馆音效暂时无法播放，请切换白噪音。';});
   }
   if (desired === 'noise') {
     const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 4, this.ctx.sampleRate), data = buffer.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
     const source = this.ctx.createBufferSource(), filter = this.ctx.createBiquadFilter(), gain = this.ctx.createGain(); filter.type = 'lowpass'; filter.frequency.value = 1400; gain.gain.setValueAtTime(0, this.ctx.currentTime); gain.gain.linearRampToValueAtTime(.22, this.ctx.currentTime + .7);
     source.buffer = buffer; source.loop = true; source.connect(filter); filter.connect(gain); gain.connect(this.master); source.start(); this.nodes = [source, filter, gain];
   }
   if (desired === 'jazz') {
     const bus = this.ctx.createGain(); bus.gain.value = .75; bus.connect(this.master); this.nodes = [bus];
     const chords = [[130.81,164.81,196,246.94],[110,130.81,164.81,196],[146.83,174.61,220,261.63],[98,123.47,146.83,207.65]]; let bar = 0;
     const play = () => { if(this.ctx.state !== 'running') return; const at = this.ctx.currentTime, chord = chords[bar++ % chords.length]; chord.forEach((f,i) => this.note(f * 2, at + i * .045, 2.9, .06, 'sine', bus)); this.note(chord[0] / 2, at, 1.1, .16, 'sine', bus); this.note(chord[2] / 2, at + 1.55, 1, .12, 'sine', bus); this.note(chord[2] * 2, at + .98, .8, .045, 'triangle', bus); this.note(chord[1] * 2, at + 2.35, .7, .035, 'triangle', bus); };
     play(); this.beat = setInterval(play, 3200);
   }
 }
 stop() { this.library?.stop(); clearInterval(this.beat); this.beat = null; for(const n of this.nodes) { try { n.stop?.(); n.disconnect(); } catch {} } this.nodes = []; this.mode = ''; }
}
