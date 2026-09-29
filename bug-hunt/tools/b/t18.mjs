import {makeWorld} from './world.mjs';
const w=makeWorld(),T=w.THREE;const scene=new T.Scene();
for(const en of [false,true]){const k=w.createKnight(scene,w.renderer,en);
 for(const c of [0,1]){k.combo=c;let best=0,at=0,atHit=null;for(let i=0;i<=100;i++){w.animateKnight(k,1/120,1+i/120,i/100);const t=k.tip.getWorldPosition(new T.Vector3());const b=k.bladeBase.getWorldPosition(new T.Vector3());
  // max forward extent of any blade point
  for(let s=0;s<=10;s++){const p=b.clone().lerp(t,s/10);if(p.z>best){best=p.z;at=i;}}
  if(i===48)atHit=t.toArray().map(v=>v.toFixed(2));}
  console.log(en?'enemy':'player','cut',c,'max forward blade z',best.toFixed(2),'at',at+'%','tip@48%',atHit,'hitRange',en?2.75:2.85,'needed(range-.32)',(en?2.75:2.85)-.32);}
}
