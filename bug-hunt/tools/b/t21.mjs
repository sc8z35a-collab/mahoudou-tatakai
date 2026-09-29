import {makeWorld} from './world.mjs';
const w=makeWorld(),T=w.THREE;const scene=new T.Scene();
const k=w.createKnight(scene,w.renderer,false);const out={};
// Walk animation when moving backward relative to facing: m.forward negative -> hips swing reversed; ok.
// Test m.speed when f.moving>0 but not moving (stuck vs wall/A-002) -> legs cycle
k.moving=.8;for(let i=0;i<60;i++)w.animateKnight(k,1/60,1+i/60);out.speedWhileStuck=k.motion.speed.toFixed(2);out.walkPhase=k.walk.toFixed(2);
// Death: if dead during dodge, dodge var still sin -> ok. Death direction always backward relative to facing: fine.
// Shield local mapping: arms[0] side s=1 -> +X is anatomical left. OK.
// Scabbard at x=.3 (+X = left side) OK for right-handed draw. Baldric at x=.07 ... fine.
// Enemy scale 1.07 -> sole ground correction divides by root.scale.y OK; but hip positions set to 1.32 absolute fine.
// Idle hand-guard: sword rotation guard x 1.74
// Guard in air? feet grounding uses matrixWorld of ankle and root.position.y+.006 -> but on stairs root.y=ground; fine.
// Ground correction only raises (soleY<floorY) never lowers -> knight can float when crouch? check max sole height above floor in idle & cut
function soleMin(){k.root.updateMatrixWorld(true);let m=9;for(const leg of k.legs)for(const x of [-.095,.095])for(const z of [-.105,.265])m=Math.min(m,new T.Vector3(x,-.11,z).applyMatrix4(leg.ankle.matrixWorld).y);return m;}
k.moving=0;for(let i=0;i<60;i++)w.animateKnight(k,1/60,3+i/60);out.idleSoleMin=soleMin().toFixed(3);
let mx=0,mxAt=0;for(const c of [0,1]){k.combo=c;for(let i=0;i<=100;i++){w.animateKnight(k,1/120,1,i/100);const s=soleMin();if(s>mx){mx=s;mxAt=c+':'+i;}}}out.maxLowestSoleDuringCuts=mx.toFixed(3)+'@'+mxAt;
// walk: lowest sole max
mx=0;for(let i=0;i<120;i++){k.moving=1;k.root.position.z+=3.6/60;w.animateKnight(k,1/60,5+i/60);mx=Math.max(mx,soleMin());}out.walkLowestSoleMax=mx.toFixed(3);
console.log(JSON.stringify(out));
