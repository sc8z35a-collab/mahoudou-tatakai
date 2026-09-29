// Boundary and graphics regressions. These use the same functions as live play.
export function runRegression(api, assert) {
  const {THREE,$,player,enemy,keys,input,startGame,goHome,attack,dodge,damage,updateFighter,pause,resume,animateKnight}=api;
  const v=()=>new THREE.Vector3();
  function closeRange(){startGame();player.root.position.set(0,0,1);enemy.root.position.set(0,0,-1);}
  closeRange();pause();const time=api.getElapsed(),oldPos=enemy.root.position.clone();
  attack(player);dodge(player);damage(player,enemy);api.stepBattle(.1,1);
  assert(player.hp===100&&player.stamina===100&&player.attackTime<0,'Paused combat rejects attack, dodge and damage');
  assert(api.getElapsed()===time&&enemy.root.position.equals(oldPos),'Pause freezes timer and AI motion');
  resume();api.stepBattle(.02,1);assert(api.getElapsed()>time,'Resume advances simulation again');

  closeRange();player.guard=true;player.stamina=13;damage(player,enemy);
  assert(player.hp===83&&player.stamina>=0,'Insufficient guard stamina cannot become negative');
  closeRange();player.guard=true;player.stamina=20;damage(player,enemy);
  assert(player.hp===100&&player.stamina===0,'Exactly 20 stamina permits one complete block');
  closeRange();player.root.rotation.y=0;player.guard=true;damage(player,enemy);
  assert(player.hp===83,'A shield does not block an attack from behind');
  closeRange();player.root.rotation.y=0;attack(player);updateFighter(player,.31,1);
  assert(enemy.hp===150,'Sword cannot hit a target behind the attacker');
  closeRange();player.stamina=99;updateFighter(player,5,1);
  assert(player.stamina===100,'Regeneration is capped at maximum stamina');

  closeRange();api.guardPointers.add(11);api.guardPointers.add(12);api.updatePlayerGuard();
  assert(player.guard,'Held touch guard engages');
  api.guardPointers.delete(11);api.updatePlayerGuard();assert(player.guard,'Releasing one of two guard pointers preserves the other');
  api.guardPointers.clear();keys.add('KeyK');api.updatePlayerGuard();assert(player.guard,'Keyboard can continue guard after touch release');
  attack(player);api.updatePlayerGuard();assert(!player.guard,'Attack temporarily overrides held guard');
  updateFighter(player,.61,1);api.updatePlayerGuard();assert(player.guard,'Held guard resumes after the attack without another press');
  input.x=1;input.y=-1;api.clearInput();assert(!player.guard&&keys.size===0&&api.guardPointers.size===0&&input.x===0&&input.y===0,'Input reset clears movement, keyboard and multi-touch guard');

  closeRange();dodge(player);const start=player.root.position.clone();updateFighter(player,1,1);
  assert(Math.abs(start.distanceTo(player.root.position)-.43*9)<.001,'Long frames cannot extend dodge beyond its duration');
  closeRange();player.root.position.copy(enemy.root.position);api.separateFighters();
  assert(player.root.position.distanceTo(enemy.root.position)>=.949,'Exactly coincident fighters separate rather than becoming stuck');
  closeRange();player.root.position.set(7.8,0,5);api.keepInArena(player);
  assert(Math.hypot(player.root.position.x-7.8,player.root.position.z-5)>=.48+api.field.radius-.002,'Fighters cannot stand inside a brazier');
  closeRange();player.root.position.set(11.4,0,-23);enemy.root.position.set(9.4,0,-23);damage(player,enemy);
  assert(player.root.position.x<=api.field.bounds.maxX-api.field.radius+.001,'Hit knockback is constrained by the actual castle wall');

  closeRange();api.openDialog('settings-dialog');pause();
  assert(document.querySelectorAll('dialog[open]').length===1,'Focus-loss pause does not stack another dialog over settings');
  $('pause-dialog').showModal();api.syncPause();api.closeDialog($('settings-dialog'));
  assert(api.isPaused()&&$('pause-dialog').open,'Closing settings cannot resume while another pause dialog remains');
  resume();assert(!api.isPaused(),'Closing the final pause dialog resumes safely');
  for(const level of ['easy','hard','normal']){
    $('difficulty-select').value=level;$('difficulty-select').dispatchEvent(new Event('change'));
    assert(api.getDifficulty()===level,`Difficulty selector applies ${level}`);
  }

  closeRange();player.hp=1;damage(player,enemy);
  assert(player.hp===0&&$('player-health-text').textContent==='0 / 100','Lethal damage clamps HP and updates the last visible HUD frame');
  assert($('touch-controls').hidden&&api.getMode()==='result','Combat buttons are disabled immediately after a result');
  assert(api.hasPendingResult(),'Result reveal is scheduled for the current round');
  const lastHealth=enemy.hp;damage(enemy,player);assert(enemy.hp===lastHealth,'Dead or post-result attacks cannot apply additional damage');
  startGame();assert(!api.hasPendingResult()&&!$('result-dialog').open,'Retry cancels the old result reveal timer');
  assert(api.effects.length===0&&player.trailHistory.length===0&&enemy.trailHistory.length===0,'Retry removes sparks and weapon trails from the old round');
  assert(!player.dead&&!enemy.dead&&player.combo===0&&player.walk===0,'Retry clears death, combo and gait states');
  closeRange();enemy.hp=1;damage(enemy,player);goHome();
  assert(!api.hasPendingResult()&&$('damage-flash').style.opacity==='0','Going home cancels pending result and damage-flash effects');

  // Check the visible geometry and actual world-space foot positions over both cuts.
  for(const fighter of [player,enemy]){
    startGame();let valid=true,geometryCount=0;
    fighter.root.traverse(o=>{if(o.isMesh){geometryCount++;const a=o.geometry.attributes.position;if(a)for(let i=0;i<a.array.length;i++)if(!Number.isFinite(a.array[i]))valid=false;}});
    assert(valid&&geometryCount>150,`${fighter.enemy?'NPC':'Player'} detailed mesh vertices are finite`);
    let grounded=true;
    for(const combo of [0,1])for(let i=0;i<=30;i++){
      fighter.combo=combo;animateKnight(fighter,1/60,i/60,i/30);
      for(const leg of fighter.legs)for(const x of [-.095,.095])for(const z of [-.105,.265]){
        if(new THREE.Vector3(x,-.11,z).applyMatrix4(leg.ankle.matrixWorld).y<-.0001)grounded=false;
      }
    }
    assert(grounded,`${fighter.enemy?'NPC':'Player'} soles stay above the floor through both attack clips`);
  }
  closeRange();for(let i=0;i<12;i++)animateKnight(player,1/240,1+i/240,.43+i*.02);
  assert(player.trail.visible&&player.trail.geometry.drawRange.count>0,'Blade trail uses actual motion samples');
  animateKnight(player,.1,2,-1);assert(!player.trail.visible&&player.trailHistory.length===0,'Blade trail expires by elapsed time rather than display frame count');

  // Integrated simulation, not just isolated function calls.
  startGame();let stateValid=true;
  for(let i=0;i<600&&api.getMode()==='battle';i++){
    keys.clear();const distance=player.root.position.distanceTo(enemy.root.position);
    if(distance>2.15)keys.add('KeyW');
    if(enemy.attackTime>=0)keys.add('KeyK');else if(enemy.cooldown>.15)attack(player);
    api.stepBattle(1/60,i/60);
    for(const f of [player,enemy])stateValid=stateValid&&Number.isFinite(f.root.position.x+f.root.position.z+f.hp+f.stamina)&&f.stamina>=0&&f.stamina<=100&&f.hp>=0;
  }
  assert(stateValid,'600-step integrated combat preserves finite positions and valid health/stamina');
  assert(api.getElapsed()>2&&(enemy.hp<150||player.hp<100),'Integrated combat advances time and resolves actual hits');
  startGame();keys.add('KeyW');api.stepBattle(1/60,1);const p=player.root.position.clone();pause();for(let i=0;i<30;i++)api.stepBattle(1/60,2);
  assert(player.root.position.equals(p),'Held movement cannot continue during a paused simulation');resume();
  const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);assert(new Set(ids).size===ids.length,'DOM has no duplicate IDs');
  const canvas=$('world'),size=api.renderer.getDrawingBufferSize(new THREE.Vector2());
  assert(canvas.clientWidth>0&&canvas.clientHeight>0&&size.x>=canvas.clientWidth&&size.y>=canvas.clientHeight,'WebGL drawing buffer covers the viewport at the selected pixel ratio');
  startGame();
}
