(()=>{
  const style=document.createElement('style');
  style.textContent=`
  .workout-back{align-items:stretch!important;background:#090a0c!important}
  .workout-sheet{position:fixed!important;inset:0!important;width:100%!important;max-width:430px!important;margin:0 auto!important;height:100dvh!important;max-height:none!important;border-radius:0!important;padding:calc(4px + env(safe-area-inset-top)) 8px calc(4px + env(safe-area-inset-bottom))!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;background:#111317!important}
  .workout-head{display:grid;grid-template-columns:34px 1fr 34px;align-items:center;gap:6px;height:38px;flex:0 0 38px}
  .workout-close{width:34px;height:34px;border:0;border-radius:10px;background:#25292f;color:#fff;font-size:17px}
  .workout-title{min-width:0;text-align:center}.workout-title b{display:block;font-size:15px;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.workout-title span{display:block;font-size:9px;color:#8d929a;margin-top:1px}
  .workout-counter{height:16px;line-height:16px;font-size:9px;color:#7f848b;text-align:center;flex:0 0 16px}
  .exercise-tabs{display:flex;gap:4px;overflow:auto;padding:2px 0 5px;scrollbar-width:none;flex:0 0 35px}.exercise-tabs::-webkit-scrollbar{display:none}
  .exercise-tab{flex:0 0 auto;max-width:132px;height:28px;border:1px solid #343941;border-radius:9px;background:#1b1e23;color:#9ea2a9;padding:0 8px;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .exercise-tab.active{background:#ff4b16;border-color:#ff4b16;color:#fff}
  .workout-panes{flex:1;min-height:0;overflow:hidden}.workout-pane{height:100%;display:none;flex-direction:column;min-height:0}.workout-pane.active{display:flex}
  .workout-ex-name{display:flex;align-items:center;justify-content:space-between;gap:6px;height:30px;flex:0 0 30px;border-bottom:1px solid #282c32}.workout-ex-name h3{margin:0;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.workout-ex-name span{font-size:9px;color:#8d929a;flex:0 0 auto}
  .set-head{display:grid;grid-template-columns:22px 1fr 12px 1fr 30px;gap:4px;align-items:center;height:22px;flex:0 0 22px;color:#737880;font-size:8px;text-align:center}
  .compact-sets{flex:1;min-height:0;overflow:auto;padding:0 0 2px}.compact-set{display:grid;grid-template-columns:22px 1fr 12px 1fr 30px;gap:4px;align-items:center;margin:3px 0}.compact-set .set-num{font-size:9px;color:#747981;text-align:center}.compact-set input{width:100%;min-width:0;height:34px;border:1px solid #343941;background:#0e1013;color:#fff;border-radius:9px;text-align:center;font-size:14px;padding:0}.compact-set input:focus{border-color:#ff4b16;outline:none}.compact-set .x{color:#6f737a;text-align:center;font-size:11px}.compact-set button{width:30px;height:30px;border:0;border-radius:9px;background:#292d33;color:#ff8270;font-size:14px}
  .compact-add{height:32px;flex:0 0 32px;border:1px dashed #3a3f47;background:transparent;color:#b1b5bc;border-radius:10px;font-size:11px;margin-top:3px}
  .workout-footer{flex:0 0 82px;border-top:1px solid #292d33;padding-top:5px;margin-top:4px}.finish-row{display:grid;grid-template-columns:1fr 1.15fr;gap:6px}.finish-check{display:flex;align-items:center;gap:6px;height:36px;padding:4px 8px;border:1px solid #343941;background:#1b1e23;border-radius:10px;font-size:10px}.finish-check input{width:17px;height:17px;accent-color:#32d74b;margin:0}.finish-btn{height:36px!important;margin:0!important;border-radius:10px!important;font-size:11px!important}.finish-btn:disabled{opacity:.38}.workout-hint{height:18px;line-height:18px;text-align:center;color:#666b72;font-size:8px}
  @media(max-height:700px){.workout-head{height:34px;flex-basis:34px}.exercise-tabs{flex-basis:31px}.exercise-tab{height:25px}.workout-ex-name{height:27px;flex-basis:27px}.compact-set input{height:31px}.compact-set button{height:28px}.compact-add{height:29px;flex-basis:29px}.workout-footer{flex-basis:75px}}
  `;
  document.head.appendChild(style);

  window.bindRmCompact=function(scope=document){
    scope.querySelectorAll('.rmset').forEach(b=>b.onclick=()=>{
      const sets=b.closest('.compact-sets'),row=b.closest('.compact-set');
      if(sets&&sets.querySelectorAll('.compact-set').length>1)row.remove();
      if(sets)[...sets.querySelectorAll('.set-num')].forEach((n,i)=>n.textContent=i+1);
    });
  };

  const setRow=n=>`<div class="compact-set"><span class="set-num">${n}</span><input inputmode="decimal" placeholder="кг"><span class="x">×</span><input inputmode="numeric" placeholder="повт"><button class="rmset">×</button></div>`;

  window.openWorkoutEditor=function(event){
    const names=event.exercises||[];
    q('#modal').innerHTML=`<div class="modal-back workout-back"><div class="sheet workout-sheet">
      <div class="workout-head">
        <button id="cancelWorkout" class="workout-close">←</button>
        <div class="workout-title"><b>${event.name}</b><span>${new Date(event.date+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'short'})} · ${String(event.hour).padStart(2,'0')}:00</span></div>
        <div></div>
      </div>
      <div class="workout-counter"><span id="activeExerciseNumber">1</span> / ${Math.max(1,names.length)} упражнений</div>
      <div class="exercise-tabs">${names.map((name,i)=>`<button class="exercise-tab ${i===0?'active':''}" data-ex-tab="${i}">${i+1}. ${name}</button>`).join('')}</div>
      <div class="workout-panes">${names.length?names.map((name,i)=>`<section class="workout-pane exedit ${i===0?'active':''}" data-name="${name.replace(/"/g,'&quot;')}" data-pane="${i}">
        <div class="workout-ex-name"><h3>${name}</h3><span>рабочие подходы</span></div>
        <div class="set-head"><span>№</span><span>ВЕС</span><span></span><span>ПОВТ.</span><span></span></div>
        <div class="compact-sets">${setRow(1)}${setRow(2)}${setRow(3)}</div>
        <button class="compact-add addset" type="button">＋ ещё подход</button>
      </section>`).join(''):`<section class="workout-pane active"><div class="workout-ex-name"><h3>Нет упражнений</h3></div></section>`}</div>
      <div class="workout-footer">
        <div class="finish-row">
          <label class="finish-check"><input id="finishWorkoutCheck" type="checkbox"><span>Закончить ✓</span></label>
          <button id="saveWorkout" class="btn finish-btn" disabled>Сохранить тренировку</button>
        </div>
        <div class="workout-hint">Тренировка попадёт в историю только после галочки</div>
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
      sets.insertAdjacentHTML('beforeend',setRow(n));
      bindRmCompact(sets);
      sets.scrollTop=sets.scrollHeight;
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
