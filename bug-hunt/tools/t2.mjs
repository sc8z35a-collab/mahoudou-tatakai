import * as THREE from 'three';import {build} from './field_test.mjs';
const f=build();let t=performance.now();f.buildNavigation();console.log('buildNav ms',(performance.now()-t).toFixed(0),'free cells',f.grid.cells.reduce((a,b)=>a+b,0));
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
// A* timing worst-ish: across hall around pillars
for(const [a,b] of [[V(0,0,10),V(0,1.62,-27)],[V(10.9,0,-10),V(-10.9,0,12)],[V(10.9,0,15),V(10.9,0,-29)],[V(0,0,0),V(0,0,-30.2)]]){
 a.y=f.ground(a.x,a.z);b.y=f.ground(b.x,b.z);t=performance.now();const p=f.findPath(a,b);console.log('path',a.toArray(),'->',b.toArray(),'len',p.length,'ms',(performance.now()-t).toFixed(1));}
// LOS: attacker on top step vs target below at stair foot
const eye=1.45;
for(const [ay,az,by,bz] of [[1.62,-25.8,0,-22.0],[1.62,-25.8,.27,-22.8],[0,-21.5,1.62,-25.8],[1.08,-24.5,0,-22.3]]){
 const a=V(0,ay+eye,az),b=V(0,by+eye,bz);console.log('LOS',ay,az,'->',by,bz,'dist3d',a.distanceTo(b).toFixed(2),'visible',f.lineOfSight(a,b));}
