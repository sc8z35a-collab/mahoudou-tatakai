export class EffectComposer{constructor(r){this.r=r;this.passes=[];this.renders=0}addPass(p){this.passes.push(p)}render(){this.renders++;this.r.renders++}setSize(w,h){this.w=w;this.h=h}setPixelRatio(p){this.pr=p}}
export class RenderPass{} export class OutputPass{}
export class UnrealBloomPass{constructor(res,s){this.resolution=res;this.strength=s}}
export class SSAOPass{constructor(s,c,w,h,k){this.enabled=true;this.kernelSize=k}}
