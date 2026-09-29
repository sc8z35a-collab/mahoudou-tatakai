export * from '../node_modules/three/build/three.module.js';
import * as T from '../node_modules/three/build/three.module.js';
export class WebGLRenderer{constructor(o){this.domElement=o?.canvas;this.shadowMap={enabled:false,type:0};this.capabilities={getMaxAnisotropy:()=>16};this._pr=1;this.renders=0;}
 setPixelRatio(v){this._pr=v}getPixelRatio(){return this._pr}setSize(w,h){this.w=w;this.h=h}render(){this.renders++}getSize(v){return v.set(this.w,this.h)}}
export class PMREMGenerator{constructor(){}fromScene(){const t=new T.Texture();return {texture:t,dispose(){t.dispose()}}}dispose(){}}
