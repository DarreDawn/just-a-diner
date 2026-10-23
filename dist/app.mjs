import { SessionTimer } from './timer.mjs';
import { PromptPicker } from './prompts.mjs';
import { Soundscape } from './audio.mjs';
import { DishPicker, dishSvg } from './menu.mjs';
import { EncouragementPicker } from './encouragement.mjs';
import { CompletedCycles } from './cycles.mjs';
const $ = id => document.getElementById(id);
const defaults = { total:90, min:8, max:15, checkpoint:20, noise:false, jazz:false, muted:false, volume:35, scene:'library', voices:true };
let settings = {...defaults};
try { const saved = JSON.parse(localStorage.getItem('ouer-settings-v1')); if (saved && typeof saved === 'object') settings = {...settings,...saved}; } catch {}
const limits = {total:[1,480], min:[.1,240], max:[.1,240], checkpoint:[5,300], volume:[0,100]};
for(const [key,[min,max]] of Object.entries(limits)) if (!Number.isFinite(settings[key]) || settings[key] < min || settings[key] > max) settings[key] = defaults[key];
for(const key of ['total','checkpoint']) if (!Number.isInteger(settings[key])) settings[key] = defaults[key];
for(const key of ['noise','jazz','muted','voices']) settings[key] = settings[key] === true;
if(settings.min > settings.max) { settings.min = 8; settings.max = 15; }
if (!['noise','library'].includes(settings.scene)) settings.scene = 'library';
const ids = { total:'total', min:'min', max:'max', checkpoint:'duration' };
for(const [key,id] of Object.entries(ids)) $(id).value = settings[key];
$('volume').value = settings.volume;
$('sound-scene').value = settings.scene;
let previewing = false, previewTimeout = null;
function stopPreview() { previewing=false;clearTimeout(previewTimeout);previewTimeout=null; }
let timer = null, prompt = null, lastPhase = '', wakeLock = null;
let breakTimer = null;

function getLongBreakMinutes() {
  const focusMinutes = timer?.s.total ?? settings.total;
  return Math.max(1, Math.round((focusMinutes / 90) * 20));
}

function activeClock() {
  return breakTimer || timer;
}

function beginSession(at, changeDish = false) {
  timer = new SessionTimer({...settings});
  timer.start(at);
  breakTimer = null;
  prompt = null;
  lastPhase = '';

  if (changeDish) nextDish();
}

function advanceCycles(now) {
  const events = [];

  while (timer) {
    if (!breakTimer) {
      events.push(...timer.tick(now));

      if (timer.status !== 'done') break;

      // 每个已完成的专注轮次只统计一次。
      completed.record(timer);

      // 长休息复用计时器；240 分钟间隔确保休息中不触发 checkpoint。
      breakTimer = new SessionTimer({
        total: getLongBreakMinutes(),
        min: 240,
        max: 240,
        checkpoint: 20
      });

      // 使用实际结束时间，避免页面延迟更新导致休息被延长。
      breakTimer.start(timer.end);
      events.push('long-break');
    }

    breakTimer.tick(now);

    if (breakTimer.status !== 'done') break;

    const nextStart = breakTimer.end;
    beginSession(nextStart, true);
    events.push('next-session');
  }

  return events;
}


