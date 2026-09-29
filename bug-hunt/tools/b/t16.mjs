import * as T from 'three';
const cam=new T.OrthographicCamera(-20,20,32,-32,.5,80);cam.position.set(-8,13,-12);cam.lookAt(3,0,-2);cam.updateMatrixWorld();
// points behind light's near plane (negative depth) receive no shadow -> lit through walls/ceiling
const pts={throneBack:[0,4,-29],westWallPanel:[-11.9,1.5,-20],northWindow:[0,8,-30.4],ceilingNW:[-10,14.5,-28],pillarNW:[-9.4,5,-26]};
for(const [k,v] of Object.entries(pts)){const p=new T.Vector3(...v).applyMatrix4(cam.matrixWorldInverse);console.log(k,'depth',(-p.z).toFixed(1),'x',p.x.toFixed(1),'y',p.y.toFixed(1),(-p.z<.5||Math.abs(p.x)>20||Math.abs(p.y)>32)?'OUTSIDE(no shadow)':'in');}
// light direction: from (-8,13,-12) to (3,0,-2) => light coming from above-northwest inside the hall; the light source is below the ceiling (y13 < 14.5) and inside walls
console.log('sun inside hall?', Math.abs(-8)<12 && 13<14.5 && -12>-31);
