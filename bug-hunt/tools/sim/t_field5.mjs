const T=(await import('./boot.mjs')).default;const {field:F}=T;const log=(...a)=>console.log(...a);
// can a moving player end up overlapping a solid after move()? sweep many random moves in side aisles
let seed=7;const r=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};let worst=0,cnt=0,where=null;
for(let trial=0;trial<3000;trial++){const p={x:(r()>.5?1:-1)*(10+r()*1.7),y:0,z:-29+r()*45};F.project(p);
 for(let s=0;s<40;s++){const a=r()*6.28;F.move(p,{x:Math.cos(a)*.15,z:Math.sin(a)*.15});
  for(const o of F.solids){if(o.walkable||o.top<=p.y+.015||o.bottom>=p.y+F.height)continue;const pen=F.penetration(o,p,F.radius);if(pen){const d=Math.hypot(pen.x,pen.z);if(d>.01)cnt++;if(d>worst){worst=d;where={...p,o:o.name};}}}}}
log('residual penetrations >1cm:',cnt,'worst',worst.toFixed(3),where);
process.exit(0);