const picker = new PromptPicker(), audio = new Soundscape(), dishes = new DishPicker();
const encouragement = new EncouragementPicker();
let cycleStorage;
try { cycleStorage = localStorage; } catch {}
const completed = new CompletedCycles(cycleStorage);
let currentDish;
function nextDish() { currentDish = dishes.next(); $('dish-art').innerHTML = dishSvg(currentDish); $('dish-name').textContent = currentDish.name; $('dish-description').textContent = currentDish.desc; $('dish-tag').textContent = currentDish.tag; $('order-dish-name').textContent = currentDish.name; $('order-dish-en').textContent = currentDish.en; }
const animations = ['rise','scale','tilt','float','fade','spark']; let lastAnimation = '';
function save() { try { localStorage.setItem('ouer-settings-v1',JSON.stringify(settings)); } catch { $('saved-note').textContent = '浏览器未允许保存设置，本次仍可正常使用'; } }
function format(ms) { const s = Math.ceil(ms / 1000); return `${String(Math.floor(s/60)).padStart(2,'0')}<span>:</span>${String(s%60).padStart(2,'0')}`; }
function sounds() {
 audio.configure({...settings,noise:previewing||settings.noise,demo:previewing});
 const clock = activeClock();

audio.setMode(
  clock?.status === 'running'
    ? (breakTimer ? 'checkpoint' : timer.phase)
    : previewing ? 'focus' : ''
);


 $('mute').setAttribute('aria-pressed',String(settings.muted)); $('mute').setAttribute('aria-label',settings.muted ? '取消静音' : '静音所有声音');
 for(const key of ['noise','jazz','voices']) $(key).setAttribute('aria-checked',String(settings[key]));
 $('volume-value').textContent=settings.volume+'%';
 $('noise-label').textContent=settings.scene==='library'?'图书馆声景':'柔和白噪音';
 $('voice-row').hidden=settings.scene!=='library';
 $('audio-preview').textContent=previewing?'停止试听':'试听 15 秒';
 $('audio-preview').disabled = !!timer;
 $('audio-message').textContent=audio.unlockFailed?'当前浏览器暂时无法播放声音，计时仍会正常运行。':settings.muted?'所有声音已静音。':settings.scene==='library'?audio.message:'';
}
async function unlock() { const ok=await audio.unlock(); audio.unlockFailed=!ok;sounds();return ok; }
async function keepAwake() {
  if (
    'wakeLock' in navigator &&
    document.visibilityState === 'visible' &&
    activeClock()?.status === 'running'
  ) {
    try {
      if (!wakeLock || wakeLock.released) {
        wakeLock = await navigator.wakeLock.request('screen');
      }
    } catch {}
  }
}
function releaseWake() { wakeLock?.release().catch(()=>{}); wakeLock = null; }
function readForm() { const next = {...settings}; for(const [key,id] of Object.entries(ids)) next[key] = Number($(id).value); const valid = Object.entries(ids).every(([key,id]) => $(id).validity.valid && Number.isFinite(next[key])); if (!valid) return null; if(next.min > next.max) { $('form-error').textContent = '最小间隔不能大于最大间隔。'; return null; } $('form-error').textContent = ''; return next; }
function updatePresets() { document.querySelectorAll('[data-minutes]').forEach(b => b.classList.toggle('selected',Number(b.dataset.minutes) === Number($('total').value))); }
function syncForm() { const next = readForm(); if(next) { settings = next; save(); if(!timer) $('total-time').innerHTML = format(settings.total*60000); } updatePresets(); }
for(const id of Object.values(ids)) $(id).addEventListener('input',syncForm);
for(const b of document.querySelectorAll('[data-minutes]')) b.addEventListener('click',()=>{ $('total').value=b.dataset.minutes; syncForm(); });

$('settings').addEventListener('submit', e => {
  e.preventDefault();

  const next = readForm();
  if (!next) return;

  settings = next;
  save();
  stopPreview();

  beginSession(Date.now());
  unlock();
  keepAwake();
  render();
  $('pause').focus();
});

$('pause').addEventListener('click', () => {
  if (!timer) return;

  const now = Date.now();

  // 先处理刚好到达轮次结束的情况，再暂停当前阶段。
  advanceCycles(now);

  const clock = activeClock();

  if (clock.status === 'paused') {
    clock.resume(now);
    unlock();
    keepAwake();
  } else {
    clock.pause(now);
    releaseWake();
  }

  render();
});

$('reset').addEventListener('click', () => {
  if (!timer) return;

  advanceCycles(Date.now());

  if (breakTimer) {
    // 长休息期间直接退出，不再开始下一轮。
    reset();
  } else {
    $('reset-dialog').showModal();
  }
});

$('cancel-reset').addEventListener('click',()=>$('reset-dialog').close());
$('confirm-reset').addEventListener('click',()=>{ $('reset-dialog').close();reset(); });

