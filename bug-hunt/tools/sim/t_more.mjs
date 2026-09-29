const T=(await import('./boot.mjs')).default;const {player:P,enemy:E}=T;const $=id=>document.getElementById(id);const w=window;const log=(...a)=>console.log(...a);
function close(){T.startGame();P.root.position.set(0,0,1);E.root.position.set(0,0,-1);P.root.rotation.y=Math.PI;E.root.rotation.y=0;}
// 1 guard block does not interrupt/penalize enemy combo? guard-hold normal: why invincible? check enemy attack when player guarding: damage blocked, stamina regen during guard =3/s
close();T.set({difficulty:'normal'});T.keys.add('KeyK');let blocks=0,t=0;const s0=P.stamina;
for(let i=0;i<3600;i++){const before=P.stamina;T.stepBattle(1/60,t);t+=1/60;if(P.stamina<before-10)blocks++;}
log('1 normal guard 60s blocks',blocks,'P.hp',P.hp,'P.stam',P.stamina.toFixed(1),'guard',P.guard);T.keys.clear();
// 2 enemy guard stamina never consumed? enemy.guard blocks -> stamina -20 each; guard at stamina>30 check
close();T.set({difficulty:'hard'});E.guardTime=5;E.guard=true;E.stamina=100;let eb=0;for(let k=0;k<6;k++){E.guard=true;const h=E.hp;T.damage(E,P);if(E.hp===h)eb++;}log('2 enemy consecutive blocks',eb,'E.stamina',E.stamina);
// 3 hurt stun lock: enemy hard continuously hitting player? player hurt .32, cooldown .34
// 4 message "命中 −22" constant regardless; fine. Enemy damage amount message?
// 5 timer display after 60min
log('5 format 3600s',(()=>{T.startGame();return 0})());
// 6 player moving into enemy: separateFighters pushes enemy into wall? 
close();P.root.position.set(11.3,0,-10);E.root.position.set(11.3,0,-10.5);T.separateFighters();log('6 sep dist',P.root.position.distanceTo(E.root.position).toFixed(3));
// 7 dodge through the enemy? dodge vector toward enemy, 3.87 distance, passes through enemy body (separate only at end)
close();T.keys.add('KeyW');T.dodge(P);T.keys.clear();let minD=9;for(let i=0;i<30;i++){T.updateFighter(P,1/60,1);minD=Math.min(minD,Math.hypot(P.root.position.x-E.root.position.x,P.root.position.z-E.root.position.z));}
log('7 dodge forward min distance to enemy',minD.toFixed(3),'end P z',P.root.position.z.toFixed(2),'E z',E.root.position.z.toFixed(2));
// 8 elapsed during pause dialog? covered. 9: attack while hurt allowed at hurt<=.15
close();P.hurt=.15;T.attack(P);log('9 attack while hurt .15 allowed',P.attackTime===0);
// 10 player moving during hurt: moveFighter skipped when hurt>0 fine
// 11 enemy aiTimer reset on start = 1.5 but resetFighter sets aiTimer 1.5; first attack delay
// 12 Enemy heals? stamina of dead? 
// 13 facing: enemy turns while attacking (face each step) => tracking attacks can't be sidestepped
close();E.aiTimer=0;T.attack(E);P.root.position.set(1.6,0,-1);const r0=E.root.rotation.y;for(let i=0;i<20;i++)T.stepBattle(1/60,1);log('13 enemy rotated during windup',(E.root.rotation.y-r0).toFixed(2));
process.exit(0);
