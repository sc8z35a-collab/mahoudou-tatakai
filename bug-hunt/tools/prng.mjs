let seed=214;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
function stone(floor){const rows=floor?4:8,cols=floor?4:5;for(let r=0;r<rows;r++)for(let c=-1;c<=cols;c++){random();for(let n=0;n<70;n++)for(let k=0;k<6;k++)random();}for(let i=0;i<1024*1024;i++)random();}
stone(false);stone(true);
for(let i=0;i<6;i++){random();random();}
let inside=0;
for(let i=0;i<18;i++){const x=(random()-.5)*8,z=-26.1-random()*2.5,h=.13+random()*.24;random();
 const inThrone=Math.abs(x)<1.2+.05&&z<-27.3+.05&&z>-29.1-.05;
 if(inThrone)inside++;console.log(i,x.toFixed(2),z.toFixed(2),'h',h.toFixed(2),inThrone?'<<INSIDE THRONE FOOTPRINT':'');}
console.log('inside',inside);
