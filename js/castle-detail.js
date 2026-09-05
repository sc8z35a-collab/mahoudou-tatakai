import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function buildCastleDetail({scene,renderer,mat,field,sun,coldLight,flame}){
  const group=new THREE.Group();group.name='eldoria-detailed-architecture';scene.add(group);
  let seed=8201;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const stats={pieces:0,props:0,colliders:0},cache=new Map();
  const geometry=(key,fn)=>{if(!cache.has(key))cache.set(key,fn());return cache.get(key);};
  const mesh=(g,m,x,y,z,p=group)=>{const a=new THREE.Mesh(g,m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;p.add(a);stats.pieces++;return a;};
  const box=(w,h,d,m,x,y,z,p)=>mesh(geometry(`b${w},${h},${d}`,()=>new THREE.BoxGeometry(w,h,d)),m,x,y,z,p);
  const cyl=(rt,rb,h,m,x,y,z,p,n=20)=>mesh(geometry(`c${rt},${rb},${h},${n}`,()=>new THREE.CylinderGeometry(rt,rb,h,n)),m,x,y,z,p);
  const ball=(r,m,x,y,z,p)=>mesh(geometry(`s${r}`,()=>new THREE.SphereGeometry(r,16,12)),m,x,y,z,p);
  const ring=(r,t,m,x,y,z,p)=>mesh(geometry(`t${r},${t}`,()=>new THREE.TorusGeometry(r,t,8,48)),m,x,y,z,p);
  const line=(points,r,m,p=group)=>mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(a=>new THREE.Vector3(...a))),Math.max(16,points.length*6),r,6,false),m,0,0,0,p);
  function tex(size,draw){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;}
  const marble=tex(2048,(ctx,s)=>{
    ctx.fillStyle='#69716a';ctx.fillRect(0,0,s,s);const cell=s/4;
    for(let y=0;y<4;y++)for(let x=0;x<4;x++){
      const light=(x+y)%2===0,base=light?123:79;const v=base+rnd()*14;ctx.fillStyle=`rgb(${v},${v+7},${v+4})`;ctx.fillRect(x*cell+3,y*cell+3,cell-6,cell-6);
      ctx.save();ctx.beginPath();ctx.rect(x*cell+5,y*cell+5,cell-10,cell-10);ctx.clip();
      for(let n=0;n<24;n++){
        ctx.strokeStyle=light?'#d8dcc72a':'#becdc821';ctx.lineWidth=.5+rnd()*2;ctx.beginPath();let px=x*cell+rnd()*cell,py=y*cell;ctx.moveTo(px,py);
        for(let j=0;j<12;j++){px+=(rnd()-.48)*60;py+=cell/10;ctx.lineTo(px,py);}ctx.stroke();
      }
      ctx.strokeStyle='#1a272644';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x*cell+40,y*cell+50);ctx.lineTo(x*cell+90,y*cell+75);ctx.lineTo(x*cell+110,y*cell+130);ctx.stroke();ctx.restore();
      ctx.strokeStyle=light?'#b5b29d88':'#888c7877';ctx.lineWidth=3;ctx.strokeRect(x*cell+12,y*cell+12,cell-24,cell-24);
      ctx.fillStyle='#ab946344';for(const [a,b] of [[24,24],[cell-24,24],[24,cell-24],[cell-24,cell-24]]){ctx.beginPath();ctx.moveTo(x*cell+a,y*cell+b-5);ctx.lineTo(x*cell+a+5,y*cell+b);ctx.lineTo(x*cell+a,y*cell+b+5);ctx.lineTo(x*cell+a-5,y*cell+b);ctx.fill();}
    }
  });marble.wrapS=marble.wrapT=THREE.RepeatWrapping;marble.repeat.set(3,6);
  mat.floor.map=marble;mat.floor.bumpMap=marble;mat.floor.bumpScale=.016;mat.floor.roughness=.43;mat.floor.metalness=.13;mat.floor.needsUpdate=true;
  const woodTexture=tex(1024,(ctx,s)=>{
    ctx.fillStyle='#3c251a';ctx.fillRect(0,0,s,s);
    for(let i=0;i<2200;i++){ctx.strokeStyle=i%3?'#9d713418':'#100d0a38';ctx.lineWidth=rnd()*2;ctx.beginPath();const x=rnd()*s;ctx.moveTo(x,0);ctx.bezierCurveTo(x+25,250,x-20,730,x+5,s);ctx.stroke();}
    for(let i=0;i<8;i++){ctx.fillStyle='#120f0ca0';ctx.fillRect(i*128,0,4,s);}
  });woodTexture.wrapS=woodTexture.wrapT=THREE.RepeatWrapping;
  const wood=new THREE.MeshStandardMaterial({color:0xbca28a,map:woodTexture,bumpMap:woodTexture,bumpScale:.018,roughness:.7});
  const paleStone=new THREE.MeshStandardMaterial({color:0x949888,map:mat.stone.map,roughness:.88});
  const bronze=new THREE.MeshStandardMaterial({color:0x846738,metalness:.77,roughness:.34});
  const blackIron=new THREE.MeshStandardMaterial({color:0x242d2a,metalness:.78,roughness:.47});
  const parchment=new THREE.MeshStandardMaterial({color:0xc0b48c,roughness:.95,side:THREE.DoubleSide});
  const wax=new THREE.MeshStandardMaterial({color:0xc6b78b,roughness:.86});
  const ceramic=new THREE.MeshStandardMaterial({color:0x394e4d,metalness:.25,roughness:.31});
  const bookMats=[0x38221b,0x3b4534,0x1c3442,0x632c28,0x57503a].map(color=>new THREE.MeshStandardMaterial({color,roughness:.8}));

  // Register the real hall envelope, columns, braziers and stepped throne platform.
  field.box('west-wall',-12.5,-7,1,49,-.5,15);field.box('east-wall',12.5,-7,1,49,-.5,15);
  field.box('north-wall',0,-31,25,1,-.5,15);
  for(const side of [-1,1])field.box('raised-wall-panelling',side*11.915,-7,.30,47,0,2.65);
  field.box('entrance-wall-left',-8,17.5,9,1,-.5,15);field.box('entrance-wall-right',8,17.5,9,1,-.5,15);
  field.box('closed-oak-gate',0,17.35,7, .55,0,8);
  for(const x of [-9.4,9.4])for(let z=-26;z<=14;z+=8){
    field.box('pillar-square-plinth',x,z,1.8,1.8,0,.32);field.circle('pillar-base',x,z,.78,.32,1.02);field.circle('fluted-column',x,z,.65,1.02,10.5);
  }
  for(const x of [-7.8,7.8])for(const z of [-21,-9,5]){
    field.circle('brazier-foot',x,z,.48,0,.24);field.circle('brazier-stem',x,z,.16,.24,1.7);field.circle('brazier-bowl',x,z,.39,1.7,2.3);
  }
  for(let i=0;i<6;i++)field.box(`dais-step-${i+1}`,0,-26-i*.3,11-i*.32,7-i*.66,i*.27,(i+1)*.27,0,true);
  field.box('throne-foot',0,-28.2,2.4,1.8,1.62,2.03);
  field.box('throne-back',0,-28.85,2.3,.4,2.03,5.7);
  for(const x of [-1,1])field.box('throne-arm',x,-28.2,.3,1.7,2.03,3.0);

  // Entrance: massive framed oak doors complete the formerly open edge of the floor.
  for(const x of [-8,8])box(9,15,1,mat.stone,x,7,17.5);
  box(7,7.6,.48,wood,0,3.8,17.34);
  for(let i=-5;i<=5;i++)box(.035,7.3,.035,blackIron,i*.57,3.8,17.075);
  for(const x of [-1.6,1.6]){
    for(const y of [1.1,3.4,6.5]){box(2.7,.12,.085,blackIron,x,y,17.04);for(let n=-3;n<=3;n++)ball(.028,bronze,x+n*.34,y,16.98);}
    const handle=ring(.16,.03,bronze,x*.21,3.1,16.96);box(.12,.4,.1,blackIron,x*.21,3.1,17.02);
  }
  for(const x of [-3.65,3.65]){box(.44,8.4,.8,paleStone,x,4.2,17.1);box(.72,.3,.9,mat.trim,x,.16,17.1);box(.8,.28,.95,mat.trim,x,8.3,17.1);}
  box(7.9,.5,.9,mat.trim,0,8.6,17.1);

  // Wainscoting, raised panels, rosettes, ribs and carved mouldings throughout the hall.
  for(const side of [-1,1]){
    for(let z=-28;z<=14;z+=2){
      box(.1,2.6,1.72,wood,side*11.93,1.35,z);
      box(.14,.1,1.66,bronze,side*11.85,2.51,z);box(.14,.075,1.66,bronze,side*11.85,.23,z);
      for(const zz of [-.74,.74])box(.15,2.18,.045,bronze,side*11.84,1.38,z+zz);
      const panel=box(.08,1.45,1.10,mat.dark,side*11.82,1.36,z);panel.rotation.x=0;
      const diamond=box(.09,.32,.32,bronze,side*11.76,1.4,z);diamond.rotation.x=Math.PI/4;
    }
    for(const y of [2.85,5.55,10.85]){
      box(.18,.13,47,paleStone,side*11.84,y,-7);
      for(let z=-29;z<17;z+=.42)box(.19,.16,.16,mat.trim,side*11.76,y-.12,z);
    }
    for(let z=-26;z<=14;z+=8){
      for(let a=0;a<8;a++){
        const t=a*Math.PI/4,x=side*9.4+Math.cos(t)*.68,zz=z+Math.sin(t)*.68;
        const acanthus=mesh(new THREE.ConeGeometry(.14,.55,5),paleStone,x,10.06,zz);acanthus.rotation.z=Math.cos(t)*.4;
      }
      const g=new THREE.Group();g.position.set(side*11.80,7.3,z);g.rotation.y=side>0?-Math.PI/2:Math.PI/2;group.add(g);
      ring(.48,.055,bronze,0,0,0,g);for(let a=0;a<8;a++){const t=a*Math.PI/4;ring(.18,.023,paleStone,Math.cos(t)*.26,Math.sin(t)*.26,.01,g);}
    }
  }
  for(let z=-26;z<=14;z+=8){
    for(let x=-8;x<=8;x+=2){box(1.84,.12,6.9,mat.trim,x,14.41,z+2.7);box(1.66,.06,6.5,mat.stone,x,14.33,z+2.7);}
    const boss=ball(.30,bronze,0,14.3,z);boss.scale.y=.35;
  }

  // Engraved mosaic seal: several hundred geometric motifs plus fine canvas linework.
  const sealTexture=tex(2048,(ctx,s)=>{
    ctx.clearRect(0,0,s,s);ctx.translate(s/2,s/2);ctx.strokeStyle='#b89c66';ctx.fillStyle='#b89c66';
    for(const r of [955,934,875,849,679,660,274,250]){ctx.lineWidth=r>800?3:2;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();}
    for(let i=0;i<96;i++){
      ctx.save();ctx.rotate(i*Math.PI/48);ctx.fillRect(-2,887,4,i%4?24:40);
      if(i%4===0){ctx.font='19px serif';ctx.textAlign='center';ctx.fillText(['I','V','X','✦','◇','†'][i%6],0,822);}ctx.restore();
    }
    for(let i=0;i<16;i++){
      ctx.save();ctx.rotate(i*Math.PI/8);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,290);ctx.bezierCurveTo(-150,430,-115,590,0,660);ctx.bezierCurveTo(115,590,150,430,0,290);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,315);ctx.lineTo(0,620);ctx.stroke();for(let j=0;j<5;j++){ctx.beginPath();ctx.ellipse(0,355+j*42,17+j*3,31,0,0,Math.PI*2);ctx.stroke();}ctx.restore();
    }
    ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-140,-60);ctx.lineTo(-174,-186);ctx.lineTo(-66,-121);ctx.lineTo(0,-229);ctx.lineTo(66,-121);ctx.lineTo(174,-186);ctx.lineTo(140,-60);ctx.closePath();ctx.stroke();
    ctx.fillRect(-9,-30,18,235);ctx.fillRect(-99,14,198,12);
    ctx.globalCompositeOperation='destination-out';for(let i=0;i<14000;i++){ctx.globalAlpha=rnd()*.4;ctx.fillRect(rnd()*s-s/2,rnd()*s-s/2,1+rnd()*4,1+rnd()*3);}
  });
  const sealMat=new THREE.MeshStandardMaterial({map:sealTexture,transparent:true,metalness:.65,roughness:.6,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  const seal=mesh(new THREE.PlaneGeometry(12.1,12.1),sealMat,0,.026,-3);seal.rotation.x=-Math.PI/2;seal.castShadow=false;
  for(const x of [-6.95,6.95]){
    box(.045,.009,42,bronze,x,.008,-6);
    for(let z=-26;z<14;z+=.5){const d=box(.15,.009,.15,bronze,x,.009,z);d.rotation.y=Math.PI/4;}
  }
  const carpetMap=tex(1024,(ctx,s)=>{
    ctx.fillStyle='#4d2020';ctx.fillRect(0,0,s,s);
    for(const x of [22,70,s-70,s-22]){ctx.strokeStyle='#ad864c';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,s);ctx.stroke();}
    for(let y=0;y<s;y+=96){ctx.strokeStyle='#a184554c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(s/2,y);ctx.lineTo(s/2+110,y+48);ctx.lineTo(s/2,y+96);ctx.lineTo(s/2-110,y+48);ctx.closePath();ctx.stroke();}
    for(let i=0;i<30000;i++){ctx.fillStyle=i%2?'#d1b89309':'#09070818';ctx.fillRect(rnd()*s,rnd()*s,1,4);}
  });carpetMap.wrapS=carpetMap.wrapT=THREE.RepeatWrapping;carpetMap.repeat.set(1,4);mat.carpet.map=carpetMap;mat.carpet.needsUpdate=true;

  // Many individually modelled props, grouped into believable clusters in the aisles.
  const propGroup=(x,z,angle=0)=>{stats.props++;const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=angle;group.add(g);return g;};
  function book(x,y,z,p,lying=true){const m=bookMats[Math.floor(rnd()*bookMats.length)],w=.16+rnd()*.09,h=.26+rnd()*.09;
    const g=new THREE.Group();g.position.set(x,y,z);p.add(g);if(lying)g.rotation.z=Math.PI/2;
    box(w,h,.065,parchment,0,0,0,g);for(const zz of [-.042,.042])box(w+.025,h+.02,.013,m,0,0,zz,g);
    box(.021,h+.025,.095,m,-w/2,0,0,g);for(const yy of [-h*.3,h*.3])box(.024,.012,.099,bronze,-w/2,yy,0,g);return g;
  }
  function goblet(x,y,z,p){cyl(.11,.07,.15,bronze,x,y+.17,z,p);cyl(.019,.022,.15,bronze,x,y+.04,z,p);cyl(.085,.08,.026,bronze,x,y-.045,z,p);}
  function candle(x,y,z,p,lit=true){const h=.13+rnd()*.22;cyl(.07,.055,.035,bronze,x,y+.02,z,p);cyl(.035,.043,h,wax,x,y+.035+h/2,z,p);for(let i=0;i<3;i++)ball(.017,wax,x+Math.cos(i*2)*.033,y+.07+h*.5,z+Math.sin(i*2)*.033,p);
    if(lit){p.updateWorldMatrix(true,false);const v=new THREE.Vector3(x,y+h+.045,z).applyMatrix4(p.matrixWorld);flame(v.x,v.y,v.z,.6);}
  }
  function table(x,z,angle){
    const g=propGroup(x,z,angle);box(1.05,.15,2.7,wood,0,1.11,0,g);box(.9,.09,2.48,bronze,0,1.0,0,g);
    for(const xx of [-.38,.38])for(const zz of [-1.08,1.08]){cyl(.075,.11,1,wood,xx,.51,zz,g);box(.14,.08,.14,blackIron,xx,.13,zz,g);}
    for(let i=0;i<4;i++)book((rnd()-.5)*.55,1.23+i*.012,(rnd()-.5)*1.7,g,true);
    goblet(-.25,1.23,.8,g);goblet(.28,1.23,-.72,g);candle(.2,1.2,.17,g);candle(-.27,1.2,-1.05,g);
    const scroll=mesh(new THREE.PlaneGeometry(.5,.6),parchment,0,1.201,-.25,g);scroll.rotation.x=-Math.PI/2;
    for(const zz of [-.55,.05]){const roll=cyl(.028,.028,.52,parchment,0,1.23,zz,g);roll.rotation.z=Math.PI/2;}
    field.box('writing-table',x,z,1.05,2.7,0,1.20,angle);
  }
  for(const x of [-10.85,10.85])for(const z of [-21,-5,11])table(x,z,(rnd()-.5)*.06);
  function bench(x,z,angle=0){const g=propGroup(x,z,angle);box(.56,.10,1.8,wood,0,.53,0,g);for(const zz of [-.7,.7]){box(.42,.46,.16,wood,0,.26,zz,g);box(.6,.05,.24,blackIron,0,.04,zz,g);}field.box('bench',x,z,.56,1.8,0,.59,angle);}
  for(const x of [-8.1,8.1])for(const z of [-14,0,11])bench(x,z,(rnd()-.5)*.12);
  function barrel(x,z,s=1){const g=propGroup(x,z);g.scale.setScalar(s);const b=cyl(.33,.33,.8,wood,0,.43,0,g,24);b.scale.x=1.02;
    for(const y of [.10,.28,.61,.78]){const r=ring(.335,.026,blackIron,0,y,0,g);r.rotation.x=Math.PI/2;}
    cyl(.33,.33,.04,wood,0,.85,0,g);box(.035,.02,.6,blackIron,0,.879,0,g);field.circle('oak-barrel',x,z,.35*s,0,.9*s);
  }
  for(const side of [-1,1])for(const z of [-28.9,-12.9,15.5]){barrel(side*11.3,z,.85);barrel(side*10.5,z+.5,.68);}
  function chest(x,z,angle){const g=propGroup(x,z,angle);box(.78,.5,1.1,wood,0,.3,0,g);const lid=cyl(.40,.40,1.1,wood,0,.54,0,g);lid.rotation.x=Math.PI/2;lid.scale.x=1;
    for(const zz of [-.40,.40])box(.81,.07,.075,blackIron,0,.61,zz,g);box(.10,.18,.045,bronze,0,.45,.574,g);
    field.box('ironbound-chest',x,z,.82,1.15,0,.97,angle);
  }
  chest(-10.8,3,.12);chest(10.7,-17,.1);chest(-7.1,-28.1,-.07);
  function rack(x,z,angle){const g=propGroup(x,z,angle);for(const zz of [-.8,.8]){box(.14,1.9,.14,wood,0,.96,zz,g);box(.65,.09,.25,wood,0,.06,zz,g);}box(.14,.12,1.75,wood,0,1.4,0,g);
    for(let i=0;i<5;i++){const zz=-.65+i*.32;const spear=cyl(.018,.024,2.3,wood,0,1.22,zz,g,8);const tip=mesh(new THREE.ConeGeometry(.059,.28,4),mat.iron,0,2.51,zz,g);box(.22,.04,.04,bronze,0,2.28,zz,g);}
    field.box('weapon-rack',x,z,.65,1.95,0,2.67,angle);
  }
  rack(-11.1,-17,0);rack(11.1,3,0);rack(-10.85,7,0);
  function urn(x,z,y=0){const g=propGroup(x,z);g.position.y=y;cyl(.24,.36,.25,paleStone,0,.125,0,g);cyl(.24,.15,.18,ceramic,0,.34,0,g);const body=ball(.29,ceramic,0,.59,0,g);body.scale.y=1.25;cyl(.17,.23,.16,bronze,0,.94,0,g);ring(.14,.027,bronze,0,.99,0,g).rotation.x=Math.PI/2;
    field.circle('ceremonial-urn',x,z,.37,y,y+1.06);
  }
  for(const x of [-5.4,5.4]){urn(x,-25,field.ground(x,-25));urn(x,-29.4,field.ground(x,-29.4));}
  for(const side of [-1,1])for(const z of [-24,-8,8])urn(side*11.15,z);
  function statue(x,z){const g=propGroup(x,z);box(.98,.28,.98,paleStone,0,.14,0,g);box(.77,.78,.77,mat.stone,0,.66,0,g);box(.98,.16,.98,paleStone,0,1.13,0,g);
    for(const xx of [-.16,.16])cyl(.085,.12,.68,paleStone,xx,1.56,0,g);const torso=ball(.27,paleStone,0,2.1,0,g);torso.scale.set(1,1.55,.65);ball(.17,paleStone,0,2.65,0,g);
    for(const xx of [-.29,.29]){const arm=cyl(.09,.075,.60,paleStone,xx,2.13,.03,g);arm.rotation.z=xx>.0?-.22:.22;}
    box(.045,1.30,.055,bronze,0,1.8,.25,g);box(.43,.055,.06,bronze,0,2.17,.25,g);
    field.box('guardian-statue-plinth',x,z,.98,.98,0,1.22);field.circle('guardian-statue',x,z,.43,1.22,2.86);
  }
  for(const side of [-1,1])for(const z of [-29,-1,15])statue(side*5.55,z);

  // Small surface dressing: candles, bowls, books, coins, pottery and masonry chips.
  for(const side of [-1,1])for(const z of [-27,-19,-11,-3,5,13]){
    const g=propGroup(side*11.45,z);box(.6,.12,.86,mat.trim,0,2.85,0,g);for(let i=0;i<3;i++)candle((i-1)*.15,2.92,(rnd()-.5)*.35,g);
  }
  for(let i=0;i<120;i++){
    const x=(rnd()>.5?1:-1)*(10.0+rnd()*1.65),z=-29+rnd()*45;
    if(!field.freeAt(x,z,.16))continue;const chip=mesh(new THREE.DodecahedronGeometry(.025+rnd()*.07,0),mat.trim,x,.04,z);chip.scale.set(1,.5,1.5);chip.rotation.set(rnd(),rnd()*6,rnd());
  }
  for(let i=0;i<45;i++){
    const x=(rnd()-.5)*9,z=-24.6+rnd()*1.0,y=field.ground(x,z);const g=propGroup(x,z);g.position.y=y;
    if(i%3===0)candle(0,0,0,g);else {const coin=cyl(.025,.025,.007,bronze,0,.006,0,g,10);}
  }
  for(const side of [-1,1])for(let i=0;i<6;i++){
    const x=side*(10.4+rnd()),z=-28+rnd()*44,r=.10+rnd()*.1;
    if(!field.freeAt(x,z,r+.04))continue;
    const g=propGroup(x,z),pot=ball(r,ceramic,0,r*1.4,0,g);pot.scale.y=1.4;
    field.circle('floor-pottery',x,z,r,0,r*2.8);
  }

  // Real textured spotlights project mullions and stained colours, not flat light planes.
  const gobo=tex(1024,(ctx,s)=>{
    ctx.fillStyle='#000000';ctx.fillRect(0,0,s,s);ctx.save();ctx.beginPath();ctx.moveTo(160,880);ctx.lineTo(864,880);ctx.lineTo(864,410);ctx.quadraticCurveTo(850,180,512,70);ctx.quadraticCurveTo(175,180,160,410);ctx.closePath();ctx.clip();
    const colors=['#a7c2cb','#d1b580','#879fb4','#bcbaa0'];for(let y=0;y<8;y++)for(let x=0;x<6;x++){ctx.fillStyle=colors[(x+y)%4];ctx.fillRect(x*171+8,y*128+8,153,110);}
    ctx.fillStyle='#000000';ctx.fillRect(497,0,30,s);for(const y of [390,650])ctx.fillRect(0,y,s,22);ctx.restore();
  });
  const spotlights=[];
  for(const z of [-22,-6,10]){
    const light=new THREE.SpotLight(0xe0e6d6,100,31,.59,.44,1.5);light.position.set(-11.5,10.4,z);light.target.position.set(1.8,.1,z+3.7);light.map=gobo;
    light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.bias=-.0002;light.shadow.normalBias=.035;light.shadow.radius=2;scene.add(light,light.target);spotlights.push(light);
  }
  const warm=new THREE.PointLight(0xffc479,16,19,1.6);warm.position.set(0,5,-27);scene.add(warm);
  const entryLight=new THREE.PointLight(0xb0c8d9,14,17,1.7);entryLight.position.set(0,6,14);scene.add(entryLight);
  sun.intensity=2.8;sun.shadow.mapSize.set(4096,4096);sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=32;sun.shadow.camera.bottom=-32;sun.shadow.camera.far=80;sun.shadow.camera.updateProjectionMatrix();
  coldLight.intensity=1.05;scene.fog.density=.014;renderer.toneMappingExposure=1.1;
  scene.children.filter(o=>o.isHemisphereLight).forEach(o=>o.intensity=1.15);
  // Merge immutable geometry by material, keeping thousands of details without
  // thousands of draw calls. Colliders and lights remain separate runtime objects.
  group.updateMatrixWorld(true);const buckets=new Map();
  group.traverse(o=>{if(!o.isMesh)return;let g=o.geometry.clone();if(g.index)g=g.toNonIndexed();g.applyMatrix4(o.matrixWorld);if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
    const key=o.material.uuid;if(!buckets.has(key))buckets.set(key,{material:o.material,geometries:[]});buckets.get(key).geometries.push(g);
  });
  scene.remove(group);const batch=new THREE.Group();batch.name='castle-detail-batches';scene.add(batch);
  for(const {material,geometries} of buckets.values()){
    const g=mergeGeometries(geometries,false);if(g){const m=new THREE.Mesh(g,material);m.castShadow=!material.transparent;m.receiveShadow=true;batch.add(m);}geometries.forEach(g=>g.dispose());
  }
  stats.colliders=field.solids.length;field.buildNavigation();
  console.info(`ELDORIA: ${stats.pieces} architectural/prop pieces, ${stats.props} clusters, ${stats.colliders} collision volumes.`);
  return {stats,spotlights,batch,setQuality(value){for(const light of spotlights)light.castShadow=value!=='standard';}};
}
