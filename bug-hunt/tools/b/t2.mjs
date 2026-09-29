import {makeWorld} from './world.mjs';
const w=makeWorld(),f=w.field,T=w.THREE;const V=(x,y,z)=>new T.Vector3(x,y,z);
// 1. door frame intrusion
let q=V(3.65,0,10);f.move(q,V(0,0,10));console.log('door pillar: player z',q.z.toFixed(3),'pillar front face 16.65');
// 2. grid coverage
const g=f.grid;console.log('grid x range',g.minX,g.minX+(g.nx-1)*g.step,'z range',g.minZ,g.minZ+(g.nz-1)*g.step,'bounds',f.bounds);
// 3. dais step walkable test: can player walk onto dais from side (x) ?
q=V(-7,0,-27);f.move(q,V(3,0,0));console.log('side approach dais',q.x.toFixed(2),q.y);
// 4. project: circle skip condition check. A circle at far x but near z? condition only uses x -> fine. For boxes never skipped.
// 5. step onto throne-foot (top 2.03, dais top 1.62 => .41 > maxStep) ok. Check throne seat reach
// 6. ground() on step edges vs. collision: stand at top of step 1 edge
// 7. barrels z=15.5 vs entrance wall z 17 : barrel r .35*.85 ok
// 8. freeAt ignores walkables fully -> but a walkable step taller than maxStep relative? n/a
// 9. find path from player spawn to far aisle
let t0=Date.now();let p=f.findPath(V(0,0,-3.5),V(10.9,0,-10));console.log('path len',p.length,'ms',Date.now()-t0);
t0=Date.now();p=f.findPath(V(0,0,-3.5),V(-11.3,0,16.5));console.log('path to corner',p.length,'ms',Date.now()-t0, p.at(-1));
// 10. lineOfSight through step boxes: dais steps are cameraMeshes -> LOS from floor to dais top?
console.log('LOS floor->dais', f.lineOfSight(V(0,1.45,-20),V(0,1.45+1.62,-27)));
console.log('LOS floor->dais low', f.lineOfSight(V(0,1.45,-24),V(0,1.45+1.62,-28)));
// camera: raycaster intersects proxy meshes including steps
