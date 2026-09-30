// Balance probe: spam attack / hold guard / idle per difficulty. Run via selftest.sh's .selftest/sim copy.
import './env.mjs';
const T=(await import('./boot.mjs')).default;const {player,enemy,keys}=T;const out={};
function run(d,act,sec=60){T.set({difficulty:d});T.startGame();player.root.position.set(0,0,1);enemy.root.position.set(0,0,-1.2);let t=0;while(t<sec&&T.get().mode==='battle'){act(t);T.stepBattle(1/60,t);t+=1/60;}keys.clear();return {t:+t.toFixed(1),php:player.hp,ehp:enemy.hp,win:enemy.dead};}
for(const d of ['easy','normal','hard'])out[d]={spam:run(d,()=>T.attack(player)),guard:run(d,()=>keys.add('KeyK')),idle:run(d,()=>{},30)};
// dodge-through check (A-030)
T.set({difficulty:'normal'});T.startGame();player.root.position.set(0,0,1);enemy.root.position.set(0,0,-1);keys.add('KeyW');T.dodge(player);for(let i=0;i<30;i++)T.stepBattle(1/60,i/60);keys.clear();
out.dodgeThrough={playerZ:+player.root.position.z.toFixed(2),minGap:+player.root.position.distanceTo(enemy.root.position).toFixed(2)};
console.log('BAL',JSON.stringify(out));process.exit(0);
