import './env.mjs';
import {renderer} from './env.mjs';
import * as THREE from 'three';
import {CastleField} from './src/field.js';
import {buildCastleDetail} from './src/castle-detail.js';
import {createKnight,animateKnight} from './src/knight.js';
export function makeWorld(){
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0,.02);
  const M=()=>new THREE.MeshStandardMaterial();
  const mat={stone:new THREE.MeshStandardMaterial({map:new THREE.Texture()}),trim:M(),floor:M(),dark:M(),gold:M(),iron:M(),red:M(),carpet:M(),glass:M(),flame:M()};
  const sun=new THREE.DirectionalLight();const coldLight=new THREE.DirectionalLight();
  const flames=[];const flame=(x,y,z,s)=>flames.push([x,y,z,s]);
  const field=new CastleField();
  const castle=buildCastleDetail({scene,renderer,mat,field,sun,coldLight,flame});
  return {THREE,scene,field,castle,flames,renderer,createKnight,animateKnight};
}
