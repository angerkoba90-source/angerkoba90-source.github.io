(() => {
'use strict';

const NAV_EMOJI={home:'🏠',schedule:'📅',clients:'👥',programs:'🏋️',library:'🎬',progress:'📈',meals:'🍽️',profile:'👤'};
const COMPLETION_IDS=new Set(['boxingClientConfirm','assignedWorkoutDone','programWorkoutDone','completeProgramWorkout']);

function decorateNav(){
  document.querySelectorAll('#nav button[data-page]').forEach(button=>{
    const icon=button.querySelector('b');
    const emoji=NAV_EMOJI[button.dataset.page];
    if(icon&&emoji&&icon.textContent!==emoji)icon.textContent=emoji;
  });
}

function showGoalCelebration(){
  if(document.querySelector('.goal-celebration'))return;
  const overlay=document.createElement('div');
  overlay.className='goal-celebration';
  overlay.innerHTML=`
    <div class="goal-sparks" aria-hidden="true">
      <span>🔥</span><span>✨</span><span>⚡</span><span>💥</span>
      <span>🏆</span><span>✨</span><span>🔥</span><span>⚡</span>
    </div>
    <div class="goal-celebration-card" role="dialog" aria-modal="true" aria-label="Тренировка завершена">
      <div class="goal-fire">🔥</div>
      <div class="goal-kicker">ТРЕНИРОВКА ЗАВЕРШЕНА</div>
      <h2>Ты ещё ближе<br>к своей цели</h2>
      <p>Ещё одна тренировка в копилке. Продолжай двигаться вперёд.</p>
      <div class="goal-streak"><span>💪</span><b>Сделано</b><span>⚡</span></div>
      <button type="button" class="btn primary goal-continue">Продолжить</button>
    </div>`;
  document.body.appendChild(overlay);
  if(navigator.vibrate)navigator.vibrate([35,35,65]);
  let closed=false;
  const close=()=>{
    if(closed)return;
    closed=true;
    overlay.classList.add('leaving');
    setTimeout(()=>overlay.remove(),240);
  };
  overlay.querySelector('.goal-continue').onclick=close;
  overlay.onclick=e=>{if(e.target===overlay)close()};
  requestAnimationFrame(()=>overlay.classList.add('show'));
  setTimeout(close,3800);
}

function watchSuccessfulCompletion(input){
  let ticks=0;
  let nativeCelebrationSeen=false;
  const timer=setInterval(()=>{
    ticks++;
    if(document.querySelector('.goal-celebration'))nativeCelebrationSeen=true;
    if(!input.isConnected){
      clearInterval(timer);
      if(!nativeCelebrationSeen)setTimeout(showGoalCelebration,80);
      return;
    }
    if(!input.checked||ticks>50)clearInterval(timer);
  },120);
}

document.addEventListener('change',event=>{
  const target=event.target;
  if(!(target instanceof HTMLInputElement))return;
  if(!COMPLETION_IDS.has(target.id)||!target.checked)return;
  watchSuccessfulCompletion(target);
});

const observer=new MutationObserver(decorateNav);
window.addEventListener('DOMContentLoaded',()=>{
  decorateNav();
  const nav=document.getElementById('nav');
  if(nav)observer.observe(nav,{childList:true,subtree:true});
});
})();
