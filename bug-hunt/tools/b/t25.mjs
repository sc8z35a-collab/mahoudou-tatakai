// capture per-mesh placements before merge by patching group traversal: rebuild castle and inspect scene group before merge
import './env.mjs';import {renderer} from './env.mjs';import * as THREE from 'three';
import {CastleField} from './src/field.js';
// monkeypatch Scene.remove to snapshot group
const orig=THREE.Scene.prototype.remove;let snap=null;THREE.Scene.prototype.remove=function(o){if(o.name==='eldoria-detailed-architecture')snap=o;return orig.call(this,o);};
const {buildCastleDetail}=await import('./src/castle-detail.js');
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0,.02);const M=()=>new THREE.MeshStandardMaterial();
const mat={stone:new THREE.MeshStandardMaterial({map:new THREE.Texture()}),trim:M(),floor:M(),dark:M(),gold:M(),iron:M(),red:M(),carpet:M(),glass:M(),flame:M()};
buildCastleDetail({scene,renderer,mat,field:new CastleField(),sun:new THREE.DirectionalLight(),coldLight:new THREE.DirectionalLight(),flame:()=>{}});
snap.updateMatrixWorld(true);
// books: groups with rotation.z = PI/2 on tables. Find world bbox of book groups: children boxes parchment
const books=[];snap.traverse(o=>{if(o.isGroup&&Math.abs(o.rotation.z-Math.PI/2)<1e-6&&o.children.length>=5)books.push(o);});
const res=books.slice(0,8).map(g=>{const b=new THREE.Box3().setFromObject(g);return {minY:b.min.y.toFixed(3),maxY:b.max.y.toFixed(3),sx:(b.max.x-b.min.x).toFixed(2),sy:(b.max.y-b.min.y).toFixed(2),sz:(b.max.z-b.min.z).toFixed(2)}});
console.log('books',books.length,'tabletop y=1.185',JSON.stringify(res));
// count book-book intersections per table
let inter=0,pairs=0;const bb=books.map(g=>new THREE.Box3().setFromObject(g));for(let i=0;i<bb.length;i++)for(let j=i+1;j<bb.length;j++){pairs++;if(bb[i].intersectsBox(bb[j]))inter++;}console.log('book bbox intersections',inter);
