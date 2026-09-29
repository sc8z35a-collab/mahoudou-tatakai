import {makeWorld} from './world.mjs';
const w=makeWorld(),T=w.THREE;const scene=new T.Scene();
const a=w.createKnight(scene,w.renderer,false),b=w.createKnight(scene,w.renderer,true);
let meshes=0;const mats=new Set();let envMeshes=0;for(const f of [a,b])f.root.traverse(o=>{if(o.isMesh){meshes++;mats.add(o.material);if(o.material.envMap)envMeshes++;}});
console.log('meshes',meshes,'unique materials',mats.size,'meshes with env',envMeshes);
