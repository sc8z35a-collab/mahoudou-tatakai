import {makeWorld} from './world.mjs';
const w=makeWorld(),f=w.field,T=w.THREE;const V=(x,y,z)=>new T.Vector3(x,y,z);
// Can player physically reach corner (-11.3,16.5)? walk from (-9,0,16.5) towards -x
let q=V(-9,0,16.3);for(let i=0;i<200;i++)f.move(q,V(-.03,0,.01));console.log('player reach corner',q.x.toFixed(2),q.z.toFixed(2));
const target=q.clone();
let t0=performance.now();let p=f.findPath(V(0,0,-3.5),target);console.log('npc path',p.length,(performance.now()-t0).toFixed(0),'ms');
// scan many player-reachable points, time findPath
let worst=0,fails=0,n=0,slow=0;
for(let x=-11.4;x<=11.4;x+=.6)for(let z=-30;z<=16.6;z+=.6){if(!f.freeAt(x,z))continue;n++;const s=performance.now();const r=f.findPath(V(0,0,-3.5),V(x,f.ground(x,z),z));const d=performance.now()-s;worst=Math.max(worst,d);if(d>50)slow++;if(!r.length){fails++;if(fails<15)console.log(' fail',x.toFixed(1),z.toFixed(1),d.toFixed(0)+'ms');}}
console.log({n,fails,slow,worst:worst.toFixed(0)});
