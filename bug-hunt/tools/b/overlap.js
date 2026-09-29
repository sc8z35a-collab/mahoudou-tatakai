()=>{const R=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return r.width?r:null};
const hit=(a,b)=>a&&b&&a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;
const out=[];const vw=innerWidth,vh=innerHeight;
const T=['.brand','.location','.header-actions','#landing','#opponent-preview','#landing-footer','.text-button#help-button','#start-button','.game-tags','#rotate-hint'];
for(let i=0;i<T.length;i++)for(let j=i+1;j<T.length;j++)if(hit(R(T[i]),R(T[j])))out.push('T:'+T[i]+' x '+T[j]);
for(const s of T){const r=R(s);if(r&&(r.left<0||r.top<0||r.right>vw+.5||r.bottom>vh+.5))out.push('offscreen '+s+' '+[r.left,r.top,r.right,r.bottom].map(Math.round));}
const fl=R('#landing-footer');if(fl){for(const s of ['#help-button','#start-button','.game-tags'])if(R(s)&&R(s).bottom>fl.top)out.push('above-footer-line '+s+' bottom '+Math.round(R(s).bottom)+' > '+Math.round(fl.top));}
document.body.classList.add('playing');for(const id of ['battle-hud','touch-controls','crosshair'])document.getElementById(id).hidden=false;const m=document.getElementById('combat-message');m.textContent='スタミナが足りない';m.style.opacity=1;
const H=['.topbar','#battle-hud','.player-stats','.round-info','.enemy-stats','#combat-message','.movement-area','.action-area','.battle-bottom>span','#pause-button','#rotate-hint'];
for(let i=0;i<H.length;i++)for(let j=i+1;j<H.length;j++){if(H[j]==='.player-stats'||H[j]==='.round-info'||H[j]==='.enemy-stats'){if(H[i]==='#battle-hud')continue;}if(hit(R(H[i]),R(H[j])))out.push('H:'+H[i]+' x '+H[j]);}
const cm=document.querySelector('#combat-message');const cmr=cm.getBoundingClientRect();
const small=[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().width&&e.childNodes.length&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())).map(e=>[e.tagName+'.'+(e.className||e.id),parseFloat(getComputedStyle(e).fontSize)]).filter(a=>a[1]<7);
out.push('fonts<7px: '+small.map(a=>a[0]+'='+a[1]).join(', '));
return out;}
