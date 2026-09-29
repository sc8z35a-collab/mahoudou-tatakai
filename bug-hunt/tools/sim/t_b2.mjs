import './env.mjs';
const T=(await import('./boot.mjs')).default;const {player,enemy}=T;const out={};
// trail opacity sequence
T.startGame();out.trailOpacityStart=player.trail.material.opacity;
player.root.position.set(0,0,1);enemy.root.position.set(0,0,-1);T.attack(player);out.firstCombo=player.combo;
for(let i=0;i<40;i++)T.updateFighter(player,1/60,1+i/60);out.trailOpacityAfter=player.trail.material.opacity;
T.startGame();out.trailOpacityAfterRestart=player.trail.material.opacity;
// selftest "Actual castle walls constrain movement" : checks only x<=max and z>=min for (100,-100): weak
// quality select: does changing quality update ".quality" label? childNodes[1]
const sel=document.getElementById('quality-select');sel.value='standard';sel.dispatchEvent(new window.Event('change'));out.qualityLabel=document.querySelector('.quality').textContent;out.pr=T.renderer.getPixelRatio();
sel.value='ultra';sel.dispatchEvent(new window.Event('change'));out.prUltra=T.renderer.getPixelRatio();
// settings dialog sound toggle vs button aria
console.log(JSON.stringify(out));process.exit(0);
