import {makeWorld} from './world.mjs';
const w=makeWorld(),T=w.THREE;
const rc=new T.Raycaster();const out=[];
for(const l of w.castle.spotlights){
 // cast cone sample rays from light, see first hit distance: if something is within .5 of light (window mullions/rails/candle shelves), it blocks
 let blocked=0,n=0,near=[];const dir=l.target.position.clone().sub(l.position).normalize();
 const up=new T.Vector3(0,1,0),r1=new T.Vector3().crossVectors(dir,up).normalize(),r2=new T.Vector3().crossVectors(r1,dir).normalize();
 for(let a=0;a<12;a++)for(const s of [.1,.3,.5]){const d=dir.clone().addScaledVector(r1,Math.cos(a/12*6.283)*s).addScaledVector(r2,Math.sin(a/12*6.283)*s).normalize();rc.set(l.position,d);rc.far=40;const h=rc.intersectObjects(w.castle.batch.children,false)[0];n++;if(h&&h.distance<3){blocked++;near.push(h.distance.toFixed(2));}}
 out.push({z:l.position.z,raysBlockedWithin3m:blocked+'/'+n,sample:near.slice(0,5)});}
console.log(JSON.stringify(out));
