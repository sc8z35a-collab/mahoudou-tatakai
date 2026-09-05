import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { CastleField } from './field.js';
import { buildCastleDetail } from './castle-detail.js';
import { createKnight, animateKnight, resetKnightMotion, restoreKnightEnvironment } from './knight.js';

const $ = id => document.getElementById(id);
const canvas = $('world');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (error) {
  $('loading').innerHTML = '<p>3D描画を開始できませんでした。</p><p>WebGL対応の最新のSafari / Chromeで開いてください。</p>';
  throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 3));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x192422);
scene.fog = new THREE.FogExp2(0x26332f, .021);
const camera = new THREE.PerspectiveCamera(49, innerWidth / innerHeight, .1, 110);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const ambientOcclusion=new SSAOPass(scene,camera,innerWidth,innerHeight,16);
ambientOcclusion.kernelRadius=.55;ambientOcclusion.minDistance=.003;ambientOcclusion.maxDistance=.13;
composer.addPass(ambientOcclusion);
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .32, .55, .85);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const clock = new THREE.Clock();
let renderDirty=true;
const Y = new THREE.Vector3(0, 1, 0);
let seed = 214;
function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
const clamp = THREE.MathUtils.clamp;

// All architecture, material maps, characters and visual effects are generated locally.
function stoneTexture(floor = false) {
  const c = document.createElement('canvas'); c.width = c.height = 1024;
  const ctx = c.getContext('2d');
  ctx.fillStyle = floor ? '#6b716b' : '#656d67'; ctx.fillRect(0, 0, 1024, 1024);
  const rows = floor ? 4 : 8, cols = floor ? 4 : 5, h = 1024 / rows, w = 1024 / cols;
  for (let r = 0; r < rows; r++) for (let col = -1; col <= cols; col++) {
    const x = col * w + (r % 2 && !floor ? w / 2 : 0), y = r * h, v = 77 + random() * 35;
    ctx.fillStyle = `rgb(${v},${v + 5},${v + 1})`; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    ctx.strokeStyle = '#b4b7a333'; ctx.lineWidth = 2; ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
    for (let n = 0; n < 70; n++) {
      ctx.strokeStyle = random() > .5 ? '#d4d5bd09' : '#0b1a1710'; ctx.lineWidth = random() * 2;
      const sx = x + random() * w, sy = y + random() * h;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + random() * 40, sy + random() * 15); ctx.stroke();
    }
  }
  const data = ctx.getImageData(0, 0, 1024, 1024);
  for (let i = 0; i < data.data.length; i += 4) { const noise = (random() - .5) * 13; data.data[i] += noise; data.data[i+1] += noise; data.data[i+2] += noise; }
  ctx.putImageData(data, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  t.repeat.set(floor ? 7 : 2, floor ? 12 : 2); return t;
}
const stoneMap = stoneTexture(), floorMap = stoneTexture(true);
const mat = {
  stone: new THREE.MeshStandardMaterial({ color: 0x89958a, map: stoneMap, roughness: .93, bumpMap: stoneMap, bumpScale: .075 }),
  trim: new THREE.MeshStandardMaterial({ color: 0x767e70, roughness: .8, metalness: .1 }),
  floor: new THREE.MeshStandardMaterial({ color: 0x829083, map: floorMap, roughness: .39, metalness: .22, bumpMap: floorMap, bumpScale: .045 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x1e2826, roughness: .8 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xad8c4c, roughness: .35, metalness: .8 }),
  iron: new THREE.MeshStandardMaterial({ color: 0x333d3b, metalness: .82, roughness: .38 }),
  red: new THREE.MeshStandardMaterial({ color: 0x481e1c, roughness: .95, side: THREE.DoubleSide }),
  carpet: new THREE.MeshStandardMaterial({ color: 0x472d25, roughness: 1 }),
  glass: new THREE.MeshStandardMaterial({ color: 0xb1d3bc, emissive: 0x90bba9, emissiveIntensity: 1.05, roughness: .3, side: THREE.DoubleSide }),
  flame: new THREE.MeshBasicMaterial({ color: 0xffdb8a, transparent: true, opacity: .92 }),
};
function mesh(geo, material, x, y, z, parent = scene) {
  const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function box(w,h,d,m,x,y,z,p) { return mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,p); }
function cyl(rt,rb,h,m,x,y,z,p,n=16) { return mesh(new THREE.CylinderGeometry(rt,rb,h,n),m,x,y,z,p); }
function sphere(r,m,x,y,z,p,s=20) { return mesh(new THREE.SphereGeometry(r,s,14),m,x,y,z,p); }
function barBetween(a,b,r,material,parent=scene) {
  const dir = new THREE.Vector3().subVectors(b,a);
  const m = cyl(r,r,dir.length(),material,0,0,0,parent,10); m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(Y,dir.normalize()); return m;
}
function arch(cx, y, z, radius, thickness, material, parent=scene) {
  const curve = new THREE.EllipseCurve(0,0,radius,radius*1.25,0,Math.PI,false,0);
  const points = curve.getPoints(40).map(p=>new THREE.Vector3(p.x,p.y,0));
  const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,thickness,8,false);
  return mesh(tube,material,cx,y,z,parent);
}

