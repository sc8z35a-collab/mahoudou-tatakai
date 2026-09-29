import * as THREE from 'three';
import { CastleField } from './src/field.js';
export function build(){
const field=new CastleField();
field.box('west-wall',-12.5,-7,1,49,-.5,15);field.box('east-wall',12.5,-7,1,49,-.5,15);
field.box('north-wall',0,-31,25,1,-.5,15);
for(const side of [-1,1])field.box('raised-wall-panelling',side*11.915,-7,.30,47,0,2.65);
field.box('entrance-wall-left',-8,17.5,9,1,-.5,15);field.box('entrance-wall-right',8,17.5,9,1,-.5,15);
field.box('closed-oak-gate',0,17.35,7, .55,0,8);
for(const x of [-9.4,9.4])for(let z=-26;z<=14;z+=8){field.box('pillar-square-plinth',x,z,1.8,1.8,0,.32);field.circle('pillar-base',x,z,.78,.32,1.02);field.circle('fluted-column',x,z,.65,1.02,10.5);}
for(const x of [-7.8,7.8])for(const z of [-21,-9,5]){field.circle('brazier-foot',x,z,.48,0,.24);field.circle('brazier-stem',x,z,.16,.24,1.7);field.circle('brazier-bowl',x,z,.39,1.7,2.3);}
for(let i=0;i<6;i++)field.box(`dais-step-${i+1}`,0,-26-i*.3,11-i*.32,7-i*.66,i*.27,(i+1)*.27,0,true);
field.box('throne-foot',0,-28.2,2.4,1.8,1.62,2.03);field.box('throne-back',0,-28.85,2.3,.4,2.03,5.7);
for(const x of [-1,1])field.box('throne-arm',x,-28.2,.3,1.7,2.03,3.0);
return field;}
