const T=(await import('./boot.mjs')).default;const {player:P,enemy:E,field:F}=T;const log=(...a)=>console.log(...a);
import * as THREE from 'three';const V=(x,y,z)=>new THREE.Vector3(x,y,z);
let blocked=0,n=0;for(let z=-22;z>-25.5;z-=.25){const a=V(0,1.45,-21.3),b=V(0,F.ground(0,z)+1.45,z);n++;if(!F.lineOfSight(a,b))blocked++;}log('1 LOS floor->stairs blocked',blocked,'/',n);
T.startGame();P.root.position.set(11.6,0,-10);E.root.position.set(8,0,-10);for(let i=0;i<200;i++)T.updateCamera(1/60,i/60);log('3 cam near wall',T.camera.position.toArray().map(v=>v.toFixed(2)));
let bad=0,tot=0;for(const o of F.solids.filter(o=>o.type==='box'&&o.angle&&o.bottom<.2)){for(let k=0;k<50;k++){const q={x:o.x+(Math.random()-.5)*o.hx*2,y:0,z:o.z+(Math.random()-.5)*o.hz*2};F.project(q);tot++;if(F.contains(o,q.x,q.z,F.radius-0.02))bad++;}}log('8b rotated box unresolved',bad,'/',tot);
// culling line60 in project: box skip test only for circles; fine. Check circle prefilter correctness
process.exit(0);
