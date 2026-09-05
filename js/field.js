import * as THREE from 'three';

// Static 2.5D character collision: vertical body capsule vs oriented footprints,
// with the actual dimensions/heights shared with visible architectural pieces.
// Motion is swept in <= 8 cm slices; boxes retain their rotation, circles their radius.
export class CastleField {
  constructor(){
    this.radius=.32;this.height=2.68;this.maxStep=.285;
    this.bounds={minX:-12,maxX:12,minZ:-30.5,maxZ:17};
    this.solids=[];this.surfaces=[];this.cameraMeshes=[];this.grid=null;
    this.raycaster=new THREE.Raycaster();this.proxyMaterial=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  }
  box(name,x,z,w,d,bottom,top,angle=0,walkable=false){
    const o={name,type:'box',x,z,hx:w/2,hz:d/2,bottom,top,angle,c:Math.cos(angle),s:Math.sin(angle),walkable};
    this.solids.push(o);if(walkable)this.surfaces.push(o);
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,top-bottom,d),this.proxyMaterial);m.position.set(x,(bottom+top)/2,z);m.rotation.y=angle;m.updateMatrixWorld(true);this.cameraMeshes.push(m);return o;
  }
  circle(name,x,z,r,bottom,top){
    const o={name,type:'circle',x,z,r,bottom,top,walkable:false};this.solids.push(o);
    const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,top-bottom,32),this.proxyMaterial);m.position.set(x,(bottom+top)/2,z);m.updateMatrixWorld(true);this.cameraMeshes.push(m);return o;
  }
  local(o,x,z){const dx=x-o.x,dz=z-o.z;return {x:o.c*dx-o.s*dz,z:o.s*dx+o.c*dz};}
  contains(o,x,z,inset=0){if(o.type==='circle')return Math.hypot(x-o.x,z-o.z)<o.r+inset;const p=this.local(o,x,z);return Math.abs(p.x)<o.hx+inset&&Math.abs(p.z)<o.hz+inset;}
  ground(x,z){let y=0;for(const o of this.surfaces)if(this.contains(o,x,z,-.002))y=Math.max(y,o.top);return y;}
  penetration(o,p,r){
    if(o.type==='circle'){
      let dx=p.x-o.x,dz=p.z-o.z;const d=Math.hypot(dx,dz),limit=r+o.r;
      if(d>=limit-.00001)return null;if(d<.00001)return {x:limit,z:0};return {x:dx/d*(limit-d),z:dz/d*(limit-d)};
    }
    const q=this.local(o,p.x,p.z),cx=THREE.MathUtils.clamp(q.x,-o.hx,o.hx),cz=THREE.MathUtils.clamp(q.z,-o.hz,o.hz);
    let dx=q.x-cx,dz=q.z-cz,d=Math.hypot(dx,dz);
    if(d>=r-.00001)return null;
    if(d<.00001){
      const ex=o.hx-Math.abs(q.x),ez=o.hz-Math.abs(q.z);
      if(ex<ez){dx=(q.x>=0?1:-1)*(ex+r);dz=0;}else{dx=0;dz=(q.z>=0?1:-1)*(ez+r);}
    }else{dx*=((r-d)/d);dz*=((r-d)/d);}
    return {x:o.c*dx+o.s*dz,z:-o.s*dx+o.c*dz};
  }
  project(p,r=this.radius,step=true){
    const b=this.bounds;
    for(let pass=0;pass<8;pass++){
      let changed=false;p.x=THREE.MathUtils.clamp(p.x,b.minX+r,b.maxX-r);p.z=THREE.MathUtils.clamp(p.z,b.minZ+r,b.maxZ-r);
      for(const o of this.solids){
        if(o.top<=p.y+.015||o.bottom>=p.y+this.height)continue;
        if(step&&o.walkable&&o.top<=p.y+this.maxStep+.001)continue;
        if(Math.abs(p.x-o.x)>(o.hx||o.r)+r+((o.hz||0)*Math.abs(o.s||0))&&o.type==='circle')continue;
        const push=this.penetration(o,p,r);if(push){p.x+=push.x+.00001*Math.sign(push.x);p.z+=push.z+.00001*Math.sign(push.z);changed=true;}
      }
      if(!changed)break;
    }
    p.x=THREE.MathUtils.clamp(p.x,b.minX+r,b.maxX-r);p.z=THREE.MathUtils.clamp(p.z,b.minZ+r,b.maxZ-r);
    const ground=this.ground(p.x,p.z);
    // Stair changes are small; high ledges are blocked while approaching horizontally.
    if(ground<=p.y+this.maxStep+.002)p.y=ground;
    return p;
  }
  move(p,delta,r=this.radius){
    const distance=Math.hypot(delta.x,delta.z),slices=Math.max(1,Math.ceil(distance/.08));
    for(let i=0;i<slices;i++){p.x+=delta.x/slices;p.z+=delta.z/slices;this.project(p,r);}
    return p;
  }
  freeAt(x,z,r=this.radius){
    const b=this.bounds;if(x<b.minX+r||x>b.maxX-r||z<b.minZ+r||z>b.maxZ-r)return false;
    const y=this.ground(x,z),p={x,y,z};
    for(const o of this.solids){if(o.walkable||o.top<=y+.015||o.bottom>=y+this.height)continue;if(this.penetration(o,p,r))return false;}return true;
  }
  clearWalk(a,b,r=this.radius){
    const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.16));let previous=this.ground(a.x,a.z);
    for(let i=1;i<=n;i++){
      const t=i/n,x=THREE.MathUtils.lerp(a.x,b.x,t),z=THREE.MathUtils.lerp(a.z,b.z,t),y=this.ground(x,z);
      if(!this.freeAt(x,z,r)||Math.abs(y-previous)>this.maxStep+.01)return false;previous=y;
    }return true;
  }
  lineOfSight(a,b){
    const direction=b.clone().sub(a),distance=direction.length();if(distance<.01)return true;
    this.raycaster.set(a,direction.divideScalar(distance));this.raycaster.near=.02;this.raycaster.far=distance-.03;
    return this.raycaster.intersectObjects(this.cameraMeshes,false).length===0;
  }
  cameraPosition(target,desired){
    const delta=desired.clone().sub(target),distance=delta.length();
    if(distance<.01)return desired.clone();this.raycaster.set(target,delta.divideScalar(distance));this.raycaster.near=.02;this.raycaster.far=distance+.3;
    const hit=this.raycaster.intersectObjects(this.cameraMeshes,false)[0];
    if(hit)return target.clone().addScaledVector(delta,Math.max(.25,hit.distance-.32));
    return desired.clone();
  }
  buildNavigation(){
    const step=.45,minX=-11.55,minZ=-30.05,nx=52,nz=104,cells=new Uint8Array(nx*nz),heights=new Float32Array(nx*nz);
    for(let z=0;z<nz;z++)for(let x=0;x<nx;x++){
      const i=z*nx+x,xx=minX+x*step,zz=minZ+z*step;cells[i]=this.freeAt(xx,zz,this.radius+.025)?1:0;heights[i]=this.ground(xx,zz);
    }
    this.grid={step,minX,minZ,nx,nz,cells,heights};
  }
  findPath(from,to){
    if(this.clearWalk(from,to))return [to.clone()];if(!this.grid)this.buildNavigation();
    const g=this.grid,{nx,nz,cells,heights}=g;
    const coord=i=>new THREE.Vector3(g.minX+(i%nx)*g.step,heights[i],g.minZ+Math.floor(i/nx)*g.step);
    const nearest=p=>{
      let best=-1,dist=Infinity;const cx=Math.round((p.x-g.minX)/g.step),cz=Math.round((p.z-g.minZ)/g.step);
      for(let zz=Math.max(0,cz-5);zz<=Math.min(nz-1,cz+5);zz++)for(let xx=Math.max(0,cx-5);xx<=Math.min(nx-1,cx+5);xx++){
        const i=zz*nx+xx,d=(xx-cx)**2+(zz-cz)**2;if(cells[i]&&d<dist&&this.clearWalk(p,coord(i))){best=i;dist=d;}
      }return best;
    };
    const start=nearest(from),end=nearest(to);if(start<0||end<0)return [];
    const scores=new Float32Array(cells.length).fill(Infinity),parents=new Int32Array(cells.length).fill(-1),closed=new Uint8Array(cells.length);
    const heap=[];const push=(id,f)=>{let i=heap.length;heap.push({id,f});while(i){const p=(i-1)>>1;if(heap[p].f<=f)break;heap[i]=heap[p];i=p;}heap[i]={id,f};};
    const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=last.f)break;heap[i]=heap[c];i=c;}heap[i]=last;}return first.id;};
    const ex=end%nx,ez=Math.floor(end/nx),heuristic=i=>Math.hypot(i%nx-ex,Math.floor(i/nx)-ez);
    scores[start]=0;push(start,heuristic(start));let visits=0;
    while(heap.length&&visits++<12000){
      const current=pop();if(closed[current])continue;if(current===end){
        const path=[];for(let i=end;i!==start&&i>=0;i=parents[i])path.push(coord(i));path.reverse();
        if(this.clearWalk(path.at(-1)||from,to))path.push(to.clone());return path;
      }
      closed[current]=1;const x=current%nx,z=Math.floor(current/nx);
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
        const xx=x+dx,zz=z+dz;if(xx<0||xx>=nx||zz<0||zz>=nz)continue;const next=zz*nx+xx;
        if(!cells[next]||closed[next]||Math.abs(heights[next]-heights[current])>this.maxStep+.01)continue;
        if(dx&&dz&&(!cells[z*nx+xx]||!cells[zz*nx+x]))continue;
        if(!this.clearWalk(coord(current),coord(next),this.radius+.005))continue;
        const score=scores[current]+Math.hypot(dx,dz);if(score>=scores[next])continue;
        scores[next]=score;parents[next]=current;push(next,score+heuristic(next));
      }
    }return [];
  }
  steer(from,to,state,dt){
    state.timer=(state.timer||0)-dt;
    if(state.timer<=0||!state.goal||state.goal.distanceToSquared(to)>2.25){state.path=this.findPath(from,to);state.goal=to.clone();state.timer=.65;}
    while(state.path?.length&&Math.hypot(state.path[0].x-from.x,state.path[0].z-from.z)<.24)state.path.shift();
    const next=state.path?.[0];return next?next.clone().sub(from).setY(0).normalize():new THREE.Vector3();
  }
}
