import {makeWorld} from './world.mjs';
const w=makeWorld(),T=w.THREE,f=w.field;
const out={};
// spotlights: target inside hall? position x=-11.5 inside west wall panelling (wall panel x -11.93..-11.8, rail boxes at -11.76)
out.spot=w.castle.spotlights.map(l=>({pos:l.position.toArray(),tgt:l.target.position.toArray(),dist:l.distance,insideGeom:null}));
// Check whether spotlight position is inside some merged geometry bounding boxes (e.g. candles shelf at side*11.45,y2.85)
const rc=new T.Raycaster();
for(const l of w.castle.spotlights){const dir=l.target.position.clone().sub(l.position).normalize();rc.set(l.position,dir);rc.far=40;const h=rc.intersectObjects(w.castle.batch.children,false)[0];l._first=h?{d:h.distance.toFixed(2),pt:h.point.toArray().map(v=>v.toFixed(2))}:null;}
out.spotFirstHit=w.castle.spotlights.map(l=>l._first);
// spot is only on west side - east side receives none
// candles on shelves: shelf at y 2.85 x ±11.45 thickness .12 => top 2.91; candle base y 2.92 +0.02 => floating?
out.shelfTop=2.85+.06;out.candleBaseBottom=2.92+.02-.0175;
// wall-candle shelf collides with window? windows at z -22,-14,-6,2,10 (x=±11.95, y 5.2+) no.
// seal plane overlaps arena rings? seal size 12.1 => radius 6.05 at z=-3; arena rings 6.1..6.785 
// chip rubble inside walls? castle chips x=±(10..11.65) freeAt r=.16 ok
// Table legs: cyl(.075,.11,1) at y .51 => bottom .01 top 1.01; plank box .15 at 1.11 => bottom 1.035; gap 1.01..1.035 but bronze apron .9x.09 at y1.0 -> covers.
// benches: seat .53 +-.05 ; leg box .46 at .26 -> top .49 < seat bottom .48? .49>.48 ok
// barrel lid at .85 height .04 -> top .87; band box at .879 thickness .02 -> ok; body .43+-.4 => .03..0.83 gap .83-.83
// chest lid: cyl radius .40 rotated x -> axis along z?? rotation.x=PI/2 makes cylinder axis along z, length 1.1 along z; body is .78 wide x, 1.1 deep z => lid radius .4 => width .8 ok
// rack spears: cyl 2.3 at 1.22 => bottom .07 top 2.37; tip cone at 2.51 height .28 => 2.37..2.65 ok; collider top 2.67
// statue arms
console.log(JSON.stringify(out,null,0));
