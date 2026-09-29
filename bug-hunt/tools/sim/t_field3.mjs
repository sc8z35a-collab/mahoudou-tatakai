const T=(await import('./boot.mjs')).default;const {field:F}=T;const log=(...a)=>console.log(...a);
let seed=1;const r=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
const res={};
for(const o of F.solids.filter(o=>o.type==='box'&&o.bottom<.2&&o.top>.2)){for(let k=0;k<60;k++){const q={x:o.x+(r()-.5)*o.hx*2,y:0,z:o.z+(r()-.5)*o.hz*2};F.project(q);
 const still=F.solids.filter(s=>s.bottom<1&&s.top>.02&&!(s.walkable)&&F.penetration(s,q,F.radius-.02)).map(s=>s.name);
 if(still.length){const key=o.name+'->'+still.join('+');res[key]=(res[key]||0)+1;}}}
log(res);
// wall panelling vs cameras: x=11.73 camera is inside the raised wall panelling (x>=11.765)? panelling spans 11.765..12.065
log('panel inner face x',11.915-.15);
process.exit(0);
