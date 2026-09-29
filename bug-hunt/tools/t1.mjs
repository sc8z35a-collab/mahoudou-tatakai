import * as THREE from 'three';import {build} from './field_test.mjs';
const f=build();
// 1. dais step extents
for(const s of f.surfaces)console.log(s.name,'z',(s.z-s.hz).toFixed(2),(s.z+s.hz).toFixed(2),'x±',s.hx.toFixed(2),'top',s.top.toFixed(2));
console.log('ground at throne seat area',f.ground(0,-28.2), 'visual throne base y=1.64');
// pillar plinth: top .32 but not walkable -> step?
const p={x:9.4-1.4,y:0,z:-10};f.move(p,{x:1,z:0});console.log('walk into plinth ->',p);
// project skip condition for boxes line60