// A vaulted royal hall, with a raised throne, tracery windows and layered stonework.
box(25,.5,49,mat.floor,0,-.27,-7);
box(1,15,49,mat.stone,-12.5,7,-7); box(1,15,49,mat.stone,12.5,7,-7);
box(25,15,1,mat.stone,0,7,-31); box(25,1,49,mat.dark,0,15,-7);
for(const x of [-12,12]) {
  box(.35,.6,49,mat.trim,x,.35,-7); box(.45,.3,49,mat.trim,x,5.3,-7); box(.6,.35,49,mat.trim,x,11.1,-7);
}
for(let z=-26;z<=14;z+=8) {
  for(const x of [-9.4,9.4]) {
    box(1.8,.32,1.8,mat.trim,x,.16,z); box(1.5,.25,1.5,mat.stone,x,.45,z);
    cyl(.66,.77,.5,mat.trim,x,.77,z); cyl(.5,.59,8.8,mat.stone,x,5.35,z,scene,20);
    for(let a=0;a<8;a++) { const t=a*Math.PI/4; cyl(.11,.13,8.6,mat.trim,x+Math.cos(t)*.49,5.4,z+Math.sin(t)*.49,scene,8); }
    cyl(.74,.51,.45,mat.trim,x,9.97,z); box(1.65,.35,1.65,mat.trim,x,10.32,z);
    cyl(.62,.62,.14,mat.gold,x,1.2,z); cyl(.59,.59,.12,mat.gold,x,9.65,z);
    if(x<0)for(const offset of [-.22,.22]) { const rib=arch(0,10.5,z+offset,9.4,.13,mat.trim); rib.scale.y=.39; }
    // Smaller blind arches on the walls.
    const side = new THREE.Group(); side.position.set(x<0?-11.91:11.91,0,z); side.rotation.y=Math.PI/2; scene.add(side);
    arch(0,6.3,0,2.3,.14,mat.trim,side);
    box(.2,5.7,.2,mat.trim,-2.3,3.45,0,side); box(.2,5.7,.2,mat.trim,2.3,3.45,0,side);
  }
}
function windowPanel(x,z,rot=0,w=2.6,h=6.5) {
  const g = new THREE.Group(); scene.add(g); g.position.set(x,5.2,z); g.rotation.y=rot;
  const shape = new THREE.Shape(); shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(w/2,h-w*.7);shape.quadraticCurveTo(w*.47,h-.5,0,h);shape.quadraticCurveTo(-w*.47,h-.5,-w/2,h-w*.7);shape.closePath();
  mesh(new THREE.ShapeGeometry(shape),mat.glass,0,0,0,g);
  for(const sign of [-1,1]) box(.15,h-w*.7,.16,mat.trim,sign*w/2,(h-w*.7)/2,.08,g);
  const outline = new THREE.EdgesGeometry(new THREE.ShapeGeometry(shape)); const lines = new THREE.LineSegments(outline,new THREE.LineBasicMaterial({color:0x586859}));g.add(lines);
  box(.09,h-.45,.12,mat.iron,0,(h-.45)/2,.12,g);
  for(let row=1;row<h-1.2;row+=.75) {
    box(w,.045,.09,mat.iron,0,row,.1,g);
    for(const sign of [-1,1]) { const b=box(.025,.92,.04,mat.gold,sign*w/4,row+.15,.14,g);b.rotation.z=sign*.64; }
  }
  const ring=mesh(new THREE.TorusGeometry(w*.24,.065,8,32),mat.trim,0,h-w*.8,.14,g);
  for(const sign of [-1,1])box(.2,h-w*.7,.23,mat.trim,sign*(w/2+.17),(h-w*.7)/2,.04,g);
  box(w+.8,.28,.55,mat.trim,0,-.1,.15,g);
}
for(const z of [-22,-14,-6,2,10]) {windowPanel(-11.95,z,Math.PI/2);windowPanel(11.95,z,-Math.PI/2);}
windowPanel(0,-30.43,0,4.2,7.5);windowPanel(-5.3,-30.43,0,2.2,6);windowPanel(5.3,-30.43,0,2.2,6);
// Inlaid circular duelling arena.
const arena = new THREE.Group(); scene.add(arena); arena.position.z=-3;
for(const r of [6.1,6.2,6.75]) { const ring=mesh(new THREE.RingGeometry(r,r+.035,128),mat.gold,0,.012,0,arena);ring.rotation.x=-Math.PI/2; }
for(let n=0;n<32;n++) {const t=n*Math.PI/16;const b=box(.035,.012,.32,mat.gold,Math.sin(t)*6.45,.015,Math.cos(t)*6.45,arena);b.rotation.y=t;}
for(let i=0;i<8;i++){const b=box(.045,.015,3.2,mat.trim,0,.013,0,arena);b.rotation.y=i*Math.PI/4;}
const centerRing=mesh(new THREE.RingGeometry(.8,.85,48),mat.gold,0,.019,0,arena);centerRing.rotation.x=-Math.PI/2;
// Throne dais and a narrow, worn ceremonial runner.
for(let i=0;i<6;i++) box(11-i*.32,.27,7-i*.66,mat.stone,0,.135+i*.27,-26-i*.3);
box(2.8,.02,12.3,mat.carpet,0,.012,-16.8);
for(const x of [-1.36,1.36])box(.035,.024,12.3,mat.gold,x,.022,-16.8);
for(let i=0;i<6;i++)box(2.8,.03,.68,mat.carpet,0,.28+i*.27,-22.8-i*.63);
const throne = new THREE.Group(); throne.position.set(0,1.64,-28.2);scene.add(throne);
box(2.4,.4,1.8,mat.gold,0,.2,0,throne);box(1.5,.4,1.2,mat.red,0,.58,0,throne);box(1.6,3,.35,mat.iron,0,2,-.65,throne);box(1.25,2.2,.12,mat.red,0,1.85,-.43,throne);
for(const x of [-1,1]){box(.24,2.7,.24,mat.gold,x,1.45,-.65,throne);box(.28,.25,1.7,mat.gold,x,1.15,0,throne);cyl(.09,.15,1.2,mat.gold,x,.65,.65,throne);sphere(.18,mat.gold,x,1.35,.65,throne);}
for(let i=-3;i<=3;i++) {const height=1.2-Math.abs(i)*.19;mesh(new THREE.ConeGeometry(.15,height,4),mat.gold,i*.29,3.4+height*.35,-.65,throne);}
// Heavy crimson banners embroidered with a gold crown and sword.
const banners=[];
function banner(x,y,z,w=1.65,h=4.3) {
  const group = new THREE.Group(); group.position.set(x,y,z); scene.add(group);
  const geom=new THREE.PlaneGeometry(w,h,12,24); const b=mesh(geom,mat.red,0,-h/2,0,group); banners.push(b);
  barBetween(new THREE.Vector3(-w*.65,0,0),new THREE.Vector3(w*.65,0,0),.045,mat.gold,group);
  for(const sx of [-w/2+.06,w/2-.06])box(.025,h,.012,mat.gold,sx,-h/2,.04,group);
  box(.075,1.6,.025,mat.gold,0,-h*.5,.05,group);box(.7,.06,.025,mat.gold,0,-h*.43,.05,group);
  const crownShape = new THREE.Shape();crownShape.moveTo(-.42,0);crownShape.lineTo(-.52,.5);crownShape.lineTo(-.21,.28);crownShape.lineTo(0,.65);crownShape.lineTo(.21,.28);crownShape.lineTo(.52,.5);crownShape.lineTo(.42,0);crownShape.closePath();
  mesh(new THREE.ShapeGeometry(crownShape),mat.gold,0,-h*.34,.065,group);return group;
}
banner(-3.8,9,-29.9,1.8,5.8);banner(3.8,9,-29.9,1.8,5.8);
for(const z of [-18,-2,14])for(const x of [-9.3,9.3])banner(x,7.8,z+.66,1.3,3.6);
const flames=[]; const fireLights=[];
function flame(x,y,z,scale=1) {
  const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);
  const f=mesh(new THREE.SphereGeometry(.10*scale,12,10),mat.flame,0,.13*scale,0,g);f.scale.set(.7,2.6,.7);f.castShadow=false;
  const core=mesh(new THREE.SphereGeometry(.055*scale,8,8),new THREE.MeshBasicMaterial({color:0xfff2cd}),0,.05*scale,0,g);core.scale.y=2;core.castShadow=false;
  flames.push({g,f,phase:random()*6});return g;
}
function brazier(x,z) {
  cyl(.28,.48,.22,mat.iron,x,.12,z);cyl(.08,.16,1.7,mat.iron,x,.95,z);
  cyl(.38,.13,.3,mat.gold,x,1.85,z);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const pole=box(.055,.48,.055,mat.iron,x+Math.sin(a)*.32,2.03,z+Math.cos(a)*.32);pole.rotation.z=Math.sin(a)*.22;}
  flame(x,2,z,1.9);const light=new THREE.PointLight(0xffb456,12,9,2);light.position.set(x,2.35,z);scene.add(light);fireLights.push({light,base:12,phase:random()*6});
}
for(const z of [-21,-9,5])for(const x of [-7.8,7.8])brazier(x,z);
for(let i=0;i<18;i++){const x=(random()-.5)*8,z=-26.1-random()*2.5,h=.13+random()*.24;cyl(.045,.048,h,new THREE.MeshStandardMaterial({color:0xb4a884}),x,1.65+h/2,z);flame(x,1.65+h,z,.65);}
function chandelier(z) {
  const g=new THREE.Group();g.position.set(0,9.3,z);scene.add(g);
  cyl(.035,.035,5.5,mat.iron,0,2.75,0,g,8);
  const tor=mesh(new THREE.TorusGeometry(2.1,.085,10,64),mat.iron,0,0,0,g);tor.rotation.x=Math.PI/2;
  for(let i=0;i<10;i++){const a=i*Math.PI/5,x=Math.sin(a)*2.1,zz=Math.cos(a)*2.1;barBetween(new THREE.Vector3(0,1.8,0),new THREE.Vector3(x,0,zz),.025,mat.iron,g);cyl(.08,.1,.3,mat.gold,x,.1,zz,g);flame(x,9.65,z+zz,.85);}
}
chandelier(-14);chandelier(3);
// Pale shafts of light, dust and warm fires establish the cathedral atmosphere.
scene.add(new THREE.HemisphereLight(0xc1d8d1,0x343228,2));
const sun=new THREE.DirectionalLight(0xf2dfb8,3.7);sun.position.set(-8,13,-12);sun.target.position.set(3,0,-2);scene.add(sun,sun.target);
sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-18,right:18,top:21,bottom:-21,near:.5,far:60});sun.shadow.bias=-.0005;sun.shadow.normalBias=.045;sun.shadow.radius=3;
const coldLight=new THREE.DirectionalLight(0x9dc5c4,2);coldLight.position.set(10,8,4);scene.add(coldLight);
const backLight=new THREE.PointLight(0xc9dab5,60,24,2);backLight.position.set(0,9,-27);scene.add(backLight);
// Directional lighting, fog and dust provide atmosphere without flat light-beam
// polygons crossing the fighters. Broad transparent beam meshes were removed.
const dustCount=450,dustGeo=new THREE.BufferGeometry(),dustPositions=new Float32Array(dustCount*3);
for(let i=0;i<dustCount;i++){dustPositions[i*3]=(random()-.5)*23;dustPositions[i*3+1]=random()*12;dustPositions[i*3+2]=random()*44-29;}
dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));
const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xd4ca9c,size:.025,transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(dust);
// Small chips and rubble along the edges of the otherwise clear fighting space.
for(let i=0;i<65;i++){const x=(random()>.5?1:-1)*(10+random()*1.8),z=random()*43-29;const rock=mesh(new THREE.DodecahedronGeometry(.06+random()*.15,0),mat.trim,x,.055,z);rock.scale.set(1,.6,1.4);rock.rotation.set(random(),random()*6,random());}

