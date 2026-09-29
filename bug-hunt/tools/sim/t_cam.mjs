const T=(await import('./boot.mjs')).default;const cam=T.camera;
let inside=0,total=0,minD=9;
for(let t=0;t<=210;t+=0.1){T.updateCamera(0.1,t);const d=Math.hypot(cam.position.x-9.4,cam.position.z-14);total++;if(d<0.65)inside++;minD=Math.min(minD,d);}
console.log('title cam frac inside column r.65:',(inside/total).toFixed(2),'min dist',minD.toFixed(3),'pos',cam.position.toArray().map(v=>v.toFixed(2)));
process.exit(0);