function reset() {
  stopPreview();
  timer = null;
  breakTimer = null;
  prompt = null;
  lastPhase = '';

  audio.stop();
  releaseWake();
  nextDish();
  render();
  $('total').focus();
}
$('mute').addEventListener('click',()=>{settings.muted=!settings.muted;save();unlock();sounds();});
for(const key of ['noise','jazz','voices']) $(key).addEventListener('click',()=>{settings[key]=!settings[key];save();unlock();sounds();});
$('volume').addEventListener('input',()=>{settings.volume=Number($('volume').value);save();sounds();});
$('sound-scene').addEventListener('change',()=>{stopPreview();settings.scene=$('sound-scene').value;settings.noise=true;save();unlock();sounds();});

$('audio-preview').addEventListener('click', async () => {
  if (previewing) {
    stopPreview();
    sounds();
    return;
  }

  if (timer) return;

  const ok = await unlock();
  if (!ok || timer) return;

  settings.muted = false;
  save();
  previewing = true;
  sounds();

  previewTimeout = setTimeout(() => {
    stopPreview();
    sounds();
  }, 15000);
});
function newPrompt(now) { prompt = picker.next(); const elapsed = timer.s.total * 60000 - timer.remaining(now); const praise = encouragement.next(prompt, elapsed, timer.s.total * 60000); $('cycle-number').textContent = `第 ${timer.count} 个小循环 · 本轮已进行 ${Math.floor(elapsed / 60000)} 分 ${Math.floor(elapsed / 1000) % 60} 秒`; $('checkpoint-praise').textContent = praise.text; const candidates = animations.filter(a=>a!==lastAnimation); lastAnimation = candidates[Math.floor(Math.random()*candidates.length)]; $('prompt').className=''; $('prompt').textContent=prompt.text; requestAnimationFrame(()=>$('prompt').className='anim-'+lastAnimation); $('prompt-kind').textContent={rest:'小菜 A · 眼睛先离席',reflect:'小菜 B · 脑子试个味',surprise:'小菜 C · 后厨不明赠品'}[prompt.type]; }

