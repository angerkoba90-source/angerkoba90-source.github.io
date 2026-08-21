(()=>{
  const style=document.createElement('style');
  style.textContent=`
  .workout-back{align-items:stretch!important;background:#090a0c!important}
  .workout-sheet{position:fixed!important;inset:0!important;width:100%!important;max-width:430px!important;margin:0 auto!important;height:100dvh!important;max-height:none!important;border-radius:0!important;padding:calc(4px + env(safe-area-inset-top)) 7px calc(4px + env(safe-area-inset-bottom))!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;background:#0f1114!important}
  .workout-head{display:grid;grid-template-columns:34px 1fr 34px;align-items:center;gap:6px;height:38px;flex:0 0 38px;border-bottom:1px solid #25292f}
  .workout-close{width:32px;height:32px;border:0;border-radius:9px;background:#25292f;color:#fff;font-size:17px}
  .workout-title{min-width:0;text-align:center}.workout-title b{display:block;font-size:15px;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.workout-title span{display:block;font-size:9px;color:#858a92;margin-top:1px}
  .exercise-list{flex:1;min-height:0;overflow-y:auto;padding:6px 0 8px;scrollbar-width:none}.exercise-list::-webkit-scrollbar{display:none}
  .exercise-card{background:#181b20;border:1px solid #2c3138;border-radius:13px;margin-bottom:7px;overflow:hidden}
  .exercise-bar{display:grid;grid-template-columns:23px minmax(0,1fr) auto;gap:6px;align-items:center;min-height:34px;padding:6px 7px;background:#20242a;border-bottom:1px solid #30353d}
  .exercise-no{width:21px;height:21px;border-radius:7px;background:#ff4b16;color:#fff;display:grid;place-items:center;font-size:10px;font-weight:800}
  .exercise-bar h3{margin:0;font-size:13px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.exercise-bar span{font-size:8px;color:#858a92;white-space:nowrap}
  .set-head{display:grid;grid-template-columns:20px 1fr 12px 1fr 28px;gap:4px;align-items:center;height:20px;padding:0 6px;color:#6f747c;font-size:7px;text-align:center}
  .compact-sets{padding:0 6px}.compact-set{display:grid;grid-template-columns:20px 1fr 12px 1fr 28px;gap:4px;align-items:center;margin:2px 0}.compact-set .set-num{font-size:9px;color:#767b83;text-align:center}.compact-set input{width:100%;min-width:0;height:31px;border:1px solid #343941;background:#0d0f12;color:#fff;border-radius:8px;text-align:center;font-size:13px;padding:0}.compact-set input:focus{border-color:#ff4b16;outline:none}.compact-set .x{color:#686d74;text-align:center;font-size:10px}.compact-set button{width:27px;height:27px;border:0;border-radius:8px;background:#292d33;color:#ff8270;font-size:13px}
  .compact-add{width:calc(100% - 12px);height:28px;margin:4px 6px 6px;border:1px dashed #3b4048;background:transparent;color:#aeb3ba;border-radius:8px;font-size:10px}
  .workout-footer{flex:0 0 75px;border-top:1px solid #292d33;padding-top:5px;background:#0f1114}.finish-row{display:grid;grid-template-columns:1fr 1.12fr;gap:6px}.finish-check{display:flex;align-items:center;gap:6px;height:35px;padding:4px 8px;border:1px solid #343941;background:#1b1e23;border-radius:10px;font-size:10px}.finish-check input{width:17px;height:17px;accent-color:#32d74b;margin:0}.finish-btn{height:35px!important;margin:0!important;border-radius:10px!important;font-size:10px!important}.finish-btn:disabled{opacity:.38}.workout-hint{height:17px;line-height:17px;text-align:center;color:#646970;font-size:8px}
  @media(max-height:700px){.exercise-card{margin-bottom:5px}.exercise-bar{min-height:31px;padding:5px 6px}.compact-set input{height:29px}.compact-add{height:26px;margin-top:3px;margin-bottom:5px}.workout-footer{flex-basis:70px}}
  `;
  document.head.appendChild(style);

  const setRow=n=>`<div class="compact-set"><span class="set-num">${n}</span><input inputmode="decimal" placeholder="кг"><span class="x">×</span><input inputmode="numeric" placeholder="повт"><button class="rmset">×</button></div>`;

  window.bindRmCompact=function(scope=document){
    scope.querySelectorAll('.rmset').forEach(b=>b.onclick=()=>{
      const card=b.closest('.exercise-card'),sets=card?.querySelector('.compact-sets'),row=b.closest('.compact-set');
      if(sets&&sets.querySelectorAll('.compact-set').length>1)row.remove();
      if(sets)[...sets.querySelectorAll('.set-num')].forEach((n,i)=>n.textContent=i+1);
    });
  };

  window.openWorkoutEditor=function(event){
    const names=event.exercises||[];
    q('#modal').innerHTML=`<div class="modal-back workout-back"><div class="sheet workout-sheet">
      <div class="workout-head">
        <button id="cancelWorkout" class="workout-close">←</button>
        <div class="workout-title"><b>${event.name}</b><span>${new Date(event.date+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'short'})} · ${String(event.hour).padStart(2,'0')}:00</span></div>
        <div></div>
      </div>
      <div class="exercise-list">${names.length?names.map((name,i)=>`<section class="exercise-card exedit" data-name="${name.replace(/"/g,'&quot;')}">
        <div class="exercise-bar"><div class="exercise-no">${i+1}</div><h3>${name}</h3><span>кг × повт.</span></div>
        <div class="set-head"><span>№</span><span>ВЕС</span><span></span><span>ПОВТ.</span><span></span></div>
        <div class="compact-sets">${setRow(1)}${setRow(2)}${setRow(3)}</div>
        <button class="compact-add addset" type="button">＋ подход</button>
      </section>`).join(''):`<section class="exercise-card"><div class="exercise-bar"><div class="exercise-no">!</div><h3>Нет упражнений</h3><span></span></div></section>`}</div>
      <div class="workout-footer">
        <div class="finish-row">
          <label class="finish-check"><input id="finishWorkoutCheck" type="checkbox"><span>Закончить ✓</span></label>
          <button id="saveWorkout" class="btn finish-btn" disabled>Сохранить тренировку</button>
        </div>
        <div class="workout-hint">В историю попадёт только завершённая тренировка</div>
      </div>
    </div></div>`;

    qa('.addset').forEach(b=>b.onclick=()=>{
      const card=b.closest('.exercise-card'),sets=card.querySelector('.compact-sets'),n=sets.querySelectorAll('.compact-set').length+1;
      sets.insertAdjacentHTML('beforeend',setRow(n));
      bindRmCompact(card);
      b.scrollIntoView({block:'nearest',behavior:'smooth'});
    });
    qa('.exercise-card').forEach(bindRmCompact);

    const check=q('#finishWorkoutCheck'),save=q('#saveWorkout');
    check.onchange=()=>save.disabled=!check.checked;
    save.onclick=()=>{
      if(!check.checked)return;
      const exercises=qa('.exedit').map(el=>({name:el.dataset.name,sets:[...el.querySelectorAll('.compact-set')].map(r=>{const ins=r.querySelectorAll('input');return{w:+ins[0].value||0,r:+ins[1].value||0}}).filter(s=>s.w||s.r)}));
      data.workouts.push({id:'w'+Date.now(),date:event.date,name:event.name,note:'',exercises});
      event.done=true;
      saveData();saveSchedule();closeModal();renderCalendar();renderHistory();
    };
    q('#cancelWorkout').onclick=()=>openScheduled(event.id);
  };
})();
