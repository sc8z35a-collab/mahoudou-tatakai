import './env.mjs';
Object.defineProperty(window.HTMLCanvasElement.prototype,'clientWidth',{get:()=>1280});Object.defineProperty(window.HTMLCanvasElement.prototype,'clientHeight',{get:()=>800});
const T=(await import('./boot.mjs')).default;
await new Promise(r=>setTimeout(r,3000));
while(globalThis.__raf.length){const f=globalThis.__raf.shift();f(performance.now());if(document.body.dataset.testsComplete)break;}
const out={};out.after=T.get();
window.dispatchEvent(new window.KeyboardEvent('keydown',{code:'Escape'}));out.escPaused=T.get().paused;
globalThis.__hidden=true;document.dispatchEvent(new window.Event('visibilitychange'));globalThis.__hidden=false;document.dispatchEvent(new window.Event('visibilitychange'));
out.afterVisibility={paused:T.get().paused,pauseOpen:document.getElementById('pause-dialog').open};
console.log('B3',JSON.stringify(out));process.exit(0);
