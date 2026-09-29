import {makeWorld} from './world.mjs';
const w=makeWorld(),f=w.field,T=w.THREE;const V=(x,y,z)=>new T.Vector3(x,y,z);
// flood-fill reachability with the real player movement (field.move)
const S=.3,key=(p)=>Math.round(p.x/S)+','+Math.round(p.z/S);
const seen=new Map();const Q=[V(0,0,3.5)];seen.set(key(Q[0]),Q[0]);
while(Q.length){const p=Q.shift();for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const q=p.clone();f.move(q,V(dx*S,0,dz*S));const k=key(q);if(!seen.has(k)){seen.set(k,q);Q.push(q);}}}
console.log('reachable cells',seen.size);
let fails=[],slow=0,worst=0;
for(const q of seen.values()){const s=performance.now();const r=f.findPath(V(0,0,-3.5),q);const d=performance.now()-s;worst=Math.max(worst,d);if(d>50)slow++;if(!r.length)fails.push([q.x.toFixed(2),q.y.toFixed(2),q.z.toFixed(2),d.toFixed(0)]);}
console.log('fails',fails.length,'slow>50ms',slow,'worst',worst.toFixed(0));console.log(fails.slice(0,40).map(a=>a.join(' ')).join('\n'));
