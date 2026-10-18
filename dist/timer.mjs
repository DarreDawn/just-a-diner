export class SessionTimer {
  constructor(settings, random = Math.random) { this.s = settings; this.random = random; this.status = 'idle'; this.phase = 'focus'; this.count = 0; }
  interval() { return (this.s.min + this.random() * (this.s.max - this.s.min)) * 60000; }
  start(now) { this.status = 'running'; this.phase = 'focus'; this.count = 0; this.started = now; this.end = now + this.s.total * 60000; this.boundary = now + this.interval(); }
  tick(now) {
    if (this.status !== 'running') return [];
    const events = [];
    if (now >= this.end) { this.status = 'done'; events.push('done'); return events; }
    while (now >= this.boundary) {
      if (this.phase === 'focus') { this.phase = 'checkpoint'; this.count++; this.boundary += this.s.checkpoint * 1000; events.push('checkpoint'); }
      else { this.phase = 'focus'; this.boundary += this.interval(); events.push('focus'); }
    }
    return events;
  }
  pause(now) { this.tick(now); if (this.status === 'running') { this.status = 'paused'; this.pausedAt = now; } }
  resume(now) { if (this.status === 'paused') { const gap = now - this.pausedAt; this.end += gap; this.boundary += gap; this.status = 'running'; } }
  remaining(now) { return this.status === 'done' ? 0 : Math.max(0, this.end - (this.status === 'paused' ? this.pausedAt : now)); }
  checkpointRemaining(now) { return Math.max(0, Math.min(this.boundary, this.end) - (this.status === 'paused' ? this.pausedAt : now)); }
}
