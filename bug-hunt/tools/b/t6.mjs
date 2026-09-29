import {makeWorld} from './world.mjs';
const w=makeWorld(),f=w.field,T=w.THREE;const V=(x,y,z)=>new T.Vector3(x,y,z);
const g=f.grid;
function dump(x0,x1,z0,z1){for(let z=z0;z<=z1;z+=g.step){let s=z.toFixed(2).padStart(7)+' ';for(let x=x0;x<=x1;x+=g.step){const ix=Math.round((x-g.minX)/g.step),iz=Math.round((z-g.minZ)/g.step);s+=g.cells[iz*g.nx+ix]?'.':'#';}console.log(s);}}
console.log('region x 8..11.5, z 8..16.3');dump(8,11.5,8,16.3);
console.log('region x -11.5..-9, z -5..-1');dump(-11.55,-9,-5,-1);
const blockers=(x,z,r)=>f.solids.filter(o=>!o.walkable&&o.top>0.015&&f.penetration(o,{x,y:0,z},r)).map(o=>o.name);
console.log('(-10.68,-3.33) blockers @.345',blockers(-10.68,-3.33,.345),'@.32',blockers(-10.68,-3.33,.32));
for(const o of f.solids)if(Math.abs(o.x+10.7)<1.2&&Math.abs(o.z+3)<1.5)console.log(o.name,o.x,o.z,o.hx,o.hz,o.r,o.bottom,o.top);
