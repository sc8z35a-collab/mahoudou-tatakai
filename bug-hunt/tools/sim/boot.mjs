import './env.mjs';
const t0=Date.now();const G=await import('./game.js');
console.error('load ms',Date.now()-t0);
export default G.__t;
