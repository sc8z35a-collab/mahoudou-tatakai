const T=(await import('./boot.mjs')).default;const {field:F}=T;const log=(...a)=>console.log(...a);
let seed=7;const r=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};const hist={};
for(let trial=0;trial<3000;trial++){const p={x:(r()>.5?1:-1)*(10+r()*1.7),y:0,z:-29+r()*45};F.project(p);
 for(let s=0;s<40;s++){const a=r()*6.28;F.move(p,{x:Math.cos(a)*.15,z:Math.sin(a)*.15});
  let pen=0,names=[];for(const o of F.solids){if(o.walkable||o.top<=p.y+.015||o.bottom>=p.y+F.height)continue;const q=F.penetration(o,p,F.radius);if(q){const d=Math.hypot(q.x,q.z);if(d>.01){pen=Math.max(pen,d);names.push(o.name)}}}
  if(pen>.05){const k=`${Math.round(p.x*2)/2},${Math.round(p.z*2)/2}:${names.join('+')}`;hist[k]=Math.max(hist[k]||0,+pen.toFixed(3));}}}
const e=Object.entries(hist).sort((a,b)=>b[1]-a[1]);log('distinct pockets >5cm',e.length);log(e.slice(0,14));
process.exit(0);
