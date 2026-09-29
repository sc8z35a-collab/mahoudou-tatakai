import {makeWorld} from './world.mjs';
const w=makeWorld(),T=w.THREE;const scene=new T.Scene();
for(const en of [false,true]){const k=w.createKnight(scene,w.renderer,en);w.animateKnight(k,1/60,1);k.root.updateMatrixWorld(true);
 const b=new T.Box3();k.root.traverse(o=>{if(o.isMesh&&o.geometry.type!=='CircleGeometry')b.expandByObject(o);});console.log(en?'enemy':'player','bbox y',b.min.y.toFixed(3),b.max.y.toFixed(3),'x',b.min.x.toFixed(2),b.max.x.toFixed(2),'z',b.min.z.toFixed(2),b.max.z.toFixed(2));
 k.dead=true;for(let i=0;i<120;i++)w.animateKnight(k,1/60,2+i/60);k.root.updateMatrixWorld(true);
 const v=new T.Vector3();const low=[];k.root.traverse(o=>{if(!o.isMesh||o.geometry.type==='CircleGeometry')return;let m=9;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);m=Math.min(m,v.y);}if(m<-.02){let p=o,chain=[];while(p&&p!==k.root){chain.push(p.name||p.type);p=p.parent;}low.push(m.toFixed(3)+' '+o.geometry.type+' '+chain.slice(1,4).join('<'));}});
 console.log(' dead: parts below visual floor(-0.02):',low.length);console.log(low.slice(0,8).join('\n'));
 const tb=new T.Box3();k.root.traverse(o=>{if(o.isMesh&&o.geometry.type!=='CircleGeometry')tb.expandByObject(o);});console.log(' dead bbox z',tb.min.z.toFixed(2),tb.max.z.toFixed(2));
}