const field=new CastleField();
const castle=buildCastleDetail({scene,renderer,mat,field,sun,coldLight,flame});
const player=createKnight(scene,renderer,false), enemy=createKnight(scene,renderer,true);
player.root.position.set(2.5,0,2);enemy.root.position.set(0,0,-5);
player.root.rotation.y=Math.PI;enemy.root.rotation.y=.1;
const effects=[];
function sparks(position,color=0xf4d396,count=16) {
  for(let i=0;i<count;i++) {
    const geo=new THREE.BoxGeometry(.024,.024,.07+random()*.1);
    const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color,transparent:true,opacity:1}));
    m.position.copy(position);scene.add(m);
    effects.push({mesh:m,velocity:new THREE.Vector3((random()-.5)*5,random()*4,(random()-.5)*5),life:.35+random()*.3,max:.65});
  }
}
function slashEffect(fighter) {
  // The visible sweep is generated from the weapon's world-space blade endpoints.
  fighter.trail.material.opacity = fighter.enemy ? .19 : .23;
}

let mode='title', paused=false, elapsed=0, hits=0, shake=0, messageTimer=0, difficulty='normal';
let soundEnabled=false,audio=null,ambientGain=null;
const keys=new Set(), input={x:0,y:0};let joystickPointer=null;
let nowTime=0;
let resultTimer=null, flashTimer=null, roundId=0, contextLost=false;
const guardPointers=new Set();
function syncPause(){
  paused=contextLost||document.hidden||(mode==='battle'&&!!document.querySelector('dialog[open]'));
  if(ambientGain)ambientGain.gain.setTargetAtTime(soundEnabled&&!document.hidden&&!contextLost?.65:0,audio.currentTime,.15);
}
function clearRoundTransient(){
  roundId++;clearTimeout(resultTimer);clearTimeout(flashTimer);resultTimer=flashTimer=null;
  for(const e of effects){scene.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();}effects.length=0;
  shake=0;messageTimer=0;$('damage-flash').style.opacity=0;$('combat-message').style.opacity=0;clearInput();
}
function updatePlayerGuard(){
  const held=guardPointers.size>0||keys.has('KeyK');
  player.guard=held&&mode==='battle'&&!paused&&!player.dead&&player.attackTime<0&&player.dodgeTime<=0&&player.hurt<=0&&player.stamina>=20;
  $('guard-button').classList.toggle('active',player.guard);
}
function initializeAudio(){
  if(audio)return;
  const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return;
  audio=new AudioContext();ambientGain=audio.createGain();ambientGain.gain.value=0;ambientGain.connect(audio.destination);
  for(const hz of [55,82.4,110.15]){const osc=audio.createOscillator();osc.type='sine';osc.frequency.value=hz;const g=audio.createGain();g.gain.value=.022;osc.connect(g);g.connect(ambientGain);osc.start();}
}
function setSound(value){soundEnabled=value;if(value){initializeAudio();audio?.resume();}if(ambientGain)ambientGain.gain.setTargetAtTime(value?.65:0,audio.currentTime,.3);$('sound-toggle').checked=value;document.querySelector('.off-mark').style.display=value?'none':'';$('sound-button').setAttribute('aria-label',value?'サウンドをオフ':'サウンドをオン');}
function sfx(kind){
  if(!soundEnabled||!audio)return;
  const t=audio.currentTime;
  if(kind==='swing'||kind==='hit'||kind==='guard'||kind==='dodge') {
    const length=kind==='swing'?.18:.13;const buffer=audio.createBuffer(1,audio.sampleRate*length,audio.sampleRate);const d=buffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);
    const source=audio.createBufferSource();source.buffer=buffer;const filter=audio.createBiquadFilter();filter.type='bandpass';filter.frequency.setValueAtTime(kind==='guard'?3400:kind==='hit'?800:1600,t);filter.Q.value=.6;const gain=audio.createGain();gain.gain.setValueAtTime(kind==='hit'?.22:.12,t);gain.gain.exponentialRampToValueAtTime(.001,t+length);source.connect(filter);filter.connect(gain);gain.connect(audio.destination);source.start();
  }
  if(kind==='guard'||kind==='hit'||kind==='win'||kind==='start'){
    const osc=audio.createOscillator(),g=audio.createGain();osc.type=kind==='guard'?'triangle':'sine';osc.frequency.setValueAtTime(kind==='guard'?1250:kind==='hit'?130:330,t);osc.frequency.exponentialRampToValueAtTime(kind==='guard'?600:kind==='hit'?45:660,t+.25);g.gain.setValueAtTime(.09,t);g.gain.exponentialRampToValueAtTime(.001,t+.5);osc.connect(g);g.connect(audio.destination);osc.start();osc.stop(t+.5);
  }
}
function message(text,duration=1.4){$('combat-message').textContent=text;$('combat-message').style.opacity=1;messageTimer=duration;}
function updateHUD(){
  $('player-health').style.width=Math.max(0,player.hp)+'%';$('enemy-health').style.width=Math.max(0,enemy.hp/150*100)+'%';$('player-stamina').style.width=player.stamina+'%';
  $('player-health-text').textContent=`${Math.ceil(Math.max(0,player.hp))} / 100`;$('enemy-health-text').textContent=`${Math.ceil(Math.max(0,enemy.hp))} / 150`;
  $('timer').textContent=formatTime(elapsed);
}
function formatTime(t){return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;}
function resetFighter(f){f.hp=f.enemy?150:100;f.stamina=100;f.attackTime=-1;f.attackHit=false;f.cooldown=0;f.guard=false;f.dodgeTime=0;f.dodgeVector.set(0,0,0);f.hurt=0;f.dead=false;f.walk=0;f.moving=0;f.combo=0;f.strafe=1;f.aiTimer=1.5;f.guardTime=0;f.bladeMat.emissive.setHex(0);f.root.rotation.set(0,0,0);f.navigation={timer:0,path:[]};resetKnightMotion(f);}
async function requestFullscreen(){try{if(!document.fullscreenElement){await $('game-shell').requestFullscreen?.();await screen.orientation?.lock?.('landscape');}else await document.exitFullscreen();}catch(e){/* iOS and embedded previews may not allow fullscreen / orientation lock. */}}
function startGame(){
  clearRoundTransient();for(const d of document.querySelectorAll('dialog'))d.close();resetFighter(player);resetFighter(enemy);
  mode='battle';syncPause();elapsed=0;hits=0;
  player.root.position.set(0,0,3.5);enemy.root.position.set(0,0,-3.5);player.root.rotation.y=Math.PI;enemy.root.rotation.y=0;
  document.body.classList.add('playing');$('battle-hud').hidden=false;$('touch-controls').hidden=false;$('crosshair').hidden=false;
  animateKnight(player,0,nowTime);animateKnight(enemy,0,nowTime);updateHUD();message('剣を構えよ',2.3);sfx('start');
  if(matchMedia('(pointer:coarse)').matches&&!document.fullscreenElement&&navigator.userActivation?.isActive)requestFullscreen();
}
function goHome(){clearRoundTransient();for(const d of document.querySelectorAll('dialog'))d.close();mode='title';syncPause();document.body.classList.remove('playing');$('battle-hud').hidden=true;$('touch-controls').hidden=true;$('crosshair').hidden=true;$('combat-message').style.opacity=0;resetFighter(player);resetFighter(enemy);player.root.position.set(2.5,0,2);enemy.root.position.set(0,0,-5);player.root.rotation.y=Math.PI;enemy.root.rotation.y=.1;clearInput();}
function finish(win){
  if(mode!=='battle')return;
  mode='result';clearInput();player.attackTime=enemy.attackTime=-1;player.dodgeTime=enemy.dodgeTime=0;
  player.bladeMat.emissive.setHex(0);enemy.bladeMat.emissive.setHex(0);
  $('touch-controls').hidden=true;$('crosshair').hidden=true;updateHUD();
  $('result-eyebrow').textContent=win?'VICTORY':'DEFEATED';$('result-title').textContent=win?'王冠は、あなたの手に。':'まだ、剣は折れていない。';
  $('result-description').textContent=win?'王城の守護者を打ち破った。静寂が、玉座の間を包む。':'敵の予備動作を見極め、回避のあとに反撃しよう。';
  $('result-time').textContent=formatTime(elapsed);$('result-hits').textContent=hits;$('result-health').textContent=Math.max(0,Math.ceil(player.hp));
  const finishedRound=roundId;clearTimeout(resultTimer);
  resultTimer=setTimeout(()=>{resultTimer=null;if(mode==='result'&&finishedRound===roundId&&!$('result-dialog').open)$('result-dialog').showModal();},1300);
  message(win?'VICTORY — 守護者を撃破':'DEFEATED — 再び立ち上がれ',3);if(win)sfx('win');
}
function canAct(f){return !f.dead&&f.attackTime<0&&f.dodgeTime<=0&&f.hurt<=.15&&f.cooldown<=0;}
function attack(f){
  if(mode!=='battle'||paused||!canAct(f))return;
  if(f.stamina<17){if(!f.enemy)message('スタミナが足りない',.65);return;}
  f.guard=false;f.stamina-=17;f.attackTime=0;f.attackHit=false;f.combo=(f.combo+1)%2;f.attackDuration=f.enemy?(difficulty==='easy'?1.1:difficulty==='hard'?.72:.94):.6;
  if(f.enemy)f.bladeMat.emissive.setHex(0x8b2515);else sfx('swing');
}
function dodge(f){
  if(mode!=='battle'||paused||!canAct(f))return;
  if(f.stamina<25){if(!f.enemy)message('スタミナが足りない',.65);return;}
  f.stamina-=25;f.dodgeTime=.43;f.guard=false;
  const move=movementVector();if(move.lengthSq()<.05)move.copy(player.root.position).sub(enemy.root.position).setY(0).normalize();
  f.dodgeVector.copy(move.normalize());sfx('dodge');
}
function damage(target,attacker){
  if(mode!=='battle'||paused||target.dead||attacker.dead)return;
  const pos=target.root.position.clone();pos.y+=1.55;
  if(target.dodgeTime>.06){if(!target.enemy)message('回避成功',.6);return;}
  if(target.guard&&target.stamina>=20&&isFacing(target,attacker,.2)){
    target.stamina-=20;sparks(pos,0xffdca0,23);sfx('guard');attacker.cooldown=.4;
    if(!target.enemy){message('防御成功',.6);shake=.065;}
    return;
  }
  const amount=attacker.enemy?(difficulty==='easy'?12:difficulty==='hard'?23:17):22;
  target.hp=Math.max(0,target.hp-amount);target.hurt=.32;target.attackTime=-1;target.bladeMat.emissive.setHex(0);target.cooldown=.34;
  const push=target.root.position.clone().sub(attacker.root.position).setY(0).normalize().multiplyScalar(.23);moveFighter(target,push);
  sparks(pos,attacker.enemy?0xeb9b73:0xe9dfb7,18);sfx('hit');shake=target.enemy?.075:.16;
  if(target.enemy){hits++;message('命中  −22',.65);}else{$('damage-flash').style.opacity=.7;clearTimeout(flashTimer);flashTimer=setTimeout(()=>$('damage-flash').style.opacity=0,160);if(navigator.userActivation?.hasBeenActive)navigator.vibrate?.(35);}
  keepInArena(target);updateHUD();
  if(target.hp<=0){target.dead=true;target.guard=false;finish(target.enemy);}
}
function movementVector(){
  let x=input.x,y=input.y;
  if(keys.has('KeyA')||keys.has('ArrowLeft'))x-=1;if(keys.has('KeyD')||keys.has('ArrowRight'))x+=1;if(keys.has('KeyW')||keys.has('ArrowUp'))y-=1;if(keys.has('KeyS')||keys.has('ArrowDown'))y+=1;
  const forward=enemy.root.position.clone().sub(player.root.position).setY(0).normalize();if(forward.lengthSq()<.01)forward.set(0,0,-1);
  const right=new THREE.Vector3().crossVectors(forward,Y).normalize();
  const v=right.multiplyScalar(x).addScaledVector(forward,-y);if(v.length()>1)v.normalize();return v;
}
function face(f,target,dt){const delta=target.root.position.clone().sub(f.root.position);const angle=Math.atan2(delta.x,delta.z);const diff=Math.atan2(Math.sin(angle-f.root.rotation.y),Math.cos(angle-f.root.rotation.y));f.root.rotation.y+=diff*Math.min(1,dt*12);}
function keepInArena(f){field.project(f.root.position);}
function moveFighter(f,delta){field.move(f.root.position,delta);}
function separateFighters(){
  for(let i=0;i<3;i++){
    const push=player.root.position.clone().sub(enemy.root.position).setY(0);let distance=push.length();
    if(distance>=.95)break;if(distance<.00001){push.set(1,0,0);distance=0;}else push.divideScalar(distance);
    push.multiplyScalar((.95-distance)/2+.001);player.root.position.add(push);enemy.root.position.sub(push);keepInArena(player);keepInArena(enemy);
  }
}
function isFacing(a,b,cosLimit=-.15){
  const dir=b.root.position.clone().sub(a.root.position).setY(0).normalize();
  return dir.dot(new THREE.Vector3(Math.sin(a.root.rotation.y),0,Math.cos(a.root.rotation.y)))>=cosLimit;
}
function updateFighter(f,dt,time){
  if(paused)return;
  f.cooldown=Math.max(0,f.cooldown-dt);f.hurt=Math.max(0,f.hurt-dt);f.stamina=clamp(f.stamina+dt*(f.guard?3:f.attackTime>=0?4:19),0,100);
  if(f.dead){animateKnight(f,dt,time);return;}
  if(f.dodgeTime>0){const travelTime=Math.min(dt,f.dodgeTime);f.dodgeTime=Math.max(0,f.dodgeTime-dt);moveFighter(f,f.dodgeVector.clone().multiplyScalar(travelTime*9));}
  let progress=-1;
  if(f.attackTime>=0){f.attackTime+=dt;progress=f.attackTime/f.attackDuration;}
  keepInArena(f);
  // Pose the entire rig first, so trails and contact feedback use current transforms.
  animateKnight(f,dt,time,progress);
  if(progress>=0){
    if(progress>.48&&!f.attackHit){f.attackHit=true;slashEffect(f);if(f.enemy)sfx('swing');const target=f.enemy?player:enemy;if(f.root.position.distanceTo(target.root.position)<(f.enemy?2.75:2.85)&&isFacing(f,target)&&field.lineOfSight(f.root.position.clone().add(new THREE.Vector3(0,1.45,0)),target.root.position.clone().add(new THREE.Vector3(0,1.45,0))))damage(target,f);}
    if(progress>=1){f.attackTime=-1;f.cooldown=f.enemy?(difficulty==='hard'?.28:.62):.16;f.bladeMat.emissive.setHex(0);}
  }
}
function updateAI(dt){
  if(mode!=='battle'||paused||enemy.dead)return;
  const delta=player.root.position.clone().sub(enemy.root.position).setY(0);const dist=delta.length();delta.normalize();enemy.aiTimer-=dt;
  enemy.guardTime=Math.max(0,(enemy.guardTime||0)-dt);enemy.guard=enemy.guardTime>0;enemy.moving=0;
  if(enemy.attackTime>=0||enemy.hurt>0){enemy.guard=false;return;}
  const speed=difficulty==='easy'?1.65:difficulty==='hard'?2.8:2.15;
  const visible=field.lineOfSight(enemy.root.position.clone().add(new THREE.Vector3(0,1.45,0)),player.root.position.clone().add(new THREE.Vector3(0,1.45,0)));
  if(dist>2.35||!visible){
    if(!enemy.navigation)enemy.navigation={timer:0,path:[]};
    const route=field.steer(enemy.root.position,player.root.position,enemy.navigation,dt);
    moveFighter(enemy,route.multiplyScalar(dt*speed));enemy.moving=.8;
  }
  else if(enemy.cooldown>.15){const side=new THREE.Vector3(delta.z,0,-delta.x);moveFighter(enemy,side.multiplyScalar(dt*.8*enemy.strafe).addScaledVector(delta,-dt*.38));enemy.moving=.35;}
  if(player.attackTime>=0&&player.attackTime<.24&&enemy.aiTimer<.2&&enemy.stamina>30&&difficulty!=='easy'){enemy.guardTime=.42;enemy.guard=true;}
  if(dist<2.65&&visible&&enemy.aiTimer<=0&&enemy.cooldown<=0){
    if(!enemy.guard){attack(enemy);enemy.aiTimer=difficulty==='easy'?1.6:difficulty==='hard'?.55:1.15;enemy.strafe*=-1;}
  }
}
const cameraTarget=new THREE.Vector3();
function updateCamera(dt,time){
  if(mode==='title'){
    const desired=new THREE.Vector3(10+Math.sin(time*.06)*.55,5.05,13.7);camera.position.lerp(desired,Math.min(1,dt*2));cameraTarget.set(-.8,2.25,-6);camera.lookAt(cameraTarget);
  }else{
    const dir=player.root.position.clone().sub(enemy.root.position).setY(0).normalize();if(dir.lengthSq()<.01)dir.set(0,0,1);
    const right=new THREE.Vector3(dir.z,0,-dir.x),anchor=player.root.position.clone().add(new THREE.Vector3(0,1.65,0));
    const desired=player.root.position.clone().addScaledVector(dir,7.3).addScaledVector(right,.7);desired.y=player.root.position.y+4.65;
    let safe=field.cameraPosition(anchor,desired);
    if(safe.distanceTo(anchor)<3){
      let score=safe.distanceTo(anchor);
      for(const angle of [-.85,.85,-1.55,1.55]){
        const candidate=player.root.position.clone().addScaledVector(dir.clone().applyAxisAngle(Y,angle),6.2);candidate.y=player.root.position.y+4.9;
        const clear=field.cameraPosition(anchor,candidate),value=clear.distanceTo(anchor)-Math.abs(angle)*.4-camera.position.distanceTo(clear)*.06;
        if(value>score){score=value;safe=clear;}
      }
    }
    camera.position.lerp(safe,1-Math.exp(-dt*4));
    const toward=enemy.root.position.clone().sub(player.root.position).setY(0),distance=toward.length();
    const target=player.root.position.clone().addScaledVector(toward.normalize(),Math.min(3.2,distance*.36));
    target.y=player.root.position.y+1.45;cameraTarget.lerp(target,1-Math.exp(-dt*7));
    if(shake>0){camera.position.x+=(Math.random()-.5)*shake;camera.position.y+=(Math.random()-.5)*shake;shake=Math.max(0,shake-dt*.5);}
    camera.position.copy(field.cameraPosition(anchor,camera.position));camera.lookAt(cameraTarget);
  }
}
camera.position.set(10,5.05,13.7);camera.lookAt(-.8,2.25,-6);

