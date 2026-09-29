const T=(await import('./boot.mjs')).default;const {player:P,enemy:E}=T;const $=id=>document.getElementById(id);const w=window;const log=(...a)=>console.log(...a);
const key=(t,code,o={})=>w.dispatchEvent(new w.KeyboardEvent(t,{code,bubbles:true,cancelable:true,...o}));
// a) Escape pressed while pause dialog open: keydown handler returns early (dialog open) -> native cancel resumes. ok.
// b) K held, open pause via Escape -> clearInput clears keys; K released while paused: keyup deletes; ok. K still held physically after resume -> guard lost until repress (auto-repeat keydown with repeat=true re-adds K! then updatePlayerGuard)
T.startGame();key('keydown','KeyK');key('keydown','Escape');T.resume();key('keydown','KeyK',{repeat:true});log('b guard restored by autorepeat',P.guard,[...T.keys]);
// c) W held through pause: autorepeat re-adds -> ok. Arrow key default: preventDefault only in battle; Space on focused button in battle triggers button click (e.g. pause button focused)?
T.startGame();$('pause-button').focus();const ev=new w.KeyboardEvent('keydown',{code:'Space',key:' ',bubbles:true,cancelable:true});$('pause-button').dispatchEvent(ev);log('c space preventDefault on focused button',ev.defaultPrevented);
// d) Result: updateHUD enemy bar etc. result-health; check result-hits counts guarded hits? hits only on damage fine.
// e) sound: setSound(true) without AudioContext -> audio null; ambientGain null -> line: if(ambientGain)... ok. sfx safe.
// f) gain setTargetAtTime at syncPause when soundEnabled false? fine.
// g) quality select: label update childNodes[1]
$('quality-select').value='standard';$('quality-select').dispatchEvent(new w.Event('change'));log('g quality label',JSON.stringify(document.querySelector('.quality').textContent),'pr',T.renderer.getPixelRatio(),'composer pr',T.composer.pr);
$('quality-select').value='ultra';$('quality-select').dispatchEvent(new w.Event('change'));log('  ultra pr',T.renderer.getPixelRatio());
// h) difficulty change mid-battle takes effect for attackDuration already set; fine. 
// i) help button reachable in battle? hidden with landing. settings open in result -> blocked. ok
// j) round label always DUEL I
// k) goHome while result timer pending then startGame quickly -> roundId check ok.
// l) crosshair visible at result? hidden. Battle HUD remains during result: yes intended.
// m) mouse click on canvas attacks even while pointer over UI? canvas below; left-click on HUD? pointer-events none -> reaches canvas: ok. But clicking PAUSE button region? button captures.
// n) Enter key on start button triggers startGame; then keydown 'Enter' nothing
// o) startGame from result dialog 'retry' : dialog close -> 'close' listener? result-dialog has no close listener; fine
// p) pause() while settings open (Escape while settings open): keydown returns due to dialog open. ok
// q) Blur when in title: clearInput only.
// r) resize clears input — covered.
// s) damage flash timer after goHome cleared ok.
// t) combat message on retry: clearRoundTransient sets opacity 0 then message() sets 1
// u) visibility hidden while settings open in battle: pause() -> dialog open so no pause dialog; OK.
// v) enemy HP text ceil: 150 - 22*k ... fine
// w) player stamina bar width no clamp → stamina can't exceed.
process.exit(0);
