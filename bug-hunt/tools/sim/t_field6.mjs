const T=(await import('./boot.mjs')).default;const {field:F}=T;const log=(...a)=>console.log(...a);
let seed=7;const r=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};const by={};let n=0;
for(let trial=0;trial<3000;trial++){const p={x:(r()>.5?1:-1)*(10+r()*1.7),y:0,z:-29+r()*45};F.project(p);
 for(let s=0;s<40;s++){const a=r()*6.28;F.move(p,{x:Math.cos(a)*.15,z:Math.sin(a)*.15});n++;
  for(const o of F.solids){if(o.walkable||o.top<=p.y+.015||o.bottom>=p.y+F.height)continue;const pen=F.penetration(o,p,F.radius);if(pen&&Math.hypot(pen.x,pen.z)>.01){by[o.name]=(by[o.name]||0)+1;}}}}
log('samples',n,by);
// direct: approach plinth horizontally
const p={x:-9.4+2,y:0,z:-26};for(let i=0;i<40;i++)F.move(p,{x:-.05,z:0});log('approach plinth from +x ends x',p.x.toFixed(3),'plinth edge',(-9.4+.9).toFixed(2),'expected x>=',(-9.4+.9+.32).toFixed(2));
// the prefilter line 60: circle skip uses |dx| only; boxes never skipped. So why? project circle 'pillar-base' pushes out r .78 -> center at 1.10 >= .9+.32=1.22? no 1.10<1.22 -> inside plinth. Box plinth push after?
process.exit(0);
