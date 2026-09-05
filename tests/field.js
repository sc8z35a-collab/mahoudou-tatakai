import { CastleField } from '../js/field.js';
export function runFieldTests(api,assert){
  const {THREE,field,castle,player,enemy,startGame,updateFighter,attack,animateKnight}=api;
  const p=(x,y,z)=>new THREE.Vector3(x,y,z);
  assert(castle.stats.pieces>2000&&castle.stats.props>100,'Castle has over 2,000 detail pieces and 100 prop clusters');
  assert(field.solids.length>120,'Architecture and prop collision volumes registered');
  assert(field.freeAt(10.9,-10),'Side aisle beyond old boundary accessible');
  assert(field.freeAt(0,15.5),'Entrance beyond old boundary accessible');
  assert(field.freeAt(3,-29),'Space beside throne accessible');
  let q=p(10.9,0,-10);field.project(q);assert(q.x>10.5,'No old rectangle clips side aisle');
  q=p(0,0,15.5);field.project(q);assert(q.z>15,'No old rectangle clips entrance');
  q=p(0,0,-21);field.move(q,p(0,0,-5.3));
  assert(Math.abs(q.y-1.62)<.002&&q.z<-26,'All six dais steps can be climbed');
  field.move(q,p(0,0,5.3));assert(q.y===0&&q.z>-21.1,'Dais steps can be descended');
  q=p(3,1.62,-28.2);field.move(q,p(-3,0,0));assert(q.x>=1.2+field.radius-.01,'Throne blocks at actual base');
  q=p(6,0,-10);field.move(q,p(6,0,0));assert(q.x<8.3,'Swept motion cannot tunnel through column');
  q=p(0,0,13);field.move(q,p(0,0,20));assert(q.z<=17-field.radius+.001,'Closed entrance blocks high-speed motion');
  q=p(7.8,0,2);field.move(q,p(0,0,6));assert(q.z<4.3,'Brazier blocks high-speed motion');
  q=p(9.5,0,-5);field.move(q,p(3,0,0));assert(q.x<10.1,'Writing table blocks at visible edge');
  assert(!field.lineOfSight(p(8,1.45,-10),p(10.8,1.45,-10)),'Column blocks melee line of sight');
  assert(field.lineOfSight(p(0,1.45,1),p(0,1.45,-1)),'Open arena line of sight unobstructed');
  const camera=field.cameraPosition(p(6,1.65,-10),p(11,4.65,-10));assert(camera.x<8.9,'Camera retracts before column');
  const corner=field.cameraPosition(p(0,1.65,15.8),p(0,4.65,23));assert(corner.z<17.1,'Camera stays inside entrance wall');
  const from=p(8,0,-10),to=p(10.9,0,-10),path=field.findPath(from,to);
  assert(path.length>2,'NPC routes around blocking column');
  let previous=from,valid=true;for(const point of path){valid=valid&&field.clearWalk(previous,point);previous=point;}
  assert(valid,'All navigation segments respect obstacles and step heights');
  assert(field.findPath(p(0,0,-21),p(3,1.62,-28)).length>0,'NPC can route to throne platform');
  const isolated=new CastleField();isolated.box('rotated-test',0,0,1,2,0,2,Math.PI/4);
  q=p(.6,0,.6);isolated.project(q);assert(isolated.freeAt(q.x,q.z),'Oriented box resolves penetration');
  q=p(0,0,3);for(let i=0;i<100;i++)isolated.move(q,p(.02,0,-.06));
  assert(isolated.freeAt(q.x,q.z)&&Number.isFinite(q.x+q.z),'Body slides around rotated furniture');
  startGame();player.root.position.set(3,1.62,-28);animateKnight(player,1/60,1);
  let grounded=true;for(const leg of player.legs)for(const x of [-.095,.095])for(const z of [-.105,.265])if(p(x,-.11,z).applyMatrix4(leg.ankle.matrixWorld).y<1.62)grounded=false;
  assert(grounded,'Knight feet use platform height');
  startGame();player.root.position.set(8.15,0,-10);enemy.root.position.set(10.65,0,-10);player.root.rotation.y=Math.PI/2;
  attack(player);updateFighter(player,.31,1);assert(enemy.hp===150,'Sword cannot hit through column');
  const walker=from.clone();let reached=true;for(const point of path){
    for(let n=0;n<100&&Math.hypot(point.x-walker.x,point.z-walker.z)>.08;n++)field.move(walker,point.clone().sub(walker).setY(0).normalize().multiplyScalar(.075));
    if(!field.freeAt(walker.x,walker.z,field.radius-.002))reached=false;
  }
  assert(reached&&Math.hypot(walker.x-to.x,walker.z-to.z)<.2,'NPC body physically traverses planned route');
  startGame();console.info('FIELD TESTS: expanded hall, stairs, furniture, sweeping, navigation and camera passed.');
}
