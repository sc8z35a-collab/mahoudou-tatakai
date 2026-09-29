import {makeWorld} from './world.mjs';
const w=makeWorld(),T=w.THREE;
// sun shadow frustum coverage (values from game.js + castle-detail overrides)
const sun=new T.DirectionalLight();sun.position.set(-8,13,-12);sun.target.position.set(3,0,-2);sun.updateMatrixWorld();sun.target.updateMatrixWorld();
const cam=new T.OrthographicCamera(-20,20,32,-32,.5,80);cam.position.copy(sun.position);cam.lookAt(sun.target.position);cam.updateMatrixWorld();
const out=[];for(const x of [-12,12])for(const z of [-31,-10,5,17.5])for(const y of [0,2.7]){const p=new T.Vector3(x,y,z).applyMatrix4(cam.matrixWorldInverse);const ok=Math.abs(p.x)<=20&&Math.abs(p.y)<=32&&-p.z>=.5&&-p.z<=80;if(!ok)out.push([x,y,z].join(',')+' -> '+[p.x,p.y,-p.z].map(v=>v.toFixed(1)).join(','));}
console.log('floor points outside sun shadow frustum:',out.length?out:'none');
