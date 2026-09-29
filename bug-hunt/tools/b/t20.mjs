import {makeWorld} from './world.mjs';
const w=makeWorld(),T=w.THREE;const scene=new T.Scene();
const k=w.createKnight(scene,w.renderer,false);
const cape=k.cape,a=cape.geometry.attributes.position,v=new T.Vector3();
function capeVsLegs(){k.root.updateMatrixWorld(true);let pen=0;for(const leg of k.legs){const inv=new T.Matrix4().copy(leg.hip.matrixWorld).invert();const ki=new T.Matrix4().copy(leg.knee.matrixWorld).invert();
 for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(cape.matrixWorld);const l=v.clone().applyMatrix4(inv);if(l.y<.01&&l.y>-.58&&(l.x/.15)**2+(l.z/.155)**2<1)pen++;const m=v.clone().applyMatrix4(ki);if(m.y<0&&m.y>-.5&&(m.x/.11)**2+(m.z/.12)**2<1)pen++;}}return pen;}
const out={};w.animateKnight(k,1/60,1);out.idle=capeVsLegs();
let mx=0;for(let i=0;i<90;i++){k.moving=1;k.root.position.z+=3.6/60;w.animateKnight(k,1/60,2+i/60);mx=Math.max(mx,capeVsLegs());}out.walkForward=mx;
mx=0;for(let i=0;i<90;i++){k.moving=1;k.root.position.z-=3.6/60;w.animateKnight(k,1/60,4+i/60);mx=Math.max(mx,capeVsLegs());}out.walkBackward=mx;
for(const c of [0,1]){k.combo=c;mx=0;for(let i=0;i<=100;i+=2){w.animateKnight(k,1/120,1,i/100);mx=Math.max(mx,capeVsLegs());}out['cut'+c]=mx;}
k.dodgeTime=.215;w.animateKnight(k,1/60,1);out.dodge=capeVsLegs();
console.log(JSON.stringify(out),'capeVerts',a.count);
