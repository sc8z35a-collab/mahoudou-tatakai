import { runRegression } from './regression.js';
import { runFieldTests } from './field.js';
// Browser-run deterministic smoke checks. Open index.html?selftest=1.
export function runTests(api) {
  const { $, player, enemy, input, keys, attack, dodge, damage, updateAI, updateFighter, movementVector, keepInArena, startGame, goHome, pause, resume, updateHUD } = api;
  let passed = 0;
  function assert(condition, name) {
    if (!condition) throw new Error(name);
    passed++; if(passed<=5||passed%10===0)console.info(`PASS ${passed}: ${name}`);
  }
  function resetClose() {
    startGame(); player.root.position.set(0,0,1); enemy.root.position.set(0,0,-1);
  }
  $('start-button').click();
  assert(api.getMode()==='battle'&&!$('battle-hud').hidden,'Start button opens the playable battle HUD');
  assert(player.hp===100&&enemy.hp===150,'Starting health is correct');
  keys.add('KeyW'); const move=movementVector(); keys.clear();
  assert(move.z<-.9,'Keyboard forward moves toward the locked target');
  input.x=1; assert(movementVector().x>.9,'Joystick horizontal input strafes right'); input.x=0;
  const previousZ=enemy.root.position.z; updateAI(.1);
  assert(enemy.root.position.z>previousZ,'NPC approaches the player');
  resetClose();
  $('attack-button').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
  assert(player.attackTime===0&&player.stamina===83,'Touch attack consumes stamina and begins an attack');
  updateFighter(player,.31,1);
  assert(enemy.hp===128,'Attack applies damage inside sword reach');
  updateFighter(player,.1,1.1);
  assert(enemy.hp===128,'One swing cannot apply damage twice');
  resetClose(); enemy.root.position.z=-10; attack(player); updateFighter(player,.31,1);
  assert(enemy.hp===150,'Out-of-range swings do not damage the NPC');
  resetClose(); player.guard=true; damage(player,enemy);
  assert(player.hp===100&&player.stamina===80,'Guard blocks damage and consumes stamina');
  resetClose(); $('dodge-button').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
  assert(player.dodgeTime>0&&player.stamina===75,'Touch dodge consumes stamina');
  damage(player,enemy); assert(player.hp===100,'Dodge grants its intended invulnerability window');
  const before=player.root.position.z; updateFighter(player,.1,1);
  assert(player.root.position.z>before,'Neutral dodge moves away from the enemy');
  resetClose(); player.stamina=0; attack(player); assert(player.attackTime<0,'Exhaustion prevents attacking');
  dodge(player); assert(player.dodgeTime===0,'Exhaustion prevents dodging');
  updateFighter(player,1,1); assert(player.stamina>0,'Stamina regenerates');
  resetClose(); enemy.aiTimer=0; updateAI(.016); assert(enemy.attackTime===0,'NPC initiates its own attack at melee range');
  updateFighter(enemy,.47,1); assert(player.hp===83,'NPC attack damages the player');
  resetClose(); enemy.aiTimer=0; attack(player); updateAI(.016); assert(enemy.guard,'NPC responds to an incoming attack with guard');
  player.attackTime=.30; updateAI(.10); assert(enemy.guard,'NPC guard persists through the hit window');
  resetClose(); player.root.position.set(100,0,-100); keepInArena(player);
  assert(player.root.position.x<=api.field.bounds.maxX-api.field.radius+.001&&player.root.position.z>=api.field.bounds.minZ+api.field.radius-.001,'Actual castle walls constrain movement');
  pause(); assert(api.isPaused()&&$('pause-dialog').open,'Pause freezes the game and opens its dialog');
  resume(); assert(!api.isPaused()&&!$('pause-dialog').open,'Resume restores the battle');
  $('settings-button').click(); assert(api.isPaused()&&$('settings-dialog').open,'Settings pause active combat');
  $('settings-dialog').querySelector('.close-dialog').click();
  resetClose(); enemy.hp=1; attack(player); updateFighter(player,.31,1);
  assert(api.getMode()==='result'&&enemy.dead,'Lethal player damage triggers victory');
  resetClose(); player.hp=1; damage(player,enemy);
  assert(api.getMode()==='result'&&player.dead,'Lethal NPC damage triggers defeat');
  goHome(); assert(api.getMode()==='title'&&$('battle-hud').hidden,'Return to title resets the interface');
  startGame(); updateHUD(); assert(player.hp===100&&enemy.hp===150,'Retry resets both fighters');
  // Grip regression: facing/camera changes must never reverse the player's sword.
  for (const fighter of [player, enemy]) {
    const name=fighter.enemy?'NPC':'Player';
    for (const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]) {
      fighter.root.rotation.y=yaw;api.animateKnight(fighter,1/60,1);
      const tip=fighter.tip.getWorldPosition(new api.THREE.Vector3());
      const hand=fighter.grip.getWorldPosition(new api.THREE.Vector3());
      const forward=new api.THREE.Vector3(0,0,1).applyAxisAngle(new api.THREE.Vector3(0,1,0),yaw);
      assert(tip.sub(hand).dot(forward)>.25,`${name} blade points forward at yaw ${yaw.toFixed(2)}`);
    }
    assert(fighter.arms[1].shoulder.position.x<0&&fighter.arms[0].shoulder.position.x>0,`${name} sword is in anatomical right hand and shield in left`);
    assert(fighter.grip.getWorldPosition(new api.THREE.Vector3()).distanceTo(fighter.arms[1].hand.getWorldPosition(new api.THREE.Vector3()))<.0001,`${name} fingers and weapon share the grip origin`);
  }
  for (const combo of [0,1]) {
    resetClose();player.combo=combo;
    let finite=true;
    for(let i=0;i<=100;i++){
      api.animateKnight(player,1/120,i/120,i/100);
      const tip=player.tip.getWorldPosition(new api.THREE.Vector3());
      finite=finite&&Number.isFinite(tip.x+tip.y+tip.z);
    }
    assert(finite,`Cut ${combo+1}: all 101 motion samples have valid transforms`);
    api.animateKnight(player,1/120,1,.999);
    const end=player.tip.getWorldPosition(new api.THREE.Vector3());
    api.animateKnight(player,1/120,1,-1);
    assert(end.distanceTo(player.tip.getWorldPosition(new api.THREE.Vector3()))<.02,`Cut ${combo+1}: follow-through returns to guard without snapping`);
  }
  runRegression(api,assert);
  runFieldTests(api,assert);
  document.body.dataset.testsPassed=String(passed);
  console.info(`SMOKE TEST COMPLETE: ${passed}/${passed} passed`);
  api.readyScreenshot();
}
