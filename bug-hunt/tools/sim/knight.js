import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// +Z is the character's forward direction. Anatomical right is -X.
// The weapon's +Y axis runs from pommel through grip, guard and blade tip.
const UP = new THREE.Vector3(0, 1, 0);
const smooth = t => { t = THREE.MathUtils.clamp(t, 0, 1); return t*t*(3-2*t); };
const mix = THREE.MathUtils.lerp;
let shared;
function materialMaps(renderer) {
  if (shared) return shared;
  let seed=971;
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  function texture(size, paint, color=false) {
    const c=document.createElement('canvas');c.width=c.height=size;
    paint(c.getContext('2d'),size);
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;
    if(color)t.colorSpace=THREE.SRGBColorSpace;
    t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;
  }
  const scratches=texture(1024,(ctx,s)=>{
    ctx.fillStyle='#aeb2b3';ctx.fillRect(0,0,s,s);
    for(let i=0;i<16000;i++){
      const x=rand()*s,y=rand()*s;
      ctx.strokeStyle=`rgba(${rand()>.4?'235,240,244':'35,43,48'},${.015+rand()*.09})`;
      ctx.lineWidth=.3+rand()*.8;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+2+rand()*37,y+(rand()-.5)*5);ctx.stroke();
    }
    for(let i=0;i<65;i++){
      const x=rand()*s,y=rand()*s;ctx.strokeStyle='#151f2433';ctx.lineWidth=.65;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+9+rand()*55,y+rand()*38);ctx.stroke();
    }
  },true);
  const rough=texture(512,(ctx,s)=>{
    ctx.fillStyle='#a0a0a0';ctx.fillRect(0,0,s,s);
    for(let i=0;i<8000;i++){const v=115+rand()*75;ctx.fillStyle=`rgb(${v},${v},${v})`;ctx.fillRect(rand()*s,rand()*s,1+rand()*5,1);}
  });
  const mail=texture(512,(ctx,s)=>{
    ctx.fillStyle='#172025';ctx.fillRect(0,0,s,s);
    for(let y=-12;y<s+12;y+=19)for(let x=-12;x<s+12;x+=22){
      const xx=x+(Math.round(y/19)%2)*11;
      ctx.lineWidth=4;ctx.strokeStyle='#727e83';ctx.beginPath();ctx.ellipse(xx,y,9,6,.45,0,Math.PI*2);ctx.stroke();
      ctx.lineWidth=1.2;ctx.strokeStyle='#cad1d2';ctx.beginPath();ctx.ellipse(xx-1,y-1,8,5,.45,Math.PI,Math.PI*1.85);ctx.stroke();
    }
  },true);mail.repeat.set(2,2);
  const weave=texture(512,(ctx,s)=>{
    ctx.fillStyle='#999999';ctx.fillRect(0,0,s,s);
    for(let i=0;i<s;i+=4){ctx.fillStyle=i%8?'#8b8b8b':'#b0b0b0';ctx.fillRect(i,0,1,s);ctx.fillRect(0,i,s,1);}
  });weave.repeat.set(3,5);
  const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();
  const envTarget=pmrem.fromScene(room,.03);room.dispose();pmrem.dispose();
  shared={scratches,rough,mail,weave,env:envTarget.texture,envTarget};return shared;
}

