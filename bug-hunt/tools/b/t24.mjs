import {makeWorld} from './world.mjs';
const w=makeWorld(),f=w.field,T=w.THREE;
const out={};
const S=n=>f.solids.filter(o=>o.name===n);
// urn vs statue plinth overlap
const urns=S('ceremonial-urn'),pl=S('guardian-statue-plinth');
out.urnInsidePlinth=urns.filter(u=>pl.some(p=>Math.abs(u.x-p.x)<p.hx&&Math.abs(u.z-p.z)<p.hz)).map(u=>[u.x,u.z,u.bottom.toFixed(2)]);
// urn base footprint off the dais edge: urns with bottom>0
const steps=f.surfaces;out.urnOverhang=urns.filter(u=>u.bottom>0).map(u=>{let s=0;for(let a=0;a<16;a++){const x=u.x+Math.cos(a/16*6.283)*.36,z=u.z+Math.sin(a/16*6.283)*.36;if(f.ground(x,z)<u.bottom-.01)s++;}return [u.x,u.z,'rim pts off step '+s+'/16']});
// plinth sunk into step
out.plinthInStep=pl.map(p=>[p.x,p.z,'ground at corners',[f.ground(p.x-p.hx+.01,p.z),f.ground(p.x+p.hx-.01,p.z)].map(v=>v.toFixed(2)).join('/')]);
// urn vs rack
const racks=S('weapon-rack');out.urnVsRack=urns.map(u=>racks.map(r=>f.penetration(r,{x:u.x,z:u.z},u.r)?[u.x,u.z,'overlaps rack',r.x,r.z]:null).filter(Boolean)).flat();
// all static solids overlapping each other (non-walkable, overlapping vertical range) — excluding known composite (pillar parts, brazier parts, statue parts, walls/panelling, throne parts)
const comp=/pillar|fluted|brazier|statue|wall|panelling|gate|throne|dais/;
const pairs=[];const sol=f.solids.filter(o=>!o.walkable&&!comp.test(o.name));
for(let i=0;i<sol.length;i++)for(let j=i+1;j<sol.length;j++){const a=sol[i],b=sol[j];if(a.top<=b.bottom||b.top<=a.bottom)continue;const r=b.type==='circle'?b.r:Math.min(b.hx,b.hz);if(f.penetration(a,{x:b.x,z:b.z},r*.5))pairs.push(a.name+'@'+a.x.toFixed(1)+','+a.z.toFixed(1)+' x '+b.name+'@'+b.x.toFixed(1)+','+b.z.toFixed(1));}
out.propOverlaps=pairs;
// props vs architecture (props overlapping walls/pillars/braziers/statues)
const arch=f.solids.filter(o=>comp.test(o.name)&&!/dais/.test(o.name));const pa=[];
for(const b of sol){for(const a of arch){if(a.top<=b.bottom||b.top<=a.bottom)continue;const r=b.type==='circle'?b.r:Math.min(b.hx,b.hz);if(f.penetration(a,{x:b.x,z:b.z},r*.6))pa.push(b.name+'@'+b.x.toFixed(1)+','+b.z.toFixed(1)+' in '+a.name);}}
out.propInArch=[...new Set(pa)];
console.log(JSON.stringify(out,null,1));
