// DOM stubs for node
const ctx=new Proxy({},{get:(t,k)=>k==='getImageData'?((x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)})):k==='measureText'?(()=>({width:1})):(()=>{}),set:()=>true});
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx,style:{}}),createElementNS:()=>({style:{}})};
globalThis.self=globalThis;
export const renderer={capabilities:{getMaxAnisotropy:()=>1},toneMappingExposure:1};
