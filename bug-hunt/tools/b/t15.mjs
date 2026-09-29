import * as T from 'three';
const cam=new T.OrthographicCamera(-20,20,32,-32,.5,80);cam.position.set(-8,13,-12);cam.lookAt(3,0,-2);cam.updateMatrixWorld();
let n=0,bad=0;const regions={};
for(let x=-12;x<=12;x+=.25)for(let z=-30.5;z<=17;z+=.25){const y=(Math.abs(x)<5.5&&z<-25.8)?1.6:0;const p=new T.Vector3(x,y,z).applyMatrix4(cam.matrixWorldInverse);n++;if(!(Math.abs(p.x)<=20&&Math.abs(p.y)<=32&&-p.z>=.5&&-p.z<=80)){bad++;const k=(z<-20?'north':z>10?'south':'mid')+(x<0?'-west':'-east');regions[k]=(regions[k]||0)+1;}}
const th=new T.Vector3(0,3.5,-28.2).applyMatrix4(cam.matrixWorldInverse);
console.log('floor outside shadow frustum %',(bad/n*100).toFixed(1),regions,'throne top in frustum?',Math.abs(th.x)<=20&&Math.abs(th.y)<=32&&-th.z>=.5, th.toArray().map(v=>v.toFixed(1)));
