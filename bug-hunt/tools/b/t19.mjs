import {makeWorld} from './world.mjs';
const w=makeWorld(),T=w.THREE;const scene=new T.Scene();
const k=w.createKnight(scene,w.renderer,false);const P=o=>o.getWorldPosition(new T.Vector3());
const out={};
// 1. Shield rotation formula: shield.rotation.x = -(shoulder.x+elbow.x)-.04 : check shield world normal during walk/dodge vs guard
// 2. death while mid-attack: progress sets p.step etc; with dead, is sword pose frozen? call with progress
k.dead=true;k.motion.death=0;for(let i=0;i<60;i++)w.animateKnight(k,1/60,1+i/60,.59);out.deadWithProgressTip=P(k.tip).toArray().map(v=>v.toFixed(2));
k.dead=false;
// 3. hurt recoil only torso; ok
// 4. breath: time param; animation uses time; in paused mode no update fine
// 5. cape: capeBase at y=+.695 top; z offset - check cape vertex penetrating torso/backplate: cape at torso z -.225; backplate loft rz up to .225 at y .40 => backplate back z -.225 ; cape top ring inside?
const cape=k.cape;cape.updateMatrixWorld(true);
const inv=new T.Matrix4().copy(k.torso.matrixWorld).invert();const a=cape.geometry.attributes.position;let pen=0,total=0;const v=new T.Vector3();
// idle frame
w.animateKnight(k,1/60,1);k.root.updateMatrixWorld(true);
for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(cape.matrixWorld).applyMatrix4(inv);total++;
 // chest loft profile y in [.1,.63], ellipse approx rz .22 rx .35
 if(v.y>.1&&v.y<.6){const rz=.2+.02*Math.sin((v.y-.1)/.5*Math.PI),rx=.3+.07*Math.sin((v.y-.1)/.5*Math.PI);if((v.x/rx)**2+(v.z/rz)**2<1)pen++;}}
out.capeVertsInsideTorso=pen+'/'+total;
// walking fast
for(let i=0;i<60;i++){k.moving=1;k.root.position.z-=3.6/60;w.animateKnight(k,1/60,2+i/60);}k.root.updateMatrixWorld(true);
const inv2=new T.Matrix4().copy(k.torso.matrixWorld).invert();pen=0;
for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(cape.matrixWorld).applyMatrix4(inv2);if(v.y>.1&&v.y<.6){const rz=.2+.02*Math.sin((v.y-.1)/.5*Math.PI),rx=.3+.07*Math.sin((v.y-.1)/.5*Math.PI);if((v.x/rx)**2+(v.z/rz)**2<1)pen++;}}
out.capeInsideWhenWalkingBackward=pen;
// cape vs legs: cape bottom local y -.695-.14 => torso y ~ .67 world ; legs at back? cape reaching behind knees - check cape min y world
let mn=9;for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(cape.matrixWorld);mn=Math.min(mn,v.y);}out.capeMinY=mn.toFixed(2);
console.log(JSON.stringify(out));