function render() {
  const now = Date.now();
  const events = advanceCycles(now);

  const active = !!timer;
  const resting = !!breakTimer;
  const clock = activeClock();
  const paused = clock?.status === 'paused';
  const cp = active && !resting && timer.phase === 'checkpoint';
  const focusing = active && !resting && !cp;

  const phase = !active
    ? 'idle'
    : resting
      ? 'long-break'
      : timer.phase;

  // 长休息时显示刚完成的轮次；退出后仍能看到累计成绩。
  const showSummary = resting || (!active && completed.visit > 0);
  $('completion-summary').hidden = !showSummary;

  if (showSummary) {
    $('completed-total').textContent =
      `一共完成了 ${completed.total} 次大循环`;

    $('completed-detail').textContent = resting
      ? `本次打开完成 ${completed.visit} 次 · 刚完成 ${timer.s.total} 分钟，遇到 ${timer.count} 次 checkpoint。现在后厨休息。`
      : `本次打开完成 ${completed.visit} 次。已退出连续用餐，可以重新设置下一单。`;

    $('completed-storage').textContent = completed.saved
      ? '只统计完整完成的专注轮次；长休息不计入大循环。'
      : '暂时无法保存累计次数，刷新或关闭后可能丢失。';
  }

  $('settings').hidden = active;
  $('active-card').hidden = !active;
  $('running-controls').hidden = !active;
  $('checkpoint-content').hidden = !cp;

  $('timer-card').className =
    'timer-card' +
    (cp ? ' checkpoint' : '') +
    (focusing ? ' focusing' : '') +
    (resting ? ' long-break' : '') +
    (paused ? ' paused' : '');

  // 专注阶段隐藏时间；checkpoint 和长休息显示时间。
  $('total-time').hidden = focusing;
  $('time-caption').hidden = focusing;
  $('session-progress').hidden = focusing;

  if (phase !== lastPhase || events.includes('checkpoint')) {
    if (cp) newPrompt(now);

    if (active && !paused) {
      if (phase === 'long-break') {
        audio.chime(true);
      } else if (events.includes('next-session')) {
        audio.chime(true);
      } else if (lastPhase) {
        if (phase === 'checkpoint') audio.chime();
        else if (phase === 'focus') audio.chime(true);
      }
    }

    lastPhase = phase;
  }

  const stateText = !active
    ? '等待下单'
    : resting
      ? paused ? '长休息 · 已暂停' : '长休息 · 后厨歇业'
      : paused
        ? '已暂停'
        : cp
          ? prompt?.type === 'rest' ? '休息 · checkpoint' : 'checkpoint'
          : '专注中 · 后厨备菜';

  $('state').innerHTML = '<i></i>' + stateText;

  const remaining = active
    ? clock.remaining(now)
    : settings.total * 60000;

  const fullDuration = resting
    ? getLongBreakMinutes() * 60000
    : active
      ? timer.s.total * 60000
      : settings.total * 60000;

  $('total-time').innerHTML = format(remaining);
  $('total-time').setAttribute(
    'aria-label',
    resting ? '长休息剩余时间' : 'session 总剩余时间'
  );

  $('time-caption').textContent = resting
    ? '长休息剩余时间'
    : active ? '本单总剩余时间' : '本单用餐时间';

  $('timer-note').textContent = resting
    ? paused
      ? '休息也暂停了。后厨的鸽子正在原地待机。'
      : '可以离席。倒计时结束后，后厨自动开下一单。'
    : active
      ? paused
        ? '已关小火。时间暂停，锅不会糊。'
        : '你管眼前的事，鸽子管锅。'
      : '先点单，再埋头。锅里的事交给后厨。';

  $('session-meta').textContent = resting
    ? `${getLongBreakMinutes()} 分钟长休息 · ${paused ? '暂停中' : '进行中'}`
    : active
      ? `${timer.s.total} 分钟这单 · ${paused ? '暂停中' : '进行中'}`
      : '本桌尚未下单';

  $('count-meta').textContent = resting
    ? `本次已完成 ${completed.visit} 次大循环`
    : active ? `已上 ${timer.count} 份小菜` : '小费：不用给';

  const progress = active
    ? Math.max(0, Math.min(100, (1 - remaining / fullDuration) * 100))
    : 0;

  $('progress').style.width = progress + '%';

  if (cp) {
    const cpRemaining = timer.checkpointRemaining(now);

    $('cp-count').textContent = Math.ceil(cpRemaining / 1000) + ' 秒';
    $('cp-progress').style.width =
      cpRemaining / (timer.s.checkpoint * 1000) * 100 + '%';

    $('cp-count').nextElementSibling.textContent = paused
      ? '暂停中，等待继续'
      : timer.end <= timer.boundary
        ? '后进入长休息'
        : '后自动回到专注';
  }

  if (active) {
    $('pause').textContent = paused
      ? resting ? '继续休息' : '继续计时'
      : resting ? '暂停休息' : '暂停';

    $('reset').hidden = false;
    $('reset').textContent = resting ? '退出，重新点单' : '重置';

    $('active-detail').textContent = resting
      ? `长休息 ${getLongBreakMinutes()} 分钟；结束后自动开始下一轮 ${settings.total} 分钟专注。`
      : `每次间隔 ${timer.s.min}–${timer.s.max} 分钟 · 停顿 ${timer.s.checkpoint} 秒 · 完成后休息 ${getLongBreakMinutes()} 分钟`;
  }

  if (
    events.includes('long-break') ||
    events.includes('next-session')
  ) {
    keepAwake();
  }

  sounds();

  document.title = active
    ? (
      paused ? '已暂停'
        : resting ? '长休息 · 后厨歇业'
          : cp ? '后厨上小菜'
            : '专注中 · 后厨备菜'
    ) + ' · 餐厅（？'
    : '餐厅（？ · 专做一些莫名其妙';
}

setInterval(render,200);
document.addEventListener('visibilitychange',()=>{render();if(document.visibilityState==='visible')keepAwake();});
window.addEventListener('pagehide',()=>{stopPreview();audio.stop();releaseWake();});

window.addEventListener('beforeunload', e => {
  if (['running', 'paused'].includes(activeClock()?.status)) {
    e.preventDefault();
    e.returnValue = '';
  }
});

nextDish();updatePresets();render();
