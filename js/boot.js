// Keep an actionable error screen if an external module or WebGL initialization fails.
const loading=document.getElementById('loading');
function showBootIssue(message){
  if(!loading?.isConnected)return;
  loading.style.opacity='1';loading.replaceChildren();
  const text=document.createElement('p');text.textContent=message;text.style.cssText='max-width:80vw;text-align:center;line-height:2;letter-spacing:1px';
  const retry=document.createElement('button');retry.className='primary-button';retry.textContent='再読み込み';retry.addEventListener('click',()=>location.reload());
  loading.append(text,retry);
}
const slowTimer=setTimeout(()=>{if(!document.body.dataset.sceneReady)showBootIssue('読み込みに時間がかかっています。通信環境を確認してお待ちいただくか、再読み込みしてください。');},35000);
import('./game.js').then(()=>clearTimeout(slowTimer)).catch(error=>{
  clearTimeout(slowTimer);console.error('ゲームの初期化に失敗しました',error);
  showBootIssue('3Dゲームを読み込めませんでした。通信環境と、WebGL対応の最新ブラウザーをご確認ください。');
});
