import './env.mjs';
const T=(await import('./boot.mjs')).default;const {player,enemy}=T;const out={};
// 1. message text on hit is always "−22" even though damage constant 22 is player's; ok. Enemy damage to player no message. fine
// 2. knockback when target is in-guard-failed? damage pushes .23 regardless
// 3. Player hurt: during hurt>0 player can't move (stepBattle). hurt .32 >.15 canAct. ok
// 4. AI: difficulty easy never guards; hard attacks every .55 => measure DPS in 20s sim where player stands still
for(const d of ['easy','normal','hard']){T.set({difficulty:d});T.startGame();player.root.position.set(0,0,1);enemy.root.position.set(0,0,-1.2);let t=0;while(t<20&&T.get().mode==='battle'){T.stepBattle(1/60,t);t+=1/60;}out['stand_'+d]={t:t.toFixed(1),hp:player.hp,mode:T.get().mode};}
// 5. player spam attack at close range vs normal: does enemy ever win? 
T.set({difficulty:'normal'});T.startGame();player.root.position.set(0,0,1);enemy.root.position.set(0,0,-1.2);let t=0;while(t<60&&T.get().mode==='battle'){T.attack(player);T.stepBattle(1/60,t);t+=1/60;}out.spam={t:t.toFixed(1),php:player.hp,ehp:enemy.hp,hits:T.get().hits};
// 6. hurt interrupts attack of target; enemy combo lock? stun lock: can player chain-hit enemy so it never attacks?
T.startGame();player.root.position.set(0,0,1);enemy.root.position.set(0,0,-1.2);t=0;let enemyAttacks=0;let was=false;while(t<30&&T.get().mode==='battle'){T.attack(player);T.stepBattle(1/60,t);const a=enemy.attackTime>=0;if(a&&!was)enemyAttacks++;was=a;t+=1/60;}out.stunlock={t:t.toFixed(1),enemyAttacks,ehp:enemy.hp,php:player.hp};
console.log('B4',JSON.stringify(out));process.exit(0);