// Pointer capture makes movement and simultaneous guard/attack reliable on touchscreens.
function clearInput(){
  keys.clear();guardPointers.clear();input.x=input.y=0;
  if(joystickPointer!==null&&$('joystick').hasPointerCapture(joystickPointer))$('joystick').releasePointerCapture(joystickPointer);
  joystickPointer=null;$('joystick-knob').style.transform='';player.guard=false;$('guard-button').classList.remove('active');
}
const joystick=$('joystick');
function moveJoystick(e){if(e.pointerId!==joystickPointer)return;const rect=joystick.getBoundingClientRect();const radius=rect.width*.36;let x=e.clientX-rect.left-rect.width/2,y=e.clientY-rect.top-rect.height/2;const len=Math.hypot(x,y);if(len>radius){x*=radius/len;y*=radius/len;}input.x=x/radius;input.y=y/radius;$('joystick-knob').style.transform=`translate(${x}px,${y}px)`;}
joystick.addEventListener('pointerdown',e=>{if(mode!=='battle'||paused||joystickPointer!==null)return;e.preventDefault();joystickPointer=e.pointerId;joystick.setPointerCapture(e.pointerId);moveJoystick(e);});joystick.addEventListener('pointermove',moveJoystick);
for(const name of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(name,e=>{if(e.pointerId!==joystickPointer)return;joystickPointer=null;input.x=input.y=0;$('joystick-knob').style.transform='';});
$('attack-button').addEventListener('pointerdown',e=>{e.preventDefault();attack(player);});$('dodge-button').addEventListener('pointerdown',e=>{e.preventDefault();dodge(player);});
$('guard-button').addEventListener('pointerdown',e=>{if(mode!=='battle'||paused)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);guardPointers.add(e.pointerId);updatePlayerGuard();});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('guard-button').addEventListener(event,e=>{guardPointers.delete(e.pointerId);updatePlayerGuard();});
window.addEventListener('keydown',e=>{if(mode!=='battle'||paused||document.querySelector('dialog[open]'))return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(e.code==='KeyJ')attack(player);if(e.code==='Space')dodge(player);if(e.code==='KeyK')updatePlayerGuard();if(e.code==='Escape')pause();});
window.addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='KeyK')updatePlayerGuard();});canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0)attack(player);});canvas.addEventListener('contextmenu',e=>e.preventDefault());
function pause(){if(mode!=='battle')return;clearInput();if(!document.querySelector('dialog[open]'))$('pause-dialog').showModal();syncPause();}
function resume(){$('pause-dialog').close();syncPause();}
window.addEventListener('blur',()=>{clearInput();if(mode==='battle'&&!paused)pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(mode==='battle')pause();}syncPause();});
$('start-button').addEventListener('click',startGame);$('retry-button').addEventListener('click',startGame);$('result-home').addEventListener('click',goHome);$('quit-button').addEventListener('click',goHome);$('pause-button').addEventListener('click',pause);$('resume-button').addEventListener('click',resume);$('pause-dialog').addEventListener('cancel',e=>{e.preventDefault();resume();});$('pause-dialog').addEventListener('close',syncPause);$('result-dialog').addEventListener('cancel',e=>e.preventDefault());
function openDialog(id){if(mode==='result'||contextLost)return;if(mode==='battle')clearInput();if(!$(id).open)$(id).showModal();syncPause();}
function closeDialog(dialog){dialog.close();syncPause();}
for(const dialog of [$('help-dialog'),$('settings-dialog')]){dialog.querySelector('.close-dialog').addEventListener('click',()=>closeDialog(dialog));dialog.addEventListener('close',syncPause);dialog.addEventListener('cancel',e=>{e.preventDefault();closeDialog(dialog);});}
$('help-button').addEventListener('click',()=>openDialog('help-dialog'));document.querySelector('.close-help').addEventListener('click',()=>closeDialog($('help-dialog')));$('settings-button').addEventListener('click',()=>openDialog('settings-dialog'));$('fullscreen-button').addEventListener('click',requestFullscreen);$('sound-button').addEventListener('click',()=>setSound(!soundEnabled));$('sound-toggle').addEventListener('change',e=>setSound(e.target.checked));$('difficulty-select').addEventListener('change',e=>difficulty=e.target.value);
$('quality-select').addEventListener('change',e=>{const ratios={ultra:3,high:2,standard:1};renderer.setPixelRatio(Math.min(devicePixelRatio,ratios[e.target.value]));bloom.strength=e.target.value==='standard'?.16:.32;ambientOcclusion.enabled=e.target.value!=='standard';castle.setQuality(e.target.value);document.querySelector('.quality').childNodes[1].textContent=' '+e.target.value.toUpperCase()+' ';resize();});
document.querySelector('#rotate-hint button').addEventListener('click',()=>$('rotate-hint').style.display='none');
function resize(){renderDirty=true;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(innerWidth,innerHeight);}
window.addEventListener('resize',()=>{clearInput();resize();});resize();
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;clearInput();syncPause();message('3D描画を復旧中です。戻らない場合はページを再読み込みしてください。',60);});
canvas.addEventListener('webglcontextrestored',()=>{restoreKnightEnvironment(renderer,[player,enemy]);contextLost=false;renderDirty=true;if(mode==='battle')pause();syncPause();message('3D描画が復旧しました',3);});

