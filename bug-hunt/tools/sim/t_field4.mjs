const T=(await import('./boot.mjs')).default;const {field:F}=T;const log=(...a)=>console.log(...a);
for(const o of F.solids.filter(o=>['writing-table','weapon-rack','ironbound-chest'].includes(o.name))){
 const outer=o.x>0?o.x+Math.abs(o.hx*o.c)+Math.abs(o.hz*o.s):o.x-Math.abs(o.hx*o.c)-Math.abs(o.hz*o.s);
 const gap=11.765-Math.abs(outer);log(o.name,o.x.toFixed(2),o.z.toFixed(2),'outer edge',outer.toFixed(3),'gap to panelling',gap.toFixed(3),gap<0.64?'< body diameter .64 => pocket':'' );}
// plinth-plinth: weird: point in plinth pushed ends inside plinth? test
const pl=F.solids.find(o=>o.name==='pillar-square-plinth');const q={x:pl.x+.05,y:0,z:pl.z+.02};F.project(q);log('inside plinth ->',q, 'y',q.y);
process.exit(0);
