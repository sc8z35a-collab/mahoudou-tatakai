()=>{const o={};const g=(s,p)=>getComputedStyle(document.querySelector(s))[p];
document.body.classList.add('playing');for(const id of ['battle-hud','touch-controls','crosshair'])document.getElementById(id).hidden=false;
const ch=document.getElementById('crosshair').getBoundingClientRect();o.crosshairCenterOffset=[ch.left+ch.width/2-innerWidth/2,ch.top+ch.height/2-innerHeight/2].map(Math.round);
const kc=document.querySelector('.joystick-cross').getBoundingClientRect(),j=document.getElementById('joystick').getBoundingClientRect(),kn=document.getElementById('joystick-knob').getBoundingClientRect();
o.crossOffset=[kc.left+kc.width/2-(j.left+j.width/2),kc.top+kc.height/2-(j.top+j.height/2)].map(v=>+v.toFixed(1));
o.knobOffset=[kn.left+kn.width/2-(j.left+j.width/2),kn.top+kn.height/2-(j.top+j.height/2)].map(v=>+v.toFixed(1));
o.offMark=(()=>{const b=document.getElementById('sound-button').getBoundingClientRect(),m=document.querySelector('.off-mark').getBoundingClientRect();return [m.left+m.width/2-(b.left+b.width/2),m.top+m.height/2-(b.top+b.height/2)].map(v=>+v.toFixed(1))})();
o.pauseBtnSize=(()=>{const r=document.getElementById('pause-button').getBoundingClientRect();return [r.width,r.height].map(Math.round)})();
o.closeBtnSize=(()=>{document.getElementById('help-dialog').showModal();const r=document.querySelector('#help-dialog .close-dialog').getBoundingClientRect();const s=getComputedStyle(document.querySelector('#help-dialog .close-dialog')).outline;document.getElementById('help-dialog').close();return [r.width,r.height].map(Math.round)})();
o.helpBtnSize=(()=>{document.body.classList.remove('playing');const r=document.getElementById('help-button').getBoundingClientRect();return [r.width,r.height].map(Math.round)})();
o.iconBtnSize=(()=>{const r=document.getElementById('settings-button').getBoundingClientRect();return [r.width,r.height].map(Math.round)})();
o.healthTransition=g('.health-track i','transition');o.staminaTransition=g('.stamina-track i','transition');
o.fontsLoaded=[...document.fonts].map(f=>f.family+':'+f.status).slice(0,4);
return o;}
