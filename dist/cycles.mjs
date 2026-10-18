const cycleKey = 'ouer-completed-cycles-v1';
export class CompletedCycles {
 constructor(storage) { this.storage=storage; this.total=0; this.visit=0; this.saved=true; this.counted=new WeakSet(); this.read(); }
 read() {
   try { const value = Number(this.storage.getItem(cycleKey)); if(Number.isSafeInteger(value)&&value>=0) this.total=Math.max(this.total,value); }
   catch { this.saved=false; }
 }
 record(timer) {
   if(!timer || timer.status!=='done' || this.counted.has(timer)) return false;
   this.counted.add(timer); this.read(); this.total++; this.visit++;
   try { this.storage.setItem(cycleKey,String(this.total)); this.saved=true; } catch { this.saved=false; }
   return true;
 }
}