export function restoreKnightEnvironment(renderer,fighters){
  if(!shared)return;
  const oldTexture=shared.env,oldTarget=shared.envTarget;
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
  shared.envTarget=pmrem.fromScene(room,.03);shared.env=shared.envTarget.texture;
  for(const f of fighters)f.root.traverse(object=>{for(const material of (Array.isArray(object.material)?object.material:[object.material]))if(material?.envMap===oldTexture){material.envMap=shared.env;material.needsUpdate=true;}});
  room.dispose();pmrem.dispose();oldTarget.dispose();
}
export function createKnight(scene, renderer, enemy=false) {
  const maps=materialMaps(renderer);
  const root=new THREE.Group();root.name=enemy?'crown-warden':'player-knight';scene.add(root);
  const steel=new THREE.MeshPhysicalMaterial({color:enemy?0x596775:0x91a3af,map:maps.scratches,roughnessMap:maps.rough,metalness:.91,roughness:.38,envMap:maps.env,envMapIntensity:.8,clearcoat:.23,clearcoatRoughness:.3,bumpMap:maps.rough,bumpScale:.0018});
  const edge=new THREE.MeshStandardMaterial({color:enemy?0xc29d54:0xb7c5cd,metalness:.9,roughness:.26,envMap:maps.env,envMapIntensity:.9});
  const gold=new THREE.MeshStandardMaterial({color:enemy?0xd1ab58:0xa89057,metalness:.88,roughness:.32,envMap:maps.env,envMapIntensity:.65});
  const darkSteel=new THREE.MeshStandardMaterial({color:0x283540,map:maps.scratches,metalness:.8,roughness:.5,envMap:maps.env,envMapIntensity:.45});
  const leather=new THREE.MeshStandardMaterial({color:0x271c16,bumpMap:maps.weave,bumpScale:.008,roughness:.82});
  const chain=new THREE.MeshStandardMaterial({color:0x7b8a94,map:maps.mail,bumpMap:maps.mail,bumpScale:.012,metalness:.78,roughness:.6,envMap:maps.env,envMapIntensity:.4});
  const cloth=new THREE.MeshStandardMaterial({color:enemy?0x4e101b:0x173640,bumpMap:maps.weave,bumpScale:.008,roughness:.95,side:THREE.DoubleSide});
  const black=new THREE.MeshStandardMaterial({color:0x080f15,roughness:.95});
  function mesh(g,m,x=0,y=0,z=0,p=root){const a=new THREE.Mesh(g,m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;p.add(a);return a;}
  function round(w,h,d,m,x,y,z,p,r=.025){return mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/3,h/3,d/3)),m,x,y,z,p);}
  function ball(rx,ry,rz,m,x,y,z,p){const a=mesh(new THREE.SphereGeometry(1,32,24),m,x,y,z,p);a.scale.set(rx,ry,rz);return a;}
  function cyl(a,b,h,m,x,y,z,p,n=24){return mesh(new THREE.CylinderGeometry(a,b,h,n),m,x,y,z,p);}
  function line(points,r,m,p){const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)));return mesh(new THREE.TubeGeometry(curve,Math.max(12,points.length*7),r,7,false),m,0,0,0,p);}
  function rivet(x,y,z,p,m=gold,r=.012){return ball(r,r,r*.5,m,x,y,z,p);}
  // Elliptical armour lofts provide tapered, shaped volumes instead of toy-like boxes.
  function loft(profile,m,p,offset=[0,0,0],ridge=0,segments=48){
    const positions=[],uv=[],indices=[];
    for(let j=0;j<profile.length;j++){
      const [y,rx,rz]=profile[j];
      for(let i=0;i<=segments;i++){
        const a=i/segments*Math.PI*2;const front=Math.max(0,Math.cos(a));
        positions.push(Math.sin(a)*rx,y,Math.cos(a)*rz+Math.pow(front,20)*ridge);
        uv.push(i/segments,j/(profile.length-1));
        if(j<profile.length-1&&i<segments){const k=j*(segments+1)+i;indices.push(k,k+1,k+segments+2,k,k+segments+2,k+segments+1);}
      }
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return mesh(g,m,...offset,p);
  }
  function rim(rx,rz,y,m,p,z=0){const pts=[];for(let i=0;i<=48;i++){const a=i/48*Math.PI*2;pts.push([Math.sin(a)*rx,y,Math.cos(a)*rz+z]);}return line(pts,.009,m,p);}
  function plate(points,depth,m,p,x=0,y=0,z=0){const s=new THREE.Shape();points.forEach(([a,b],i)=>i?s.lineTo(a,b):s.moveTo(a,b));s.closePath();return mesh(new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.008,bevelThickness:.006,bevelSegments:2,curveSegments:24}),m,x,y,z,p);}
  const body=new THREE.Group();body.name='center-of-mass';root.add(body);
  const pelvis=new THREE.Group();pelvis.position.y=1.34;body.add(pelvis);
  const torso=new THREE.Group();torso.position.y=1.5;body.add(torso);
  loft([[-.04,.235,.155],[.15,.235,.17],[.40,.34,.225],[.58,.375,.20],[.70,.245,.16]],chain,torso);
  // Forged breastplate with a pronounced medial ridge and overlapping lower lames.
  loft([[.10,.255,.17],[.21,.29,.20],[.39,.35,.224],[.54,.37,.217],[.63,.30,.17]],steel,torso,[0,0,0],.026);
  rim(.298,.174,.63,edge,torso);rim(.257,.175,.1,edge,torso);
  line([[0,.13,.204],[0,.29,.245],[0,.46,.263],[0,.60,.19]],.008,edge,torso);
  for(const s of [-1,1]){
    line([[s*.08,.56,.213],[s*.17,.48,.225],[s*.25,.40,.188],[s*.19,.22,.18]],.006,gold,torso);
    for(let i=0;i<6;i++)rivet(s*(.26+i*.011),.25+i*.05,.15,torso);
    // Embossed etched flourishes on either half of the cuirass.
    for(let i=0;i<3;i++)line([[s*(.09+i*.027),.39,.247-i*.007],[s*(.14+i*.029),.46,.225-i*.009],[s*(.17+i*.029),.50,.20-i*.012]],.0025,gold,torso);
  }
  for(let i=0;i<4;i++){
    const y=-.055+i*.058,r=.256-i*.006;
    loft([[y,r,.167],[y+.047,r+.007,.175]],steel,torso);rim(r,.17,y,edge,torso);
    for(const s of [-1,1])rivet(s*.20,y+.025,.108,torso);
  }
  // Backplate remains visible above and beside the split cape.
  line([[0,.14,-.175],[0,.35,-.23],[0,.61,-.18]],.01,edge,torso);
  for(const s of [-1,1])line([[s*.07,.58,-.2],[s*.26,.44,-.16],[s*.20,.24,-.15]],.011,edge,torso);
  loft([[-.02,.268,.185],[.07,.27,.186]],leather,pelvis);
  round(.12,.094,.033,gold,0,.029,.203,pelvis,.008);round(.075,.053,.038,leather,0,.029,.221,pelvis,.006);
  for(let i=-5;i<=5;i++)if(i)rivet(i*.043,.025,Math.sqrt(Math.max(0,1-(i*.043/.28)**2))*.19,pelvis,edge,.01);
  // Chainmail skirt and articulated hip plates.
  loft([[-.27,.34,.205],[-.06,.278,.18]],chain,pelvis);
  for(const s of [-1,1])for(let i=0;i<4;i++){
    const p=plate([[-.11,0],[.10,.012],[.125,-.085],[-.115,-.10]],.022,steel,pelvis,s*(.15+i*.008),-.075-i*.052,.16+i*.005);
    p.rotation.y=s*.25;p.rotation.z=-s*.045;
    rivet(s*(.15+i*.008)-.078,-.10-i*.052,.202+i*.005,pelvis);rivet(s*(.15+i*.008)+.078,-.10-i*.052,.202+i*.005,pelvis);
  }
  // Layered gorget, chain coif and a sculpted closed armet helmet.
  cyl(.12,.165,.16,chain,0,.754,0,torso);
  loft([[.67,.185,.155],[.71,.19,.16],[.79,.132,.119]],steel,torso);rim(.19,.16,.71,edge,torso);
  const head=new THREE.Group();head.position.set(0,1.025,0);torso.add(head);
  loft([[-.18,.135,.13],[-.1,.17,.17],[.055,.18,.18],[.17,.142,.145],[.245,.055,.061],[.258,.006,.01]],steel,head,[0,0,0],.012,64);
  // Beaked visor: narrow real eye opening, angular cheeks and breathing holes.
  plate([[-.166,.055],[.166,.055],[.168,-.045],[.085,-.145],[0,-.177],[-.085,-.145],[-.168,-.045]],.018,darkSteel,head,0,0,.137);
  for(const s of [-1,1]){
    const visor=plate([[0,.057],[s*.161,.049],[s*.159,.009],[s*.026,.003]],.022,steel,head,0,0,.153);visor.rotation.y=-s*.12;
    const cheek=plate([[s*.025,-.011],[s*.164,-.018],[s*.133,-.102],[s*.024,-.148]],.016,steel,head,0,0,.17);cheek.rotation.y=s*.15;
    line([[s*.02,.001,.183],[s*.08,.008,.18],[s*.15,.007,.164]],.009,black,head);
    rivet(s*.177,.035,.04,head,gold,.025);
    for(let row=0;row<3;row++)for(let col=0;col<3;col++)ball(.004,.007,.004,black,s*(.060+col*.021),-.039-row*.025,.2-col*.005,head);
  }
  line([[0,-.158,.19],[0,-.034,.222],[0,.065,.198],[0,.17,.137],[0,.258,0],[0,.15,-.15],[0,-.1,-.173]],.012,edge,head);
  for(const s of [-1,1])line([[s*.07,.23,.04],[s*.12,.13,.105],[s*.145,.075,.11]],.004,gold,head);
  if(enemy){
    rim(.175,.17,.10,gold,head);
    for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const prong=mesh(new THREE.ConeGeometry(.024,.10+(i%2)*.06,5),gold,Math.sin(a)*.17,.16,Math.cos(a)*.16,head);prong.rotation.z=-Math.sin(a)*.16;}
  } else {
    // Three restrained steel fins, not a bulky fantasy crown.
    for(let i=0;i<3;i++)round(.015,.045,.18,darkSteel,(i-1)*.024,.242,-.045,head,.006);
  }
  const legs=[];
  for(const s of [1,-1]){
    const hip=new THREE.Group();hip.position.set(s*.18,1.32,0);body.add(hip);
    loft([[-.58,.102,.104],[-.36,.13,.13],[-.09,.151,.158],[.01,.126,.13]],chain,hip);
    loft([[-.52,.115,.125],[-.31,.148,.157],[-.08,.155,.151]],steel,hip,[0,0,.009],.012);
    rim(.155,.157,-.09,edge,hip);rim(.116,.13,-.51,edge,hip);
    line([[0,-.13,.173],[0,-.33,.181],[0,-.49,.15]],.007,edge,hip);
    for(const y of [-.15,-.46])for(const a of [-1,1])rivet(a*.098,y,.108,hip);
    const knee=new THREE.Group();knee.position.y=-.59;hip.add(knee);
    ball(.135,.118,.14,steel,0,0,.025,knee);ball(.08,.079,.03,edge,0,0,.16,knee);
    const wing=plate([[0,.09],[s*.16,.12],[s*.22,0],[s*.13,-.10],[0,-.07]],.025,steel,knee,s*.085,0,-.02);
    loft([[-.51,.072,.088],[-.36,.105,.12],[-.16,.115,.13],[-.065,.097,.107]],steel,knee,[0,0,0],.016);
    line([[0,-.1,.127],[0,-.29,.143],[0,-.48,.108]],.008,edge,knee);rim(.076,.09,-.49,edge,knee);
    for(const y of [-.18,-.4]){
      const band=loft([[y,.11,.12],[y+.035,.11,.12]],leather,knee);band.scale.x=.92;
      round(.034,.051,.029,gold,s*.10,y+.017,.02,knee,.007);
    }
    const ankle=new THREE.Group();ankle.position.set(0,-.56,.025);knee.add(ankle);
    round(.19,.07,.37,leather,0,-.075,.08,ankle,.024);
    for(let i=0;i<6;i++){
      const w=.193-i*.013;round(w,.07-i*.004,.085,steel,0,-.018-i*.005,-.07+i*.057,ankle,.018);
      line([[-w*.44,.017-i*.005,-.04+i*.057],[0,.027-i*.005,-.035+i*.057],[w*.44,.017-i*.005,-.04+i*.057]],.004,edge,ankle);
    }
    legs.push({hip,knee,ankle,side:s});
  }
  const arms=[];
  // Shield at +X (left), sword at -X (right). Camera yaw never changes this mapping.
  for(const s of [1,-1]){
    const shoulder=new THREE.Group();shoulder.position.set(s*.405,.592,0);torso.add(shoulder);
    ball(.16,.15,.17,chain,0,-.02,0,shoulder);
    const cap=ball(.222,.126,.215,steel,s*.035,.027,0,shoulder);
    const capRim=[];for(let j=0;j<=32;j++){const a=j/32*Math.PI*2;capRim.push([s*.035+Math.sin(a)*.217,.007,Math.cos(a)*.21]);}line(capRim,.01,gold,shoulder);
    for(let i=0;i<4;i++){
      const p=loft([[-.10-i*.055,.163-i*.01,.158-i*.008],[-.046-i*.055,.178-i*.01,.17-i*.008]],steel,shoulder,[s*.04,0,0]);
      for(const z of [-.105,.105])rivet(s*(.15-i*.01),-.075-i*.055,z,shoulder);
    }
    loft([[-.36,.077,.085],[-.18,.108,.11],[-.05,.13,.13]],chain,shoulder);
    loft([[-.36,.086,.094],[-.19,.113,.118]],steel,shoulder);rim(.087,.095,-.36,edge,shoulder);
    const elbow=new THREE.Group();elbow.position.y=-.39;shoulder.add(elbow);
    ball(.105,.1,.113,darkSteel,0,0,0,elbow);
    plate([[-.09,.07],[.09,.07],[.13,-.025],[0,-.12],[-.13,-.025]],.025,steel,elbow,0,0,.083);
    loft([[-.37,.070,.078],[-.25,.098,.105],[-.09,.10,.11]],steel,elbow,[0,0,0],.01);
    rim(.071,.079,-.37,edge,elbow);rim(.1,.11,-.10,edge,elbow);
    line([[0,-.12,.123],[0,-.25,.12],[0,-.35,.085]],.006,gold,elbow);
    const hand=new THREE.Group();hand.position.y=-.435;elbow.add(hand);
    round(.115,.13,.075,leather,0,0,0,hand,.022);
    arms.push({shoulder,elbow,hand,side:s});
  }
  const sword=new THREE.Group();sword.name='right-hand-forward-grip';arms[1].hand.add(sword);
  // A forward grip: rotating +Y towards +Z (positive X rotation), never the old -PI/2.
  sword.rotation.x=Math.PI/2;
  cyl(.033,.038,.25,leather,0,-.012,0,sword);
  for(let i=0;i<13;i++){const wrap=mesh(new THREE.TorusGeometry(.036,.004,6,16),darkSteel,0,-.123+i*.018,0,sword);wrap.rotation.x=Math.PI/2;}
  const pommel=ball(.06,.077,.037,edge,0,-.208,0,sword);ball(.024,.031,.005,gold,0,-.208,.039,sword);
  cyl(.047,.04,.045,gold,0,.128,0,sword);
  line([[-.255,.104,0],[-.18,.17,0],[0,.177,0],[.18,.17,0],[.255,.104,0]],.026,edge,sword);
  for(const s of [-1,1])ball(.033,.043,.033,gold,s*.251,.108,0,sword);
  // A diamond-section blade with bevelled cutting edges and a narrow fuller.
  const bladeMat=new THREE.MeshPhysicalMaterial({color:0xc1d0dc,metalness:1,roughness:.2,envMap:maps.env,envMapIntensity:1.1,clearcoat:.25,emissive:0x000000,bumpMap:maps.rough,bumpScale:.0007});
  const verts=[],indices=[];const sections=[[.20,.069],[.32,.068],[1.10,.047],[1.34,.036],[1.54,.001]];
  for(const [y,w] of sections){verts.push(-w,y,0,0,y,.026,w,y,0,0,y,-.026);}
  for(let j=0;j<sections.length-1;j++)for(let i=0;i<4;i++){const a=j*4+i,b=j*4+(i+1)%4,c=b+4,d=a+4;indices.push(a,b,c,a,c,d);}
  const bladeGeo=new THREE.BufferGeometry();bladeGeo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));bladeGeo.setIndex(indices);bladeGeo.computeVertexNormals();
  mesh(bladeGeo,bladeMat,0,0,0,sword);
  for(const s of [-1,1]){
    line([[0,.31,s*.027],[0,.8,s*.026],[0,1.22,s*.026]],.005,darkSteel,sword);
    for(let i=0;i<5;i++)line([[-.015,.34+i*.035,s*.028],[0,.35+i*.035,s*.029],[.015,.34+i*.035,s*.028]],.0015,gold,sword);
  }
  // Four separate gauntlet fingers wrap the grip; the thumb closes above them.
  for(let i=0;i<4;i++){
    const finger=mesh(new THREE.TorusGeometry(.058,.018,8,18,Math.PI*1.7),steel,0,-.095+i*.049,0,sword);finger.rotation.set(Math.PI/2,0,.45);
    round(.067,.036,.025,edge,-.015,-.095+i*.049,-.06,sword,.008);
  }
  const thumb=round(.046,.11,.042,steel,.067,.069,.01,sword,.014);thumb.rotation.z=-.42;
  const tip=new THREE.Object3D();tip.position.y=1.54;sword.add(tip);
  const bladeBase=new THREE.Object3D();bladeBase.position.y=.22;sword.add(bladeBase);
  const grip=new THREE.Object3D();grip.name='grip-origin';sword.add(grip);
  const shield=new THREE.Group();shield.name='left-forearm-shield';arms[0].hand.add(shield);shield.position.set(0,.10,.065);
  const shieldOutline=[[-.26,.38],[0,.42],[.26,.38],[.235,-.10],[.13,-.32],[0,-.43],[-.13,-.32],[-.235,-.10]];
  plate(shieldOutline,.034,leather,shield,0,0,0);plate(shieldOutline.map(([x,y])=>[x*.96,y*.96]),.022,darkSteel,shield,0,0,.039);
  const perimeter=shieldOutline.map(([x,y])=>[x,y,.075]);perimeter.push(perimeter[0]);line(perimeter,.018,edge,shield);
  plate([[-.017,.33],[.017,.33],[.017,.10],[.17,.10],[.17,.06],[.017,.06],[.017,-.30],[-.017,-.30],[-.017,.06],[-.17,.06],[-.17,.10],[-.017,.10]],.009,gold,shield,0,0,.081);
  ball(.075,.077,.04,steel,0,.08,.1,shield);
  for(const [x,y] of shieldOutline)rivet(x*.87,y*.9,.084,shield,gold,.011);
  for(const y of [-.13,.15])round(.34,.045,.04,leather,0,y,-.035,shield,.01);
  // Diagonal leather baldric and worn scabbard at the opposite hip.
  const baldric=round(.071,.75,.035,leather,.07,.37,-.211,torso,.009);baldric.rotation.z=-.61;
  const scabbard=new THREE.Group();scabbard.position.set(.3,1.32,-.11);scabbard.rotation.set(.2,0,-.22);body.add(scabbard);
  round(.10,1.05,.065,leather,0,-.54,0,scabbard,.025);round(.105,.08,.071,gold,0,-.06,0,scabbard,.015);round(.082,.10,.065,edge,0,-1.055,0,scabbard,.02);
  // The split cape exposes the silhouette instead of hiding it behind a flat rectangle.
  const capeGeo=new THREE.PlaneGeometry(.74,1.39,24,36);
  const attr=capeGeo.attributes.position;
  for(let i=0;i<attr.count;i++){
    const y=attr.getY(i),lower=(.695-y)/1.39,x=attr.getX(i);
    attr.setX(i,x*(.79+lower*.34));
    attr.setY(i,y+Math.pow(lower,12)*(.07+Math.max(0,.11-Math.abs(x))*.9));
    attr.setZ(i,Math.sin(x*28)*.015*lower-lower*.07);
  }
  capeGeo.computeVertexNormals();const cape=mesh(capeGeo,cloth,0,-.14,-.225,torso);cape.name='weighted-split-cape';
  const capeBase=Float32Array.from(attr.array);
  for(const s of [-1,1]){ball(.055,.047,.017,gold,s*.23,.53,-.205,torso);line([[s*.23,.53,-.224],[s*.16,.48,-.24],[0,.45,-.245]],.008,edge,torso);}
  const shadow=mesh(new THREE.CircleGeometry(.49,48),new THREE.MeshBasicMaterial({color:0x080e12,transparent:true,opacity:.18,depthWrite:false}),0,.016,0,root);shadow.rotation.x=-Math.PI/2;
  root.scale.setScalar(enemy?1.07:1);
  const trailGeo=new THREE.BufferGeometry();trailGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(18*6*3),3));trailGeo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(18*6*3),3));
  const trailMat=new THREE.LineBasicMaterial({color:enemy?0xe6a17b:0xd0e9f3,vertexColors:true,transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending});
  const trail=new THREE.Line(trailGeo,trailMat);trail.frustumCulled=false;trail.visible=false;scene.add(trail);
  return {root,body,torso,pelvis,head,legs,arms,sword,shield,bladeMat,tip,bladeBase,grip,cape,capeBase,trail,trailHistory:[],enemy,hp:enemy?150:100,stamina:100,attackTime:-1,attackDuration:.68,attackHit:false,cooldown:0,guard:false,dodgeTime:0,dodgeVector:new THREE.Vector3(),hurt:0,walk:0,moving:0,combo:0,dead:false,aiTimer:1.2,strafe:1,guardTime:0,motion:{speed:0,forward:0,side:0,lastPosition:root.position.clone(),guard:0,recoil:0,death:0,initialized:false}};
}

