(()=>{
  const style=document.createElement('style');
  style.textContent=`
  .workout-sheet{height:100dvh!important;max-height:100dvh!important;border-radius:0!important;padding:calc(10px + env(safe-area-inset-top)) 12px calc(10px + env(safe-area-inset-bottom))!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}
  .workout-head{display:grid;grid-template-columns:40px 1fr 40px;align-items:center;gap:8px;margin-bottom:8px}
  .workout-close{width:40px;height:40px;border:0;border-radius:12px;background:#272b31;color:#fff;font-size:19px}
  .workout-title{min-width:0;text-align:center}.workout-title b{display:block;font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.workout-title span{display:block;font-size:10px;color:#8d929a;margin-top:2px}
  .workout-counter{font-size:10px;color:#83878e;text-align:center;margin:0 0 4px}
  .exercise-tabs{display:flex;gap:6px;overflow:auto;padding:2px 0 8px;scrollbar-width:none}
  .exercise-tab{flex:0 0 auto;max-width:150px;height:34px;border:1px solid #343941;border-radius:11px;background:#1b1e23;color:#9ea2a9;padding:0 10px;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .exercise-tab.active{background:#ff4b16;border-color:#ff4b16;color:#fff}
  .workout-panes{flex:1;min-height:0}.workout-pane{height:100%;display:none;flex-direction:column;min-height:0}.workout-pane.active{display:flex}
  .workout-ex-name{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:2px 0 6px}.workout-ex-name h3{margin:0;font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.workout-ex-name span{font-size:10px;color:#8d929a;flex:0 0 auto}
  .compact-sets{flex:1;min-height:0;overflow:auto;padding-right:1px}.compact-set{display:grid;grid-template-columns:24px 1fr 14px 1fr 34px;gap:5px;align-items:center;margin:5px 0}.compact-set .set-num{font-size:10px;color:#747981;text-align:center}.compact-set input{width:100%;min-width:0;height:38px;border:1px solid #343941;background:#111317;color:#fff;border-radius:10px;text-align:center;font-size:14px}.compact-set .x{color:#6f737a;text-align:center}.compact-set button{width:34px;height:34px;border:0;border-radius:10px;background:#292d33;color:#ff8270}
  .compact-add{height:38px;border:1px dashed #3a3f47;background:transparent;color:#b1b5bc;border-radius:11px;font-size:12px;margin-top:4px}
  .workout-footer{flex:0 0 auto;border-top:1px solid #292d33;padding-top:8px;margin-top:6px}.finish-check{display:flex;align-items:center;gap:9px;min-height:42px;padding:7px 10px;border:1px solid #343941;background:#1b1e23;border-radius:12px;font-size:13px}.finish-check input{width:20px;height:20px;accent-color:#32d74b}.finish-btn{height:46px!important;margin-top:7px!important}.finish-btn:disabled{opacity:.38}
  `;
  document.head.appendChild(style);

  window.bindRmCompact=function(scope=document){
    scope.querySelectorAll('.rmset').forEach(b=>b.onclick=()=>{
      const sets=b.closest('.compact-sets'),row=b.closest('.compact-set');
      if(sets&&sets.querySelectorAll('.compact-set').length>1)row.remove();
      if(sets)[...sets.querySelectorAll('.set-num')].forEach((n,i)=>n.textContent=i+1);
    });
  };

  window.openWorkoutEditor=function(event){
    const names=event.exercises||[];
    q('#modal').innerHTML=`<div class="modal-back"><div class="sheet workout-sheet">
      <div class="workout-head">
        <button id="cancelWorkout" class="workout-close">←</button>
        <div class="workout-title"><b>${event.name}</b><span>${new Date(event.date+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'short'})} · ${String(event.hour).padStart(2,'0')}:00</span></div>
        <div></div>
      </div>
      <div class="workout-counter"><span id="activeExerciseNumber">1</span> / ${Math.max(1,names.length)} упражнения</div>
      <div class="exercise-tabs">${names.map((name,i)=>`<button class="exercise-tab ${i===0?'active':''}" data-ex-tab="${i}">${name}</button>`).join('')}</div>
      <div class="workout-panes">${names.map((name,i)=>`<section class="workout-pane exedit ${i===0?'active':''}" data-name="${name.replace(/"/g,'&quot;')}" data-pane="${i}">
        <div class="workout-ex-name"><h3>${name}</h3><span>кг × повт.</span></div>
        <div class="compact-sets"><div class="compact-set"><span class="set-num">1</span><input inputmode="decimal" placeholder="кг"><span class="x">×</span><input inputmode="numeric" placeholder="повт"><button class="rmset">×</button></div></div>
        <button class="compact-add addset" type="button">＋ Добавить подход</button>
      </section>`).join('')}</div>
      <div class="workout-footer">
        <label class="finish-check"><input id="finishWorkoutCheck" type="checkbox"><span>Закончить тренировку ✓</span></label>
        <button id="saveWorkout" class="btn finish-btn" disabled>Завершить и сохранить</button>
      </div>
    </div></div>`;

    const activate=i=>{
      qa('[data-ex-tab]').forEach((b,n)=>b.classList.toggle('active',n===i));
      qa('[data-pane]').forEach((p,n)=>p.classList.toggle('active',n===i));
      if(q('#activeExerciseNumber'))q('#activeExerciseNumber').textContent=i+1;
    };
    qa('[data-ex-tab]').forEach((b,i)=>b.onclick=()=>activate(i));
    qa('.addset').forEach(b=>b.onclick=()=>{
      const sets=b.previousElementSibling,n=sets.querySelectorAll('.compact-set').length+1;
      sets.insertAdjacentHTML('beforeend',`<div class="compact-set"><span class="set-num">${n}</span><input inputmode="decimal" placeholder="кг"><span class="x">×</span><input inputmode="numeric" placeholder="повт"><button class="rmset">×</button></div>`);
      bindRmCompact(sets);
    });
    qa('.compact-sets').forEach(bindRmCompact);

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
