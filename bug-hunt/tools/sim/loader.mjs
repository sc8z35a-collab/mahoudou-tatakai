import {pathToFileURL} from 'node:url';
const base=new URL('./',import.meta.url);
export async function resolve(spec,ctx,next){
 if(spec==='three')return {url:new URL('three-wrap.mjs',base).href,shortCircuit:true};
 if(spec.startsWith('three/addons/postprocessing/'))return {url:new URL('post.mjs',base).href,shortCircuit:true};
 if(spec.startsWith('three/addons/'))return {url:new URL('../node_modules/three/examples/jsm/'+spec.slice(13),base).href,shortCircuit:true};
 return next(spec,ctx);
}