// Poses are expressed in the skeleton's local axes. Each attack has anticipation,
// an accelerated cut, a follow-through and a return to guard (no angle snapping).
const REST={sx:.16,sy:-.10,sz:.12,ex:-1.00,wx:1.49,wz:-.08,tw:-.12,lean:.025,step:0};
const CUTS=[
  [
    [0,REST],
    [.32,{sx:-1.86,sy:-.24,sz:.39,ex:-.89,wx:1.43,wz:-.20,tw:-.48,lean:-.055,step:-.05}],
    [.47,{sx:-1.28,sy:.15,sz:.25,ex:-.41,wx:1.83,wz:.06,tw:-.14,lean:.04,step:.05}],
    [.59,{sx:-.38,sy:.70,sz:-.51,ex:-.30,wx:2.17,wz:.17,tw:.43,lean:.14,step:.19}],
    [.75,{sx:.30,sy:.79,sz:-.56,ex:-.31,wx:2.00,wz:.15,tw:.46,lean:.13,step:.16}],
    [1,REST]
  ],
  [
    [0,REST],
    [.32,{sx:-.80,sy:1.13,sz:-.64,ex:-1.2,wx:1.85,wz:.10,tw:.48,lean:-.035,step:-.035}],
    [.47,{sx:-.45,sy:.51,sz:-.16,ex:-.48,wx:1.83,wz:.0,tw:.16,lean:.04,step:.045}],
    [.59,{sx:-.20,sy:-.66,sz:.59,ex:-.34,wx:2.08,wz:-.22,tw:-.42,lean:.1,step:.15}],
    [.76,{sx:.08,sy:-.80,sz:.68,ex:-.6,wx:1.95,wz:-.20,tw:-.43,lean:.08,step:.12}],
    [1,REST]
  ]
];
function samplePose(progress,combo){
  const frames=CUTS[combo%2];let i=1;while(i<frames.length-1&&progress>frames[i][0])i++;
  const a=frames[i-1],b=frames[i],t=smooth((progress-a[0])/(b[0]-a[0]));
  const result={};for(const k of Object.keys(REST))result[k]=mix(a[1][k],b[1][k],t);return result;
}
export function resetKnightMotion(f){
  Object.assign(f.motion,{speed:0,forward:0,side:0,guard:0,recoil:0,death:0,initialized:false});
  f.motion.lastPosition.copy(f.root.position);f.trailHistory.length=0;f.trail.visible=false;
  f.body.position.set(0,0,0);f.body.rotation.set(0,0,0);f.torso.position.set(0,1.5,0);f.torso.rotation.set(0,0,0);f.pelvis.rotation.set(0,0,0);
}
export function animateKnight(f,dt,time,progress=-1){
  const m=f.motion;
  const delta=f.root.position.clone().sub(m.lastPosition);m.lastPosition.copy(f.root.position);
  delta.setY(0).applyAxisAngle(UP,-f.root.rotation.y);
  const actualSpeed=m.initialized?Math.min(1,delta.length()/Math.max(.001,dt)/3.5):0;m.initialized=true;
  m.speed=THREE.MathUtils.damp(m.speed,f.moving>.01?Math.max(actualSpeed,f.moving*.45):0,12,dt);
  if(delta.lengthSq()>.000001){m.forward=THREE.MathUtils.damp(m.forward,delta.z/(delta.length()||1),12,dt);m.side=THREE.MathUtils.damp(m.side,delta.x/(delta.length()||1),12,dt);}
  m.guard=THREE.MathUtils.damp(m.guard,f.guard?1:0,16,dt);
  m.recoil=THREE.MathUtils.damp(m.recoil,f.hurt>0?1:0,f.hurt>0?28:9,dt);
  f.walk+=dt*(7.5+2.5*m.speed)*m.speed;
  const gait=Math.sin(f.walk),breath=Math.sin(time*2.4+(f.enemy?1:0));
  const dodge=f.dodgeTime>0?Math.sin(Math.PI*(1-THREE.MathUtils.clamp(f.dodgeTime/.43,0,1))):0;
  const p=progress>=0?samplePose(Math.min(progress,1),f.combo):{...REST};
  const guard=m.guard;
  f.body.position.set(gait*.013*m.speed,-.028-Math.abs(gait)*.025*m.speed-dodge*.14-Math.max(0,p.step)*.28,0);
  f.body.rotation.set(0,0,-m.side*m.speed*.035);
  f.torso.position.set(0,1.5+breath*.004,p.step);
  f.torso.rotation.set(p.lean+m.forward*m.speed*.075+dodge*.30-m.recoil*.14,p.tw,-m.side*dodge*.17);
  f.pelvis.rotation.set(0,-gait*.048*m.speed+p.tw*.25,0);
  f.head.rotation.set(-f.torso.rotation.x*.45,-p.tw*.56,breath*.006);
  // Bent knees, reciprocal hip motion and counter-rotating feet prevent a rigid march.
  for(let i=0;i<2;i++){
    const leg=f.legs[i],cycle=f.walk+i*Math.PI,s=Math.sin(cycle),lift=Math.max(0,s),speed=m.speed;
    leg.hip.rotation.set(-.09-s*.42*speed*m.forward-p.step*(i===1?1.9:-.95)-dodge*.27,0,leg.side*.04-m.side*s*.20*speed);
    leg.knee.rotation.x=.14+lift*.49*speed+dodge*.43+guard*.055+Math.max(0,p.step)*(i===1?1.45:.25);
    leg.ankle.rotation.x=-leg.hip.rotation.x-leg.knee.rotation.x+lift*.13*speed;
    leg.hip.position.y=1.32+lift*.028*speed;
  }
  const left=f.arms[0],right=f.arms[1];
  right.shoulder.rotation.set(mix(p.sx,-.21,guard)-breath*.008,p.sy,mix(p.sz,.2,guard));
  right.elbow.rotation.set(mix(p.ex,-1.31,guard),0,0);
  // Do not modify this with root.rotation.y: the sword inherits facing from its hand.
  f.sword.rotation.set(mix(p.wx,1.74,guard),0,p.wz);
  left.shoulder.rotation.set(mix(-.03,-.49,guard)-dodge*.14,0,mix(-.13,-.27,guard));
  left.elbow.rotation.set(mix(-.70,-1.1,guard),0,0);
  f.shield.rotation.set(-(left.shoulder.rotation.x+left.elbow.rotation.x)-.04,.13,0);
  const cape=f.cape.geometry.attributes.position;
  for(let i=0;i<cape.count;i++){
    const x=f.capeBase[i*3],y=f.capeBase[i*3+1],lower=THREE.MathUtils.clamp((.695-y)/1.39,0,1);
    cape.setXYZ(i,x+Math.sin(time*3-y*4)*.017*lower*m.speed,y,
      f.capeBase[i*3+2]-Math.pow(lower,1.7)*(.06+m.speed*.24+dodge*.19)+Math.sin(time*3.5-y*5+x*12)*.035*lower+Math.sin(x*27)*.018*lower-p.tw*lower*x*.18);
  }
  cape.needsUpdate=true;f.cape.geometry.computeVertexNormals();
  if(f.dead){
    m.death=Math.min(1,m.death+dt*.85);const fall=smooth(m.death);
    f.body.rotation.x=-fall*1.44;f.body.position.y=fall*.19;
    f.torso.rotation.x=-.08;right.shoulder.rotation.z+=fall*.6;left.shoulder.rotation.z-=fall*.45;
  }
  // Trail endpoints are sampled from the actual blade, not a generic ring at the waist.
  f.root.updateMatrixWorld(true);
  // Ground correction for the soles during crouches and weight transfer.
  if(!f.dead){
    let soleY=Infinity;
    for(const leg of f.legs)for(const x of [-.095,.095])for(const z of [-.105,.265]){
      soleY=Math.min(soleY,new THREE.Vector3(x,-.11,z).applyMatrix4(leg.ankle.matrixWorld).y);
    }
    const floorY=f.root.position.y+.006;
    if(soleY<floorY){f.body.position.y+=(floorY-soleY)/f.root.scale.y;f.root.updateMatrixWorld(true);}
  }
  for(const sample of f.trailHistory)sample.age+=dt;
  f.trailHistory=f.trailHistory.filter(sample=>sample.age<.065);
  if(progress>.42&&progress<.72&&!f.dead){
    const base=f.bladeBase.getWorldPosition(new THREE.Vector3()),tip=f.tip.getWorldPosition(new THREE.Vector3());
    f.trailHistory.push({a:base.lerp(tip,.92),b:tip,age:0});
    if(f.trailHistory.length>18)f.trailHistory.shift();
  }
  const positions=f.trail.geometry.attributes.position,colors=f.trail.geometry.attributes.color;let n=0;
  for(const sample of f.trailHistory){
    const v=sample.b,w=1-sample.age/.065;positions.setXYZ(n,v.x,v.y,v.z);colors.setXYZ(n++,w,w,w);
  }
  f.trail.geometry.setDrawRange(0,n);positions.needsUpdate=true;colors.needsUpdate=true;f.trail.visible=n>1&&!f.dead;
}
