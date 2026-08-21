(()=>{
'use strict';
if(!('serviceWorker' in navigator))return;
const TARGET='/workout-journal-v2/sw.js';
const KEY='denisfit-journal-sw-switch-v1';
async function install(){
  try{
    const reg=await navigator.serviceWorker.register(`${TARGET}?v=1`,{scope:'/workout-journal-v2/'});
    await navigator.serviceWorker.ready;
    const controlledByDiary=Boolean(navigator.serviceWorker.controller?.scriptURL?.includes('/workout-journal-v2/sw.js'));
    if(controlledByDiary){sessionStorage.removeItem(KEY);return}
    if(sessionStorage.getItem(KEY)==='1')return;
    sessionStorage.setItem(KEY,'1');
    const reload=()=>location.reload();
    navigator.serviceWorker.addEventListener('controllerchange',reload,{once:true});
    if(reg.active) setTimeout(reload,250);
  }catch(e){console.error('Diary service worker setup failed',e)}
}
install();
})();
