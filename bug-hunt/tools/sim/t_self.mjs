import './env.mjs';
Object.defineProperty(window.HTMLCanvasElement.prototype,'clientWidth',{get:()=>1280});Object.defineProperty(window.HTMLCanvasElement.prototype,'clientHeight',{get:()=>800});
const T=(await import('./boot.mjs')).default;
await new Promise(r=>setTimeout(r,4000));
console.log('passed attr',document.body.dataset.testsPassed);
process.exit(0);
