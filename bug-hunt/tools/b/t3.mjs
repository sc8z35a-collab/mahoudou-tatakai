import {makeWorld} from './world.mjs';
const w=makeWorld(),T=w.THREE;
const scene=new T.Scene();
const k=w.createKnight(scene,w.renderer,false), e=w.createKnight(scene,w.renderer,true);
function minY(f){let m=Infinity,who='';f.root.updateMatrixWorld(true);const v=new T.Vector3();f.root.traverse(o=>{if(!o.isMesh||o.geometry.type==='CircleGeometry')return;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i+=1){v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);if(v.y<m){m=v.y;who=(o.parent?.name||'')+'/'+o.geometry.type+'/'+(o.name||'');}}});return [m.toFixed(3),who];}
for(const f of [k,e]){
  // idle
  w.animateKnight(f,1/60,1);console.log(f.enemy?'enemy':'player','idle minY',minY(f));
  // tip min Y over cuts
  for(const c of [0,1]){f.combo=c;let mt=9,at=0;for(let i=0;i<=100;i++){w.animateKnight(f,1/120,1+i/120,i/100);const t=f.tip.getWorldPosition(new T.Vector3());if(t.y<mt){mt=t.y;at=i;}}console.log(' cut',c,'blade tip min y',mt.toFixed(3),'at',at+'%','mesh min',minY(f));}
  // guard
  f.guard=true;for(let i=0;i<60;i++)w.animateKnight(f,1/60,1+i/60);console.log(' guard minY',minY(f), 'tip',f.tip.getWorldPosition(new T.Vector3()).toArray().map(x=>x.toFixed(2)));f.guard=false;
  // dodge
  f.dodgeTime=.215;w.animateKnight(f,1/60,1);console.log(' dodge mid minY',minY(f));f.dodgeTime=0;
  // death
  f.dead=true;for(let i=0;i<120;i++)w.animateKnight(f,1/60,2+i/60);console.log(' dead minY',minY(f));f.dead=false;
}
