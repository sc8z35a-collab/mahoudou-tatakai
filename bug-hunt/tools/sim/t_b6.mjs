import './env.mjs';
const T=(await import('./boot.mjs')).default;const {player,enemy}=T;const out={};
T.set({difficulty:'normal'});T.startGame();player.root.position.set(0,0,1);enemy.root.position.set(0,0,-1.2);
let t=0,blocks=0,hitsTaken=0,enemyHits=0,guardFrames=0;let ph=player.hp,eh=enemy.hp;
while(t<60&&T.get().mode==='battle'){T.attack(player);const s=enemy.stamina;T.stepBattle(1/60,t);if(enemy.guard)guardFrames++;if(enemy.stamina<s-15)blocks++;if(enemy.hp<eh)hitsTaken++;if(player.hp<ph)enemyHits++;eh=enemy.hp;ph=player.hp;t+=1/60;}
out.normal={t:t.toFixed(1),blocks,hitsTaken,enemyHits,guardFrames};
console.log('B6',JSON.stringify(out));process.exit(0);
