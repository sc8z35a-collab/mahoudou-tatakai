import './env.mjs';
const T=(await import('./boot.mjs')).default;const {player,enemy}=T;
const out={};
// 1. smoke "Start button" flow: test clicks start and then goHome etc. Check test assumptions:
T.startGame();
// "Neutral dodge moves away from enemy": test asserts z increased; verify when player is at z<enemy it'd still pass? compute
player.root.position.set(0,0,-1);enemy.root.position.set(0,0,1);T.dodge(player);const z0=player.root.position.z;T.updateFighter(player,.1,1);out.neutralDodgeReverse=player.root.position.z-z0;
// 2. regression 'Held guard resumes' uses updateFighter .61 > attackDuration .6 ; ok.
// 3. 'Sword cannot hit a target behind' : closeRange rotation 0 means facing +z, enemy at -1 => behind. OK.
// 4. test 'Guard blocks' sets player.guard directly; but real guard requires isFacing(.2). at startGame rotation PI facing -z -> enemy at -z OK.
// 5. blade trail test: animateKnight with progress .43+ -> but trail only records .42-.72: fine
// 6. Is the test for 'NPC approaches' valid: after startGame enemy at z -3.5 player 3.5
T.startGame();const e0=enemy.root.position.z;T.updateAI(.1);out.npcApproach=enemy.root.position.z-e0;
// 7. smoke 'Attack applies damage' uses updateFighter(.31) with attackDuration .6 -> progress .516 >.48 OK.
// 8. does selftest leave game in paused battle? mode
out.mode=T.get?.()?.mode;
console.log(JSON.stringify(out));process.exit(0);
