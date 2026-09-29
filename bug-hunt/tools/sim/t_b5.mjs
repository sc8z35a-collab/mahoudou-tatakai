import './env.mjs';
const T=(await import('./boot.mjs')).default;const {player,enemy}=T;const out={};
// spam on every difficulty, with dodge
for(const d of ['easy','normal','hard']){T.set({difficulty:d});let wins=0,tt=0;for(let r=0;r<5;r++){T.startGame();player.root.position.set(0,0,1);enemy.root.position.set(0,0,-1.2);let t=0;while(t<60&&T.get().mode==='battle'){T.attack(player);T.stepBattle(1/60,t);t+=1/60;}if(enemy.dead)wins++;tt+=t;}out['spam_'+d]={wins,avgT:(tt/5).toFixed(1)};}
// does the enemy guard ever block a player spam on hard? count guard sparks via stamina drop of enemy by 20
T.set({difficulty:'hard'});T.startGame();player.root.position.set(0,0,1);enemy.root.position.set(0,0,-1.2);let blocks=0,t=0,prevHp=150;const origDamage=0;while(t<60&&T.get().mode==='battle'){T.attack(player);const s=enemy.stamina;T.stepBattle(1/60,t);if(enemy.stamina<s-15)blocks++;t+=1/60;}out.hardBlocks=blocks;
console.log('B5',JSON.stringify(out));process.exit(0);