function stepBattle(dt,time){
  if(mode!=='battle'||paused)return;
  elapsed+=dt;updatePlayerGuard();
  const v=movementVector();player.moving=v.length();if(player.attackTime>=0)player.moving*=.22;
  if(player.dodgeTime<=0&&player.hurt<=0)moveFighter(player,v.multiplyScalar(dt*(player.guard?1.65:player.attackTime>=0?.7:3.6)));
  updateAI(dt);face(player,enemy,dt);face(enemy,player,dt);
  updateFighter(player,dt,time);updateFighter(enemy,dt,time);
  if(mode==='battle')separateFighters();updateHUD();
}
let firstFrame=true;
function animate(){
  requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.1);
  if(!paused){
    nowTime+=dt;
    for(const {g,f,phase} of flames){f.scale.y=2.6+Math.sin(nowTime*11+phase)*.4;g.rotation.z=Math.sin(nowTime*7+phase)*.055;}
    for(const {light,base,phase} of fireLights)light.intensity=base*(1+Math.sin(nowTime*8+phase)*.09);
    dust.rotation.y=Math.sin(nowTime*.025)*.018;
    for(const b of banners){const a=b.geometry.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i);a.setZ(i,Math.sin(x*3+nowTime*1.3+y*.8)*.045);}a.needsUpdate=true;}
    if(mode==='battle'){
      const steps=Math.max(1,Math.ceil(dt/(1/60)));
      for(let i=0;i<steps;i++)stepBattle(dt/steps,nowTime-dt+dt*(i+1)/steps);
    }else{player.moving=0;enemy.moving=0;updateFighter(player,dt,nowTime);updateFighter(enemy,dt,nowTime);}
    for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;e.mesh.position.addScaledVector(e.velocity,dt);if(!e.slash)e.velocity.y-=dt*9;e.mesh.material.opacity=Math.max(0,e.life/e.max)*(e.slash?.42:1);if(e.slash)e.mesh.scale.multiplyScalar(1+dt*.8);if(e.life<=0){scene.remove(e.mesh);if(!e.slash)e.mesh.geometry.dispose();e.mesh.material.dispose();effects.splice(i,1);}}
    if(messageTimer>0){messageTimer-=dt;if(messageTimer<=0)$('combat-message').style.opacity=0;}
    updateCamera(dt,nowTime);
  }
  if(!contextLost&&(!paused||renderDirty||firstFrame)){composer.render();renderDirty=false;}
  if(firstFrame){firstFrame=false;document.body.dataset.sceneReady='true';$('loading').style.opacity=0;setTimeout(()=>$('loading').remove(),750);console.info('ASHEN CROWN: 3D scene ready; touch controls and NPC combat initialized.');}
}
animate();

