const T=(await import('./boot.mjs')).default;const {player:P,enemy:E}=T;const $=id=>document.getElementById(id);const w=window;const log=(...a)=>console.log(...a);
const key=(t,code,o={})=>w.dispatchEvent(new w.KeyboardEvent(t,{code,bubbles:true,cancelable:true,...o}));
T.startGame();key('keydown','KeyK');key('keydown','Escape');T.resume();key('keydown','KeyK',{repeat:true});T.stepBattle(1/60,1);log('b after step guard',P.guard);
// Enter key on focused pause/start button during battle (keydown not prevented) -> e.g. after clicking start, focus stays on hidden start button? After startGame focus on start-button (hidden via display none -> blur). Pressing Enter/Space on pause-button focus: Space prevented, but Enter would click -> pause. J key etc fine.
// Check: after resume via button click, focus returns to pause-button (dialog restores focus). Then pressing Enter pauses again.
// keyboard: in result mode keys ignored; ok.
// Check keys held when mode->result: finish clears.
// Retry via Enter on retry button: startGame
// check attack via left-click works during 'result'? attack checks mode.
// Check enemy after player death still attacks (mode result -> updateAI returns). anim continues via updateFighter in non-battle branch: enemy.attackTime reset -1. ok
// guard emissive red after finish: bladeMat reset ok.
// title mode updateFighter: stamina regen etc irrelevant.
// Check: goHome resets root rotation via resetFighter root.rotation.set(0,0,0) then sets y.
// Check: startGame animateKnight with dt 0 -> damp dt 0 fine; actualSpeed division by max(.001,0) -> delta big after teleport? m.initialized false after reset -> 0. ok
// Check teleport between battles: motion.lastPosition copy in resetKnightMotion BEFORE position set in startGame => first frame delta large => actualSpeed 1 & forward/side set wrongly
T.goHome();T.startGame();log('lastPos',P.motion.lastPosition.toArray(),'pos',P.root.position.toArray(),'init',P.motion.initialized);
process.exit(0);
