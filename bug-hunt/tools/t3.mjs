import * as THREE from 'three';import {build} from './field_test.mjs';
const f=build();f.buildNavigation();const V=(x,y,z)=>new THREE.Vector3(x,y,z);
// A) walk backward off top of dais
let p={x:0,y:1.62,z:-28.9+0};  // behind throne? throne back at -28.85 +-.2 ; use x=3
p={x:3,y:1.62,z:-29.0};const ys=[];for(let i=0;i<20;i++){f.move(p,{x:0,z:-.05});ys.push(p.y.toFixed(2)+'@'+p.z.toFixed(2));}console.log('walk back off dais:',ys.join(' '));
// B) climb the back of dais from behind
p={x:3,y:0,z:-30.1};const ys2=[];for(let i=0;i<30;i++){f.move(p,{x:0,z:.05});ys2.push(p.y.toFixed(2)+'@'+p.z.toFixed(2));}console.log('climb from behind:',ys2.join(' '));
// C) side of dais: drop from top step sideways
p={x:4.0,y:1.62,z:-27};const ys3=[];for(let i=0;i<30;i++){f.move(p,{x:.05,z:0});ys3.push(p.y.toFixed(2)+'@'+p.x.toFixed(2));}console.log('side:',ys3.join(' '));
// D) path timing behind dais
for(const [a,b] of [[V(0,0,0),V(3,0,-30.1)],[V(0,0,-10),V(-3,0,-30.1)],[V(8,0,-20),V(0,0,-30.1)]]){let t=performance.now();const path=f.findPath(a,b);console.log('path',a.toArray(),b.toArray(),'len',path.length,'ms',(performance.now()-t).toFixed(1));}
