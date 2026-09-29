#!/bin/sh
# copy sources with import rewrite and PMREM stub (analysis only; originals untouched)
rm -rf src && mkdir -p src
for f in knight castle-detail field; do
  sed -e "s#three/addons/#three/examples/jsm/#g" ../../../js/$f.js > src/$f.js
done
sed -i -e "s#new THREE.PMREMGenerator(renderer)#({fromScene:()=>({texture:new THREE.Texture(),dispose(){}}),dispose(){}})#g" -e "s#new RoomEnvironment()#({dispose(){}})#g" src/knight.js
