import {makeWorld} from './world.mjs';
const w=makeWorld(),T=w.THREE;const scene=new T.Scene();
const k=w.createKnight(scene,w.renderer,false);
const res={};
k.root.traverse(o=>{if(!o.isMesh||o.geometry.type!=='BufferGeometry')return;const g=o.geometry,p=g.attributes.position,idx=g.index.array;
 let out=0,inn=0;const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),cen=new T.Vector3();
 g.computeBoundingBox();const bc=g.boundingBox.getCenter(new T.Vector3());
 for(let i=0;i<idx.length;i+=3){a.fromBufferAttribute(p,idx[i]);b.fromBufferAttribute(p,idx[i+1]);c.fromBufferAttribute(p,idx[i+2]);
  const n=new T.Vector3().subVectors(c,b).cross(new T.Vector3().subVectors(a,b));if(n.lengthSq()<1e-14)continue;
  cen.copy(a).add(b).add(c).divideScalar(3);const r=new T.Vector3(cen.x-bc.x,0,cen.z-bc.z);if(r.lengthSq()<1e-8)continue;if(n.dot(r)>0)out++;else inn++;}
 const key=(o.material===k.bladeMat?'BLADE':'loft')+' side='+o.material.side+' '+(out>inn?'OUTWARD':'INWARD');res[key]=(res[key]||0)+1;
});
console.log(res);