// Optional diagnostic route; never runs during ordinary play.
if (new URLSearchParams(location.search).has('selftest') || document.body.hasAttribute('data-selftest')) {
  import('../tests/smoke.js').then(({ runTests }) => runTests({
    THREE, $, player, enemy, input, keys, attack, dodge, damage, updateAI, updateFighter,
    movementVector, keepInArena, startGame, goHome, pause, resume, resetFighter, updateHUD, animateKnight,
    stepBattle, separateFighters, updatePlayerGuard, clearInput, openDialog, closeDialog, syncPause, isFacing, guardPointers, effects, renderer, field, castle, moveFighter,
    getElapsed:()=>elapsed, getDifficulty:()=>difficulty, hasPendingResult:()=>resultTimer!==null,
    getMode: () => mode, isPaused: () => paused,
    readyScreenshot: () => {
      startGame(); player.root.position.set(-.65,0,2.1); enemy.root.position.set(.2,0,-.45);
      const area=new URLSearchParams(location.search).get('area')||document.body.dataset.reviewArea;
      if(area==='aisle'){player.root.position.set(10.9,0,-10);enemy.root.position.set(10.7,0,-7);}
      if(area==='throne'){player.root.position.set(2.8,1.62,-27);enemy.root.position.set(.1,1.62,-26);}
      keepInArena(player);keepInArena(enemy);face(player,enemy,1);face(enemy,player,1);
      animateKnight(player,1/60,1);animateKnight(enemy,1/60,1);
      player.hp=83; enemy.hp=106; player.stamina=73; elapsed=21; hits=2; updateHUD();
      for(let i=0;i<120;i++)updateCamera(1/60,nowTime);
      paused=true; $('combat-message').style.opacity=0;
      requestAnimationFrame(() => {
        // Wait for queued dialog-close events before freezing a diagnostic pose.
        paused=true;
        const pose=new URLSearchParams(location.search).get('pose')||document.body.dataset.reviewPose||'idle';
        const progress={windup:.32,cut:.59,recovery:.88}[pose];
        player.combo=0;
        if(progress!==undefined){for(let i=0;i<=24;i++)animateKnight(player,1/120,1+i/120,progress*i/24);}
        if(pose==='guard'){player.guard=true;for(let i=0;i<40;i++)animateKnight(player,1/60,1);}
        if(pose==='dodge'){player.dodgeTime=.22;animateKnight(player,1/60,1);}
        renderDirty=true;document.body.dataset.testsComplete='true';
      });
    }
  })).catch(error => console.error('SMOKE TEST FAILED', error));
} else if (new URLSearchParams(location.search).get('play') === '1') {
  startGame();
}
