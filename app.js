(() => {
'use strict';
const SUPABASE_URL='https://dlaiacatpcgbzmumtggw.supabase.co';
const SUPABASE_KEY='sb_publishable_1_IEt89WvEBEhykAfS7rvw_jF7WwD6l';
const APP_BASE='https://dlaiacatpcgbzmumtggw.supabase.co/functions/v1/denisfit-app/';
const PUBLIC_APP_ORIGIN='https://angerkoba90-source.github.io';
const VAPID_PUBLIC_KEY='BKI3qymG-8FVAiEKsPGjPzMNZjIWilqo_E2ULDIo9W_gEYomBKI-LRzvwr5ulAB3H8jpP777uFnyVQ_ZSeeUHjc';
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>{if(v===''||v==null)return null;const x=Number(String(v).replace(',','.'));return Number.isFinite(x)?x:null};
const inRange=(x,min,max=Infinity)=>x!=null&&Number.isFinite(x)&&x>=min&&x<=max;
const fmtDate=v=>v?new Date(v.length===10?v+'T12:00:00':v).toLocaleDateString('ru-RU',{day:'2-digit',month:'short'}):'—';
const money=v=>new Intl.NumberFormat('ru-RU').format(Number(v||0))+' ₽';
const oneRm=(weight,reps)=>Number(weight||0)*(1+Number(reps||0)/30);
const monthKey=()=>{let d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`};
const uuid=()=>crypto.randomUUID();
const INVITE_STORAGE_KEY='denisfit_pending_invite';
let pendingInvite=null;
function inviteIdentifierFromUrl(){return new URLSearchParams(location.search).get('invite')||''}
function storedInviteIdentifier(){try{return localStorage.getItem(INVITE_STORAGE_KEY)||''}catch{return ''}}
function persistInviteIdentifier(v){try{if(v)localStorage.setItem(INVITE_STORAGE_KEY,v);else localStorage.removeItem(INVITE_STORAGE_KEY)}catch{}}
function cleanInviteUrl(){try{const u=new URL(location.href);u.searchParams.delete('invite');history.replaceState({},'',u.pathname+(u.search?u.search:'')+u.hash)}catch{}}
async function loadInvitePreview(identifier,{silent=false}={}){
  const value=String(identifier||'').trim();if(!value)return null;
  const {data,error}=await sb.rpc('get_client_invite',{p_identifier:value});
  if(error){if(!silent)toast('Не удалось проверить DenisFit Pass',true);return null}
  const row=Array.isArray(data)?data[0]:data;if(!row){if(!silent)toast('Pass не найден или срок действия истёк',true);return null}
  pendingInvite={identifier:value,...row};persistInviteIdentifier(value);renderInviteWelcome();return pendingInvite;
}
function renderInviteWelcome(){
  const box=$('inviteWelcome');if(!box)return;
  if(!pendingInvite){box.classList.add('hidden');box.innerHTML='';return}
  box.classList.remove('hidden');
  box.innerHTML=`<div class="invite-kicker">DENISFIT PASS</div><h2>${esc(pendingInvite.client_name||'Твой личный кабинет готов')}</h2><p><b>${esc(pendingInvite.trainer_name||'Тренер')}</b> приглашает тебя в DenisFit.</p><div class="invite-benefits"><span>Тренировки</span><span>Питание</span><span>Прогресс</span><span>Обратная связь</span></div><div class="invite-code-preview">${esc(pendingInvite.short_code||'')}</div>`;
  if($('authName')&&!$('authName').value)$('authName').value=pendingInvite.client_name||'';
  if($('authWeekly')&&pendingInvite.weekly_sessions!=null)$('authWeekly').value=String(pendingInvite.weekly_sessions);
  
}
async function consumePendingInvite(){
  const identifier=pendingInvite?.identifier||inviteIdentifierFromUrl()||storedInviteIdentifier();if(!identifier)return null;
  const {data,error}=await sb.rpc('consume_client_invite',{p_identifier:identifier});
  if(error){const m=String(error.message||'Не удалось активировать Pass');console.error('Pass activation error',error);if(/trainer accounts|not found|expired/i.test(m)){persistInviteIdentifier('');pendingInvite=null;cleanInviteUrl()}setTimeout(()=>toast(/trainer accounts/i.test(m)?'Открой DenisFit Pass в аккаунте клиента':m,true),200);return null}
  const row=Array.isArray(data)?data[0]:data;persistInviteIdentifier('');pendingInvite=null;cleanInviteUrl();
  try{sessionStorage.setItem('denisfit_pass_activated',row?.trainer_name||'Тренер')}catch{}
  return row||null;
}

const BUILTIN_EXERCISES=[{"category":"Тренажёры","equipment":"Платформенный тренажёр","muscle_group":"Ноги / ягодицы","name":"Жим ногами 45°"},{"category":"Тренажёры","equipment":"Платформенный тренажёр","muscle_group":"Ноги / ягодицы","name":"Жим ногами горизонтальный"},{"category":"Тренажёры","equipment":"Платформенный тренажёр","muscle_group":"Ноги / ягодицы","name":"Жим ногами вертикальный"},{"category":"Тренажёры","equipment":"Платформенный тренажёр","muscle_group":"Ноги / ягодицы","name":"Жим ногами одной ногой"},{"category":"Тренажёры","equipment":"Платформенный тренажёр","muscle_group":"Ноги / ягодицы","name":"Гакк-присед"},{"category":"Тренажёры","equipment":"Платформенный тренажёр","muscle_group":"Ноги / ягодицы","name":"Обратный гакк-присед"},{"category":"Тренажёры","equipment":"Платформенный тренажёр","muscle_group":"Ноги / ягодицы","name":"Маятниковый присед в тренажёре"},{"category":"Тренажёры","equipment":"Платформенный тренажёр","muscle_group":"Ноги / ягодицы","name":"V-присед в тренажёре"},{"category":"Тренажёры","equipment":"Платформенный тренажёр","muscle_group":"Ноги / ягодицы","name":"Присед в тренажёре Смита"},{"category":"Тренажёры","equipment":"Платформенный тренажёр","muscle_group":"Ноги / ягодицы","name":"Фронтальный присед в Смите"},{"category":"Тренажёры","equipment":"Платформенный тренажёр","muscle_group":"Ноги / ягодицы","name":"Болгарский выпад в Смите"},{"category":"Тренажёры","equipment":"Платформенный тренажёр","muscle_group":"Ноги / ягодицы","name":"Выпад назад в Смите"},{"category":"Тренажёры","equipment":"Платформенный тренажёр","muscle_group":"Ноги / ягодицы","name":"Ягодичный мост в Смите"},{"category":"Тренажёры","equipment":"Платформенный тренажёр","muscle_group":"Ноги / ягодицы","name":"Румынская тяга в Смите"},{"category":"Тренажёры","equipment":"Платформенный тренажёр","muscle_group":"Ноги / ягодицы","name":"Подъём на носки в Смите"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Квадрицепс","name":"Разгибание ног сидя"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Квадрицепс","name":"Разгибание одной ноги сидя"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Квадрицепс","name":"Сисси-присед в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Задняя поверхность бедра","name":"Сгибание ног лёжа"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Задняя поверхность бедра","name":"Сгибание ног сидя"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Задняя поверхность бедра","name":"Сгибание ног стоя"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Задняя поверхность бедра","name":"Сгибание одной ноги лёжа"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Ягодицы","name":"Ягодичный мост / Glute Drive в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Ягодицы","name":"Разгибание бедра в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Ягодицы","name":"Отведение ноги назад в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Ягодицы","name":"Отведение бедра сидя"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Ягодицы","name":"Отведение бедра стоя в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Ягодицы","name":"Мах ногой назад в рычажном тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Приводящие мышцы","name":"Приведение бедра сидя"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Приводящие мышцы","name":"Приведение бедра стоя в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Икры","name":"Подъём на носки стоя в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Икры","name":"Подъём на носки сидя в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Икры","name":"Подъём на носки в жиме ногами"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Икры","name":"Подъём на носки в гакк-тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Спина","name":"Тяга верхнего блока в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Спина","name":"Вертикальная тяга рычажного тренажёра"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Спина","name":"Тяга к груди в рычажном тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Спина","name":"Горизонтальная тяга в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Спина","name":"Тяга сидя с упором грудью"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Спина","name":"Высокая тяга в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Спина","name":"Низкая тяга в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Спина","name":"Тяга одной рукой в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Спина","name":"Пуловер в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Спина","name":"Тяга Т-грифа в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Спина","name":"Ассистированные подтягивания"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Грудь","name":"Жим от груди в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Грудь","name":"Жим от груди под наклоном в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Грудь","name":"Жим от груди вниз в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Грудь","name":"Сведение рук в тренажёре Pec Deck"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Грудь","name":"Односторонний жим от груди в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Плечи","name":"Жим плечами в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Плечи","name":"Подъём рук в стороны в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Плечи","name":"Обратная бабочка / задняя дельта в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Плечи","name":"Подъём рук вперёд в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Бицепс","name":"Сгибание рук в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Бицепс","name":"Сгибание рук на скамье Скотта в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Трицепс","name":"Разгибание рук в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Трицепс","name":"Отжимание на брусьях в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Трицепс","name":"Ассистированные отжимания на брусьях"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Кор","name":"Скручивания в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Кор","name":"Ротация корпуса в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Кор","name":"Разгибание спины в тренажёре"},{"category":"Тренажёры","equipment":"Тренажёр","muscle_group":"Кор","name":"Боковые наклоны в тренажёре"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Ноги / ягодицы","name":"Присед со штангой на спине"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Ноги / ягодицы","name":"Присед со штангой high-bar"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Ноги / ягодицы","name":"Присед со штангой low-bar"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Ноги / ягодицы","name":"Фронтальный присед со штангой"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Ноги / ягодицы","name":"Присед Зерхера"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Ноги / ягодицы","name":"Присед со штангой на ящик"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Ноги / ягодицы","name":"Пауза-присед со штангой"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Ноги / ягодицы","name":"Выпады со штангой вперёд"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Ноги / ягодицы","name":"Выпады со штангой назад"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Ноги / ягодицы","name":"Ходьба выпадами со штангой"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Ноги / ягодицы","name":"Болгарский сплит-присед со штангой"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Ноги / ягодицы","name":"Шаги на платформу со штангой"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Ноги / ягодицы","name":"Ягодичный мост со штангой"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Ноги / ягодицы","name":"Хип-траст со штангой"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Задняя цепь","name":"Классическая становая тяга"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Задняя цепь","name":"Становая тяга сумо"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Задняя цепь","name":"Румынская тяга со штангой"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Задняя цепь","name":"Становая тяга на прямых ногах"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Задняя цепь","name":"Тяга с дефицита"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Задняя цепь","name":"Тяга с плинтов"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Задняя цепь","name":"Good Morning со штангой"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Грудь","name":"Жим штанги лёжа"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Грудь","name":"Жим штанги лёжа узким хватом"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Грудь","name":"Жим штанги лёжа широким хватом"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Грудь","name":"Жим штанги на наклонной скамье"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Грудь","name":"Жим штанги на отрицательной скамье"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Грудь","name":"Жим штанги лёжа с паузой"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Грудь","name":"Жим штанги с пола"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Плечи","name":"Жим штанги стоя"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Плечи","name":"Жим штанги сидя"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Плечи","name":"Армейский жим"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Плечи","name":"Жим штанги из-за головы"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Плечи","name":"Жим штанги широким хватом"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Плечи","name":"Швунг жимовой"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Плечи","name":"Швунг толчковый"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Плечи","name":"Тяга штанги к подбородку"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Спина","name":"Тяга штанги в наклоне"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Спина","name":"Тяга штанги в наклоне обратным хватом"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Спина","name":"Тяга Пендлея"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Спина","name":"Тяга Т-грифа со штангой"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Спина","name":"Тяга штанги к поясу с упором грудью"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Спина","name":"Шраги со штангой"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Бицепс","name":"Сгибание рук со штангой стоя"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Бицепс","name":"Сгибание рук с EZ-грифом"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Бицепс","name":"Обратные сгибания со штангой"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Бицепс","name":"Сгибание рук на скамье Скотта с EZ-грифом"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Трицепс","name":"Французский жим со штангой лёжа"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Трицепс","name":"Французский жим EZ-грифом"},{"category":"Свободные веса","equipment":"Штанга","muscle_group":"Трицепс","name":"Разгибание рук со штангой из-за головы"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Ноги / ягодицы","name":"Гоблет-присед с гантелью"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Ноги / ягодицы","name":"Присед с двумя гантелями"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Ноги / ягодицы","name":"Болгарский сплит-присед с гантелями"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Ноги / ягодицы","name":"Выпады с гантелями вперёд"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Ноги / ягодицы","name":"Выпады с гантелями назад"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Ноги / ягодицы","name":"Ходьба выпадами с гантелями"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Ноги / ягодицы","name":"Шаги на платформу с гантелями"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Ноги / ягодицы","name":"Латеральные выпады с гантелью"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Ноги / ягодицы","name":"Ягодичный мост с гантелью"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Ноги / ягодицы","name":"Хип-траст с гантелью"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Ноги / ягодицы","name":"Румынская тяга с гантелями"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Ноги / ягодицы","name":"Румынская тяга на одной ноге с гантелью"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Ноги / ягодицы","name":"Подъём на носки с гантелями"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Грудь","name":"Жим гантелей лёжа"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Грудь","name":"Жим гантелей на наклонной скамье"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Грудь","name":"Жим гантелей на отрицательной скамье"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Грудь","name":"Жим гантелей нейтральным хватом"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Грудь","name":"Жим гантелей на полу"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Грудь","name":"Разведение гантелей лёжа"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Грудь","name":"Разведение гантелей на наклонной скамье"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Грудь","name":"Пуловер с гантелью"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Плечи","name":"Жим гантелей сидя"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Плечи","name":"Жим гантелей стоя"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Плечи","name":"Жим Арнольда"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Плечи","name":"Подъём гантелей в стороны"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Плечи","name":"Подъём гантелей в стороны сидя"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Плечи","name":"Подъём гантелей в стороны в наклоне"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Плечи","name":"Подъём гантелей перед собой"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Плечи","name":"Разведение гантелей на заднюю дельту"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Плечи","name":"Y-подъём гантелей"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Плечи","name":"Шраги с гантелями"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Спина","name":"Тяга гантели одной рукой"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Спина","name":"Тяга двух гантелей в наклоне"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Спина","name":"Тяга гантелей с упором грудью"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Спина","name":"Renegade Row / тяга гантелей в планке"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Бицепс","name":"Сгибание рук с гантелями стоя"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Бицепс","name":"Попеременные сгибания с гантелями"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Бицепс","name":"Молотковые сгибания"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Бицепс","name":"Концентрированное сгибание"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Бицепс","name":"Сгибание рук на наклонной скамье"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Бицепс","name":"Сгибание Зоттмана"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Трицепс","name":"Французский жим с гантелями лёжа"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Трицепс","name":"Разгибание одной руки с гантелью из-за головы"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Трицепс","name":"Разгибание двух рук с гантелью из-за головы"},{"category":"Свободные веса","equipment":"Гантели","muscle_group":"Трицепс","name":"Кикбэк с гантелью"},{"category":"Свободные веса","equipment":"Гиря","muscle_group":"Всё тело","name":"Свинг гирей"},{"category":"Свободные веса","equipment":"Гиря","muscle_group":"Всё тело","name":"Свинг гирей одной рукой"},{"category":"Свободные веса","equipment":"Гиря","muscle_group":"Всё тело","name":"Рывок гири"},{"category":"Свободные веса","equipment":"Гиря","muscle_group":"Всё тело","name":"Толчок гири"},{"category":"Свободные веса","equipment":"Гиря","muscle_group":"Всё тело","name":"Взятие гири на грудь"},{"category":"Свободные веса","equipment":"Гиря","muscle_group":"Всё тело","name":"Присед с гирей Goblet"},{"category":"Свободные веса","equipment":"Гиря","muscle_group":"Всё тело","name":"Фронтальный присед с двумя гирями"},{"category":"Свободные веса","equipment":"Гиря","muscle_group":"Всё тело","name":"Выпад с гирями"},{"category":"Свободные веса","equipment":"Гиря","muscle_group":"Всё тело","name":"Румынская тяга с гирями"},{"category":"Свободные веса","equipment":"Гиря","muscle_group":"Всё тело","name":"Становая тяга с гирей"},{"category":"Свободные веса","equipment":"Гиря","muscle_group":"Всё тело","name":"Жим гири стоя"},{"category":"Свободные веса","equipment":"Гиря","muscle_group":"Всё тело","name":"Турецкий подъём"},{"category":"Свободные веса","equipment":"Гиря","muscle_group":"Всё тело","name":"Фермерская прогулка с гирями"},{"category":"Свободные веса","equipment":"Гиря","muscle_group":"Всё тело","name":"Suitcase Carry с гирей"},{"category":"Блоки / кроссовер","equipment":"Кроссовер","muscle_group":"Грудь","name":"Сведение рук в кроссовере сверху вниз"},{"category":"Блоки / кроссовер","equipment":"Кроссовер","muscle_group":"Грудь","name":"Сведение рук в кроссовере на уровне груди"},{"category":"Блоки / кроссовер","equipment":"Кроссовер","muscle_group":"Грудь","name":"Сведение рук в кроссовере снизу вверх"},{"category":"Блоки / кроссовер","equipment":"Кроссовер","muscle_group":"Грудь","name":"Одностороннее сведение руки в кроссовере"},{"category":"Блоки / кроссовер","equipment":"Кроссовер","muscle_group":"Грудь","name":"Жим от груди в кроссовере стоя"},{"category":"Блоки / кроссовер","equipment":"Верхний блок","muscle_group":"Спина","name":"Тяга верхнего блока широким хватом"},{"category":"Блоки / кроссовер","equipment":"Верхний блок","muscle_group":"Спина","name":"Тяга верхнего блока средним хватом"},{"category":"Блоки / кроссовер","equipment":"Верхний блок","muscle_group":"Спина","name":"Тяга верхнего блока узким нейтральным хватом"},{"category":"Блоки / кроссовер","equipment":"Верхний блок","muscle_group":"Спина","name":"Тяга верхнего блока обратным хватом"},{"category":"Блоки / кроссовер","equipment":"Верхний блок","muscle_group":"Спина","name":"Тяга верхнего блока одной рукой"},{"category":"Блоки / кроссовер","equipment":"Верхний блок","muscle_group":"Спина","name":"Пуловер на верхнем блоке прямыми руками"},{"category":"Блоки / кроссовер","equipment":"Нижний блок","muscle_group":"Спина","name":"Горизонтальная тяга блока узким хватом"},{"category":"Блоки / кроссовер","equipment":"Нижний блок","muscle_group":"Спина","name":"Горизонтальная тяга блока широким хватом"},{"category":"Блоки / кроссовер","equipment":"Нижний блок","muscle_group":"Спина","name":"Тяга нижнего блока одной рукой"},{"category":"Блоки / кроссовер","equipment":"Нижний блок","muscle_group":"Спина","name":"Тяга каната к лицу / Face Pull"},{"category":"Блоки / кроссовер","equipment":"Нижний блок","muscle_group":"Спина","name":"Высокая тяга каната к груди"},{"category":"Блоки / кроссовер","equipment":"Кроссовер","muscle_group":"Плечи","name":"Подъём руки в сторону на нижнем блоке"},{"category":"Блоки / кроссовер","equipment":"Кроссовер","muscle_group":"Плечи","name":"Подъём рук в стороны в кроссовере"},{"category":"Блоки / кроссовер","equipment":"Кроссовер","muscle_group":"Плечи","name":"Подъём руки вперёд на нижнем блоке"},{"category":"Блоки / кроссовер","equipment":"Кроссовер","muscle_group":"Плечи","name":"Отведение руки назад на заднюю дельту в кроссовере"},{"category":"Блоки / кроссовер","equipment":"Кроссовер","muscle_group":"Плечи","name":"Y-подъём на блоках"},{"category":"Блоки / кроссовер","equipment":"Нижний блок","muscle_group":"Бицепс","name":"Сгибание рук на нижнем блоке с прямой рукоятью"},{"category":"Блоки / кроссовер","equipment":"Нижний блок","muscle_group":"Бицепс","name":"Сгибание рук на нижнем блоке с канатом"},{"category":"Блоки / кроссовер","equipment":"Нижний блок","muscle_group":"Бицепс","name":"Сгибание одной руки на нижнем блоке"},{"category":"Блоки / кроссовер","equipment":"Нижний блок","muscle_group":"Бицепс","name":"Bayesian curl / сгибание руки за корпусом на блоке"},{"category":"Блоки / кроссовер","equipment":"Верхний блок","muscle_group":"Трицепс","name":"Разгибание рук на верхнем блоке с канатом"},{"category":"Блоки / кроссовер","equipment":"Верхний блок","muscle_group":"Трицепс","name":"Разгибание рук на верхнем блоке с прямой рукоятью"},{"category":"Блоки / кроссовер","equipment":"Верхний блок","muscle_group":"Трицепс","name":"Разгибание рук обратным хватом на верхнем блоке"},{"category":"Блоки / кроссовер","equipment":"Верхний блок","muscle_group":"Трицепс","name":"Разгибание одной руки на верхнем блоке"},{"category":"Блоки / кроссовер","equipment":"Верхний блок","muscle_group":"Трицепс","name":"Разгибание рук над головой с канатом"},{"category":"Блоки / кроссовер","equipment":"Нижний блок","muscle_group":"Ягодицы / ноги","name":"Отведение ноги назад на нижнем блоке"},{"category":"Блоки / кроссовер","equipment":"Нижний блок","muscle_group":"Ягодицы / ноги","name":"Отведение ноги в сторону на нижнем блоке"},{"category":"Блоки / кроссовер","equipment":"Нижний блок","muscle_group":"Ягодицы / ноги","name":"Приведение ноги на нижнем блоке"},{"category":"Блоки / кроссовер","equipment":"Нижний блок","muscle_group":"Ягодицы / ноги","name":"Сгибание ноги стоя на нижнем блоке"},{"category":"Блоки / кроссовер","equipment":"Нижний блок","muscle_group":"Ягодицы / ноги","name":"Разгибание ноги на нижнем блоке"},{"category":"Блоки / кроссовер","equipment":"Нижний блок","muscle_group":"Ягодицы / ноги","name":"Pull-through / протяжка на нижнем блоке"},{"category":"Блоки / кроссовер","equipment":"Нижний блок","muscle_group":"Ягодицы / ноги","name":"Присед с нижним блоком"},{"category":"Блоки / кроссовер","equipment":"Нижний блок","muscle_group":"Ягодицы / ноги","name":"Обратный выпад с нижним блоком"},{"category":"Блоки / кроссовер","equipment":"Блок","muscle_group":"Кор","name":"Скручивания на верхнем блоке"},{"category":"Блоки / кроссовер","equipment":"Блок","muscle_group":"Кор","name":"Pallof Press"},{"category":"Блоки / кроссовер","equipment":"Блок","muscle_group":"Кор","name":"Pallof Press с шагом"},{"category":"Блоки / кроссовер","equipment":"Блок","muscle_group":"Кор","name":"Дровосек сверху вниз"},{"category":"Блоки / кроссовер","equipment":"Блок","muscle_group":"Кор","name":"Дровосек снизу вверх"},{"category":"Блоки / кроссовер","equipment":"Блок","muscle_group":"Кор","name":"Антиротация на блоке"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Грудь / трицепс","name":"Отжимания от пола"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Грудь / трицепс","name":"Отжимания узким хватом"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Грудь / трицепс","name":"Отжимания широким хватом"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Грудь / трицепс","name":"Отжимания с ногами на возвышении"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Грудь / трицепс","name":"Отжимания от опоры"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Грудь / трицепс","name":"Отжимания на брусьях"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Спина / бицепс","name":"Подтягивания прямым хватом"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Спина / бицепс","name":"Подтягивания обратным хватом"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Спина / бицепс","name":"Подтягивания нейтральным хватом"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Спина / бицепс","name":"Австралийские подтягивания"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Спина / бицепс","name":"Подтягивания с паузой"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Ноги / ягодицы","name":"Приседания с собственным весом"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Ноги / ягодицы","name":"Воздушные приседания"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Ноги / ягодицы","name":"Выпады вперёд"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Ноги / ягодицы","name":"Выпады назад"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Ноги / ягодицы","name":"Болгарские выпады"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Ноги / ягодицы","name":"Боковые выпады"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Ноги / ягодицы","name":"Реверанс-выпады"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Ноги / ягодицы","name":"Шаги на платформу"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Ноги / ягодицы","name":"Ягодичный мост"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Ноги / ягодицы","name":"Ягодичный мост на одной ноге"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Ноги / ягодицы","name":"Присед на одной ноге к опоре"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Ноги / ягодицы","name":"Пистолет-присед"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Ноги / ягодицы","name":"Nordic Curl"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Ноги / ягодицы","name":"Сгибание ног лёжа с пятками на полотенце"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Кор","name":"Планка на предплечьях"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Кор","name":"Боковая планка"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Кор","name":"Планка с касанием плеч"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Кор","name":"Dead Bug"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Кор","name":"Bird Dog"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Кор","name":"Hollow Hold"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Кор","name":"Скручивания"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Кор","name":"Обратные скручивания"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Кор","name":"Подъём ног лёжа"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Кор","name":"Подъём коленей в висе"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Кор","name":"Подъём прямых ног в висе"},{"category":"Собственный вес","equipment":"Собственный вес","muscle_group":"Кор","name":"Mountain Climbers"},{"category":"MFR","equipment":"Ролл / мяч","muscle_group":"Всё тело","name":"MFR"},{"category":"Mobility","equipment":"Без оборудования","muscle_group":"Всё тело","name":"Mobility"}];
const RECOVERY_CATEGORIES=new Set(['MFR','Mobility']);
const EXERCISE_GROUP_ORDER=['Спина','Грудные мышцы','Дельты','Руки','Ноги','Ягодицы','Пресс','Mobility','MFR','Другое'];
function exerciseGroup(x){
  const cat=String(x?.category||'').toLowerCase(),mg=String(x?.muscle_group||'').toLowerCase(),name=String(x?.name||'').toLowerCase();
  if(cat==='mobility'||name==='mobility')return 'Mobility';
  if(cat==='mfr'||name==='mfr')return 'MFR';
  if(name.includes('разгибание спины')||mg.includes('спина'))return 'Спина';
  if(mg.includes('груд'))return 'Грудные мышцы';
  if(mg.includes('плеч'))return 'Дельты';
  if(mg.includes('бицеп')||mg.includes('трицеп')||mg.includes('предплеч'))return 'Руки';
  if(mg.includes('кор')||mg.includes('пресс')||mg.includes('живот'))return 'Пресс';
  if(mg.includes('всё тело')){
    if(name.includes('жим гири'))return 'Дельты';
    if(name.includes('турец')||name.includes('carry')||name.includes('прогул'))return 'Пресс';
    return 'Ноги';
  }
  if(mg==='ягодицы'||mg.startsWith('ягодицы /'))return 'Ягодицы';
  if(mg.includes('ноги / ягодицы')){
    if(/ягодич|хип-траст|hip thrust|отвед|разгибание бедра|pull-through|протяжк/.test(name))return 'Ягодицы';
    return 'Ноги';
  }
  if(mg.includes('квадриц')||mg.includes('задняя поверхность бедра')||mg.includes('задняя цеп')||mg.includes('икр')||mg.includes('приводящ')||mg.includes('ног'))return 'Ноги';
  if(mg.includes('ягод'))return 'Ягодицы';
  return 'Другое';
}
function groupExercises(items){
  const groups={};for(const g of EXERCISE_GROUP_ORDER)groups[g]=[];
  for(const x of items)(groups[exerciseGroup(x)]||groups['Другое']).push(x);
  return EXERCISE_GROUP_ORDER.filter(g=>groups[g].length).map(g=>[g,groups[g]]);
}

let user=null, profile=null, role='client', coachingMode='mixed', page='home', currentWorkoutId=null, selectedClient=null, demo=false, lastTestClientCredentials=null;
let demoData={sets:[40,45,50,52.5,57.5],weights:[71.4,69.2,67.6],waists:[78,75.5,73],meals:3};

function toast(msg,err=false){const x=$('toast');x.textContent=msg;x.className='toast'+(err?' err':'');clearTimeout(x._t);x._t=setTimeout(()=>x.classList.add('hidden'),3000)}
function loading(){ $('main').innerHTML='<div class="spinner"></div>' }
function card(title,body){return `<div class="card"><b>${esc(title)}</b>${body||''}</div>`}
function showAuth(){demo=false;$('auth').classList.remove('hidden');$('app').classList.add('hidden');$('nav').classList.add('hidden');renderAuthLanding()}
function showApp(){ $('auth').classList.add('hidden');$('app').classList.remove('hidden');$('nav').classList.remove('hidden');$('roleBadge').textContent=role==='trainer'?'ТРЕНЕР':'КЛИЕНТ' }
function navItems(){if(role==='trainer')return [['home','⌂','Главная'],['schedule','▦','Расписание'],['clients','◎','Клиенты'],['programs','▤','Программы'],['library','▤','Библиотека'],['profile','●','Профиль']];const base=[['home','⌂','Главная']];if(coachingMode==='mixed')base.push(['programs','▤','Мои программы']);base.push(['progress','↗','Прогресс'],['meals','◉','Питание'],['profile','●','Профиль']);return base}
function renderNav(){ $('nav').innerHTML=navItems().map(x=>`<button data-page="${x[0]}" class="${page===x[0]?'active':''}"><b>${x[1]}</b>${x[2]}</button>`).join(''); document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>go(b.dataset.page)) }
async function go(p){page=p;renderNav();loading();try{if(role==='trainer'){if(p==='home')await trainerHome();else if(p==='schedule')await trainerSchedule();else if(p==='clients')await trainerClients();else if(p==='programs')await trainerPrograms();else if(p==='library')await trainerLibrary();else await profilePage()}else{if(p==='home')await clientHome();else if(p==='programs')await clientProgramsPage();else if(p==='progress')await progressPage();else if(p==='meals')await mealsPage();else if(p==='library')await clientLibrary();else await profilePage()}}catch(e){console.error(e);$('main').innerHTML=card('Ошибка',`<p class="muted">${esc(e.message||e)}</p>`)}}



function stableInviteCodeFromPath(){
  const m=location.pathname.match(/\/join\/([^/?#]+)\/?$/i);
  return m?decodeURIComponent(m[1]).trim():'';
}
function stableJoinRootPath(){
  const m=location.pathname.match(/^(.*)\/join\/[^/]+\/?$/i);
  if(!m)return location.pathname||'/';
  return m[1]?`${m[1]}/`:'/';
}
async function getMyStableClient(){
  const q=await sb.from('clients').select('id,trainer_id,name,claimed,claimed_at').maybeSingle();
  if(q.error)throw q.error;
  return q.data||null;
}
async function ensureAnonymousSession(){
  const current=await sb.auth.getSession();
  if(current.error)throw current.error;
  if(current.data.session){
    if(current.data.session.user?.is_anonymous===true)return current.data.session;
    throw new Error('В этом браузере уже выполнен вход тренера. Открой приглашение в приватной вкладке.');
  }
  const created=await sb.auth.signInAnonymously();
  if(created.error)throw created.error;
  if(!created.data.session)throw new Error('Не удалось создать защищённую сессию клиента');
  return created.data.session;
}
function showJoinFatalError(message){
  demo=false;$('auth').classList.remove('hidden');$('app').classList.add('hidden');$('nav').classList.add('hidden');
  $('trainerLoginPanel')?.classList.add('hidden');
  const box=$('clientAccessLanding');if(!box)return;
  box.classList.remove('hidden');
  box.innerHTML=`<div class="invite-kicker">DENISFIT PASS</div><h2>Не удалось открыть кабинет</h2><p class="client-access-lead">${esc(message||'Попробуй открыть приглашение ещё раз.')}</p><button id="joinReload" class="btn secondary">Попробовать снова</button>`;
  $('joinReload').onclick=()=>location.reload();
}
async function claimStableInvite(inviteCode,name){
  const s=await sb.auth.getSession();
  const session=s.data.session;if(!session?.access_token)throw new Error('Сессия клиента не создана');
  const res=await fetch(`${SUPABASE_URL}/functions/v1/claim-invite`,{
    method:'POST',headers:{'Authorization':`Bearer ${session.access_token}`,'Content-Type':'application/json','apikey':SUPABASE_KEY},
    body:JSON.stringify({invite_code:inviteCode,name})
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok||!data?.ok)throw new Error(data?.error||'Не удалось активировать приглашение');
  return data;
}
function showJoinScreen(inviteCode){
  demo=false;$('auth').classList.remove('hidden');$('app').classList.add('hidden');$('nav').classList.add('hidden');
  $('trainerLoginPanel')?.classList.add('hidden');
  const box=$('clientAccessLanding');if(!box)return;
  box.classList.remove('hidden');
  box.innerHTML=`<div class="invite-kicker">DENISFIT PASS</div><h2>Личный кабинет готов</h2><p class="client-access-lead">Тренер уже открыл тебе доступ. Остался один шаг.</p><form id="stableJoinForm" class="client-code-form"><label class="label" for="stableJoinName">Как к тебе обращаться?</label><input id="stableJoinName" class="input" maxlength="80" autocomplete="name" placeholder="Имя"><button id="stableJoinSubmit" class="btn primary auth-submit-v13" type="submit">Открыть DenisFit <span>→</span></button><p id="stableJoinError" class="small center join-error"></p></form><p class="small muted center client-no-registration">Без почты, пароля и регистрации.</p>`;
  $('stableJoinForm').onsubmit=async e=>{
    e.preventDefault();const name=$('stableJoinName').value.trim();if(!name){$('stableJoinError').textContent='Укажи имя';return}
    $('stableJoinSubmit').disabled=true;$('stableJoinError').textContent='';
    try{await claimStableInvite(inviteCode,name);history.replaceState({},'',stableJoinRootPath());await initAuthenticatedClient()}
    catch(err){$('stableJoinError').textContent=String(err?.message||'Не удалось открыть кабинет');$('stableJoinSubmit').disabled=false}
  };
  setTimeout(()=>$('stableJoinName')?.focus(),80);
}
async function initAuthenticatedClient(session=null){
  if(!session){const s=await sb.auth.getSession();session=s.data.session}
  if(!session)throw new Error('Сессия клиента не найдена');
  user=session.user;role='client';
  const [p,cm]=await Promise.all([
    sb.from('profiles').select('*').eq('id',user.id).single(),
    sb.from('trainer_clients').select('coaching_mode').eq('client_id',user.id).eq('status','active').limit(1).maybeSingle()
  ]);
  if(p.error)throw p.error;profile=p.data;coachingMode=cm.data?.coaching_mode||'mixed';
  showApp();const open=new URLSearchParams(location.search).get('open');await go(open==='progress'?'progress':'home');
}
async function initLegacyAuthenticatedUser(session){
  user=session.user;
  const [p,r]=await Promise.all([sb.from('profiles').select('*').eq('id',user.id).single(),sb.from('user_roles').select('role').eq('user_id',user.id).single()]);
  if(p.error)throw p.error;profile=p.data;role=r.data?.role||'client';
  if(role==='trainer')await ensureBuiltinLibrary();else{const cm=await sb.from('trainer_clients').select('coaching_mode').eq('client_id',user.id).eq('status','active').limit(1).maybeSingle();if(!cm.error&&cm.data?.coaching_mode)coachingMode=cm.data.coaching_mode}
  showApp();const open=new URLSearchParams(location.search).get('open');await go(role==='client'&&open==='progress'?'progress':'home');
}
async function initJoinFlow(inviteCode){
  try{
    const session=await ensureAnonymousSession();
    const existing=await getMyStableClient();
    if(existing){history.replaceState({},'',stableJoinRootPath());await initAuthenticatedClient(session);return}
    showJoinScreen(inviteCode);
  }catch(e){console.error(e);showJoinFatalError(e?.message||'Не удалось открыть приглашение')}
}

let librarySeeded=false;
async function ensureBuiltinLibrary(){
  if(role!=='trainer'||librarySeeded)return;
  const {data:existing,error}=await sb.from('exercises').select('name,archived').eq('trainer_id',user.id);
  if(error)throw error;
  const names=new Set((existing||[]).map(x=>String(x.name||'').trim().toLowerCase()));
  const missing=BUILTIN_EXERCISES.filter(x=>!names.has(x.name.trim().toLowerCase()));
  for(let i=0;i<missing.length;i+=70){
    const rows=missing.slice(i,i+70).map(x=>({
      trainer_id:user.id,name:x.name,muscle_group:x.muscle_group,description:x.equipment,
      category:x.category,equipment:x.equipment,is_system:true,archived:false
    }));
    if(!rows.length)continue;
    const q=await sb.from('exercises').insert(rows);
    if(q.error)throw q.error;
  }
  librarySeeded=true;
}

async function init(){
  const urlInvite=inviteIdentifierFromUrl();
  if(urlInvite){location.replace(`${SUPABASE_URL}/functions/v1/client-access?token=${encodeURIComponent(urlInvite)}`);return}
  const joinCode=stableInviteCodeFromPath();
  if(joinCode){await initJoinFlow(joinCode);return}
  persistInviteIdentifier('');pendingInvite=null;
  const s=await sb.auth.getSession();if(s.error)throw s.error;const session=s.data.session;
  if(!session){showAuth();return}
  if(session.user?.is_anonymous===true){
    const stable=await getMyStableClient();
    if(stable){await initAuthenticatedClient(session);return}
    showAuth();return;
  }
  await initLegacyAuthenticatedUser(session);
}

function trainerLoginMode(){return new URLSearchParams(location.search).get('trainer')==='1'}
function renderAuthLanding(){const trainer=trainerLoginMode();$('clientAccessLanding')?.classList.toggle('hidden',trainer);$('trainerLoginPanel')?.classList.toggle('hidden',!trainer);if(trainer)setTimeout(()=>$('trainerAuthEmail')?.focus(),60)}
async function trainerEmailAuth(){
  const email=$('trainerAuthEmail')?.value.trim().toLowerCase()||'';
  const password=$('trainerAuthPassword')?.value||'';
  if(!email||!email.includes('@'))return toast('Введите email тренера',true);
  if(!password)return toast('Введите пароль тренера',true);
  $('trainerLoginSubmit').disabled=true;
  try{const {error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;await init()}
  catch(e){const m=String(e?.message||'Ошибка входа');toast(m.toLowerCase().includes('invalid login credentials')?'Неверный email или пароль':m,true)}
  finally{if($('trainerLoginSubmit'))$('trainerLoginSubmit').disabled=false}
}
function openClientAccessCode(){const code=($('clientAccessShortCode')?.value||'').trim().toUpperCase();if(!code)return toast('Введи код доступа',true);location.href=`${SUPABASE_URL}/functions/v1/client-access?code=${encodeURIComponent(code)}`}
$('clientCodeForm')?.addEventListener('submit',e=>{e.preventDefault();openClientAccessCode()});
$('openTrainerLogin')?.addEventListener('click',()=>{const u=new URL(location.href);u.searchParams.set('trainer','1');history.replaceState({},'',u.pathname+u.search+u.hash);renderAuthLanding()});
$('backToClientAccess')?.addEventListener('click',()=>{const u=new URL(location.href);u.searchParams.delete('trainer');history.replaceState({},'',u.pathname+(u.search?u.search:'')+u.hash);renderAuthLanding()});
$('trainerLoginSubmit')?.addEventListener('click',trainerEmailAuth);
$('trainerAuthPassword')?.addEventListener('keydown',e=>{if(e.key==='Enter')trainerEmailAuth()});
renderAuthLanding();$


function lineChart(values,label,unit=''){const a=values.map(Number).filter(Number.isFinite);if(a.length<2)return '<div class="empty">Нужно хотя бы два значения</div>';const lo=Math.min(...a),hi=Math.max(...a),rg=hi-lo||1;const pts=a.map((v,i)=>`${10+i*280/(a.length-1)},${125-(v-lo)/rg*105}`).join(' ');return `<div class="chart"><svg viewBox="0 0 300 145" preserveAspectRatio="none"><line x1="10" y1="125" x2="290" y2="125" stroke="#343a35"/><polyline points="${pts}" fill="none" stroke="#caff32" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${a.map((v,i)=>`<circle cx="${10+i*280/(a.length-1)}" cy="${125-(v-lo)/rg*105}" r="4" fill="#caff32"/>`).join('')}</svg></div><div class="chart-foot">${esc(label)}: ${a[0]} → <b class="lime">${a[a.length-1]}${unit}</b></div>`}
function progressBar(actual,plan){const pct=plan?Math.min(100,actual/plan*100):0;return `<div class="progress"><div style="width:${pct}%"></div></div>`}
function currentMonthBounds(){const d=new Date(),start=new Date(d.getFullYear(),d.getMonth(),1),end=new Date(d.getFullYear(),d.getMonth()+1,1);return {month:monthKey(),start:start.toISOString(),end:end.toISOString()}}

async function getClientConfirmedCount(clientId,monthOnly=true){
  let q=sb.from('workout_sessions').select('id',{count:'exact',head:true}).eq('client_id',clientId).not('client_completed_at','is',null);
  if(monthOnly){const b=currentMonthBounds();q=q.gte('client_completed_at',b.start).lt('client_completed_at',b.end)}
  const r=await q;if(r.error)throw r.error;return Number(r.count||0);
}
function clientCompletionCard(count,title='Выполнено в этом месяце'){
  return `<div class="card training-plan-card"><div class="list-row"><div><b>${esc(title)}</b><div class="small muted">Считаются только тренировки, которые ты подтвердил сам.</div></div><strong class="plan-fact-number">${count}</strong></div><div class="small muted plan-fact-caption">Тренер не может добавить тренировку в этот счётчик.</div></div>`;
}

function localDateKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function assignedStatusLabel(x){return x.status==='completed'?'✓ выполнена':x.status==='cancelled'?'отменена':'назначена'}
function assignedWorkoutCard(x){
  const day=x.day_label?` · ${esc(x.day_label)}`:'';
  return `<button class="client-btn assigned-workout-card ${x.status==='completed'?'assigned-done':''}" data-open-assigned="${x.id}"><div class="list-row"><div><b>${fmtDate(x.scheduled_date)} · ${esc(x.program_name)}</b><div class="small muted">${x.status==='completed'?'Тренировка выполнена':`Назначена тренером${day}`}</div></div><span class="pill ${x.status==='completed'?'done-pill':''}">${assignedStatusLabel(x)}</span></div></button>`;
}
async function getAssignedWorkouts(clientId,limit=20){
  const {data,error}=await sb.from('assigned_workouts').select('*').eq('client_id',clientId).neq('status','cancelled').order('scheduled_date',{ascending:true}).limit(limit);
  if(error)throw error;return data||[];
}
function bindAssignedWorkoutButtons(){document.querySelectorAll('[data-open-assigned]').forEach(b=>b.onclick=()=>openAssignedWorkout(b.dataset.openAssigned))}
async function createAssignedWorkout({clientId,programId,programName,scheduledDate,dayLabel='',scheduleEventId=null}){
  if(!scheduledDate)return toast('Выбери дату тренировки',true);
  const q=await sb.from('assigned_workouts').insert({trainer_id:user.id,client_id:clientId,program_id:programId,program_name:programName,day_label:dayLabel||null,scheduled_date:scheduledDate,status:'scheduled',schedule_event_id:scheduleEventId||null}).select('id').single();
  if(q.error)return toast(q.error.message,true);toast(`Тренировка назначена на ${fmtDate(scheduledDate)}`);return q.data;
}

async function openAssignedWorkout(assignmentId,opts={}){
  loading();
  try{
    const asTrainer=role==='trainer';
    let aq=sb.from('assigned_workouts').select('*').eq('id',assignmentId);
    aq=asTrainer?aq.eq('trainer_id',user.id):aq.eq('client_id',user.id);
    const aQ=await aq.single();
    if(aQ.error)throw aQ.error;const a=aQ.data,clientId=a.client_id;
    const back=()=>asTrainer?(opts.back==='schedule'?trainerSchedule(opts.scheduleDate||a.scheduled_date):go('clients')):go('programs');
    const isBoxingAssignment=!a.program_id&&/^Бокс/i.test(a.program_name||'');
    if(isBoxingAssignment){
      const existing=await sb.from('workout_sessions').select('id,client_completed_at').eq('client_id',clientId).eq('source_schedule_event_id',a.schedule_event_id).maybeSingle();
      if(existing.error)throw existing.error;const done=Boolean(existing.data?.client_completed_at);
      $('main').innerHTML=`<h1>${esc(a.program_name)}</h1><p class="sub">${fmtDate(a.scheduled_date)}</p><div class="card"><b>${done?'✓ Тренировка подтверждена':'Тренировка по боксу'}</b><p class="muted">${asTrainer?'Ты ведёшь оплату и статус расписания. Выполнение для статистики подтверждает только клиент.':'Упражнения для бокса заполнять не нужно. После занятия подтверди выполнение сам.'}</p>${!asTrainer&&!done?'<label class="workout-complete-check assigned-required-check"><input id="boxingClientConfirm" type="checkbox"><span><b>Тренировка выполнена</b><small>После галочки она попадёт в твою статистику выполненных тренировок.</small></span></label>':''}${done?'<span class="pill done-pill">✓ подтверждено клиентом</span>':''}</div><button id="assignedBack" class="btn ghost">Назад</button>`;
      if($('boxingClientConfirm'))$('boxingClientConfirm').onchange=async()=>{if(!$('boxingClientConfirm').checked)return;const now=new Date().toISOString();let q;if(existing.data?.id)q=await sb.from('workout_sessions').update({completed_at:now,client_completed_at:now}).eq('id',existing.data.id).eq('client_id',user.id);else q=await sb.from('workout_sessions').insert({client_id:user.id,program_id:null,performed_at:new Date(a.scheduled_date+'T12:00:00').toISOString(),completed_at:now,client_completed_at:now,source_schedule_event_id:a.schedule_event_id,session_kind:(a.program_name||'').includes('сплит')?'boxing_split':'boxing_personal',notes:`Назначение ${assignmentId}`});if(q.error){$('boxingClientConfirm').checked=false;return toast(q.error.message,true)}const u=await sb.from('assigned_workouts').update({status:'completed',completed_at:now}).eq('id',assignmentId).eq('client_id',user.id);if(u.error)return toast(u.error.message,true);toast('Бокс добавлен в статистику выполненных тренировок');back()};
      $('assignedBack').onclick=back;return;
    }
    if(!a.program_id){$('main').innerHTML=`<h1>${esc(a.program_name)}</h1><div class="empty">Программа была удалена тренером.</div><button id="assignedBack" class="btn secondary">Назад</button>`;$('assignedBack').onclick=back;return}
    let peQ=sb.from('program_exercises').select('id,exercise_id,day_label,sort_order,target_sets,target_weight,notes,exercises(name,category,equipment)').eq('program_id',a.program_id).order('sort_order');
    if(a.day_label)peQ=peQ.eq('day_label',a.day_label);
    const sessionQ=sb.from('workout_sessions').select('id,completed_at,client_completed_at,notes').eq('client_id',clientId).eq('program_id',a.program_id).eq('notes',`Назначение ${assignmentId}`).maybeSingle();
    const profileQ=asTrainer?sb.from('profiles').select('full_name').eq('id',clientId).single():Promise.resolve({data:null,error:null});
    const [pe,sessionRes,profileRes]=await Promise.all([peQ,sessionQ,profileQ]);
    if(pe.error)throw pe.error;if(sessionRes.error)throw sessionRes.error;if(profileRes.error)throw profileRes.error;
    const items=pe.data||[];let session=sessionRes.data||null,sets=[];
    if(session){const setQ=await sb.from('workout_sets').select('*').eq('session_id',session.id).order('exercise_id').order('set_number');if(setQ.error)throw setQ.error;sets=setQ.data||[]}
    const done=Boolean(session?.client_completed_at);
    const exerciseHtml=items.map((it,idx)=>{
      const old=sets.filter(x=>x.exercise_id===it.exercise_id);const oldWeight=old.length?Math.max(...old.map(x=>Number(x.weight||0))):(it.target_weight??'');const oldSets=old.length||Number(it.target_sets||1);
      return `<div class="card assigned-exercise" data-assigned-exercise data-exercise="${it.exercise_id}"><div class="list-row"><div><b>${idx+1}. ${esc(it.exercises?.name||'Упражнение')}</b><div class="small muted">Ориентир: ${Number(it.target_sets||1)} подхода${it.target_weight!=null?` · ${it.target_weight} кг`:''}</div></div><span class="pill">${esc(it.exercises?.category||'Упражнение')}</span></div>${it.notes?`<div class="small muted assigned-note">${esc(it.notes)}</div>`:''}<div class="row client-log-fields"><div class="field"><label class="label">Вес, кг</label><input class="input aw-weight" inputmode="decimal" placeholder="0" value="${oldWeight}" ${done?'disabled':''}></div><div class="field"><label class="label">Подходы</label><input class="input aw-sets" inputmode="numeric" placeholder="3" value="${oldSets}" ${done?'disabled':''}></div></div></div>`
    }).join('');
    const actorText=asTrainer?`Заполняет тренер${profileRes.data?.full_name?` · ${esc(profileRes.data.full_name)}`:''}`:'Заполняешь ты';
    const completeBlock=done?`<div class="card success-card"><b>✓ Клиент подтвердил выполнение</b><p class="small muted">Клиент подтвердил выполнение тренировки.</p></div>`:asTrainer?`<div class="card"><b>Подтверждение клиента</b><p class="small muted">Ты можешь сохранить вес и подходы, но поставить «Тренировка выполнена» может только сам клиент.</p></div>`:`<label class="workout-complete-check assigned-required-check"><input id="assignedWorkoutDone" type="checkbox"><span><b>Всё выполнил — тренировка завершена</b><small>Только после этой галочки тренировка считается выполненной тобой.</small></span></label>`;
    $('main').innerHTML=`<h1>${esc(a.program_name)}</h1><p class="sub">${actorText} · ${fmtDate(a.scheduled_date)}${a.day_label?` · ${esc(a.day_label)}`:''}</p><div class="card assignment-date-card"><div class="list-row"><div><span class="small muted">СТАТУС</span><b>${done?'Подтверждено клиентом':'Внеси вес и количество подходов'}</b></div><span class="pill ${done?'done-pill':''}">${done?'✓ выполнена':'назначена'}</span></div></div>${items.length?exerciseHtml:'<div class="empty">В этой тренировке пока нет упражнений.</div>'}${!done?`<button id="saveAssignedDraft" class="btn secondary">Сохранить значения</button>`:''}${completeBlock}<button id="assignedBack" class="btn ghost">Назад</button>`;
    const collect=()=>Array.from(document.querySelectorAll('[data-assigned-exercise]')).map(row=>({exercise_id:row.dataset.exercise,weight:n(row.querySelector('.aw-weight').value),sets:n(row.querySelector('.aw-sets').value)}));
    const save=async(complete=false)=>{
      const rows=collect();
      for(const r of rows){if(r.weight==null||!inRange(r.weight,0))return toast('Укажи вес. Для собственного веса можно поставить 0',true);if(r.sets==null||!Number.isInteger(r.sets)||r.sets<=0)return toast('Подходы должны быть целым числом больше 0',true)}
      if(complete&&asTrainer)return toast('Выполнение подтверждает только клиент',true);
      if(complete&&!items.length)return toast('В назначенной тренировке нет упражнений',true);
      if(!session){const qs=await sb.from('workout_sessions').insert({client_id:clientId,program_id:a.program_id,performed_at:new Date(a.scheduled_date+'T12:00:00').toISOString(),notes:`Назначение ${assignmentId}`}).select('id,completed_at,client_completed_at,notes').single();if(qs.error)return toast(qs.error.message,true);session=qs.data;let qu=sb.from('assigned_workouts').update({workout_session_id:session.id}).eq('id',assignmentId);qu=asTrainer?qu.eq('trainer_id',user.id):qu.eq('client_id',user.id);const qa=await qu;if(qa.error)return toast(qa.error.message,true)}
      const del=await sb.from('workout_sets').delete().eq('session_id',session.id);if(del.error)return toast(del.error.message,true);
      const insertRows=[];for(const r of rows)for(let i=1;i<=r.sets;i++)insertRows.push({session_id:session.id,exercise_id:r.exercise_id,set_number:i,weight:r.weight,reps:null,rpe:null,notes:null});
      if(insertRows.length){const ins=await sb.from('workout_sets').insert(insertRows);if(ins.error)return toast(ins.error.message,true)}
      if(complete){const now=new Date().toISOString();const q1=await sb.from('workout_sessions').update({completed_at:now,client_completed_at:now}).eq('id',session.id).eq('client_id',user.id);if(q1.error)return toast(q1.error.message,true);const q2=await sb.from('assigned_workouts').update({status:'completed',completed_at:now,workout_session_id:session.id}).eq('id',assignmentId).eq('client_id',user.id);if(q2.error)return toast(q2.error.message,true);toast('Тренировка завершена');return back()}
      toast(asTrainer?'Вес и подходы сохранены. Клиент подтвердит выполнение сам.':'Вес и подходы сохранены');
    };
    if($('saveAssignedDraft'))$('saveAssignedDraft').onclick=()=>save(false);
    if($('assignedWorkoutDone'))$('assignedWorkoutDone').onchange=async()=>{if(!$('assignedWorkoutDone').checked)return;await save(true)};
    $('assignedBack').onclick=back;
  }catch(e){console.error(e);$('main').innerHTML=card('Ошибка',`<p class="muted">${esc(e.message||e)}</p><button id="assignedBack" class="btn secondary">Назад</button>`);if($('assignedBack'))$('assignedBack').onclick=()=>role==='trainer'?go('schedule'):go('programs')}
}

async function openScheduleClientWorkout(eventId,clientId){
  loading();
  try{
    const eQ=await sb.from('schedule_events').select('*').eq('id',eventId).eq('trainer_id',user.id).single();if(eQ.error)throw eQ.error;const ev=eQ.data;
    const date=localDateKey(new Date(ev.starts_at));
    if(isBoxingTraining(ev.training_type)){
      const pQ=await sb.from('profiles').select('full_name').eq('id',clientId).single();if(pQ.error)throw pQ.error;
      $('main').innerHTML=`<h1>${esc(pQ.data.full_name||'Клиент')}</h1><p class="sub">${fmtDate(date)} · ${trainingTypeLabel(ev.training_type)}</p><div class="card"><b>Тренировка по боксу</b><p class="muted">Упражнения не нужны. Оплату и статус записи ты ведёшь в расписании, а выполнение клиент подтверждает сам в своём кабинете.</p><span class="pill">${statusLabel(ev.status)}</span></div><button id="scheduleClientBack" class="btn ghost">Назад в расписание</button>`;
      $('scheduleClientBack').onclick=()=>trainerSchedule(date);return;
    }
    let aQ=await sb.from('assigned_workouts').select('*').eq('trainer_id',user.id).eq('client_id',clientId).eq('schedule_event_id',eventId).neq('status','cancelled').order('created_at',{ascending:false}).limit(1);
    if(aQ.error)throw aQ.error;
    if(!aQ.data?.length){aQ=await sb.from('assigned_workouts').select('*').eq('trainer_id',user.id).eq('client_id',clientId).eq('scheduled_date',date).is('schedule_event_id',null).neq('status','cancelled').order('created_at',{ascending:false}).limit(1);if(aQ.error)throw aQ.error}
    if(aQ.data?.length){const a=aQ.data[0];if(!a.schedule_event_id){const u=await sb.from('assigned_workouts').update({schedule_event_id:eventId}).eq('id',a.id).eq('trainer_id',user.id);if(u.error)throw u.error}return openAssignedWorkout(a.id,{back:'schedule',scheduleDate:date})}
    const [pQ,profQ]=await Promise.all([sb.from('training_programs').select('id,name,description,program_exercises(day_label)').eq('trainer_id',user.id).eq('client_id',clientId).eq('active',true).order('created_at',{ascending:false}),sb.from('profiles').select('full_name').eq('id',clientId).single()]);
    if(pQ.error)throw pQ.error;if(profQ.error)throw profQ.error;const programs=pQ.data||[];
    if(!programs.length){$('main').innerHTML=`<h1>${esc(profQ.data.full_name||'Клиент')}</h1><p class="sub">${fmtDate(date)} · ${trainingTypeLabel(ev.training_type)}</p><div class="empty">У клиента пока нет активной программы. Сначала назначь программу или шаблон.</div><button id="scheduleClientBack" class="btn secondary">Назад в расписание</button>`;$('scheduleClientBack').onclick=()=>trainerSchedule(date);return}
    $('main').innerHTML=`<h1>${esc(profQ.data.full_name||'Клиент')}</h1><p class="sub">${fmtDate(date)} · тренировка из расписания</p><div class="card"><b>Выбери программу</b><div class="field"><label class="label">Программа</label><select id="scheduleProgramPick" class="input">${programs.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div><div class="field"><label class="label">Тренировка / день</label><select id="scheduleProgramDayPick" class="input"></select></div><button id="scheduleOpenProgram" class="btn primary">Открыть и вносить результаты</button></div><button id="scheduleClientBack" class="btn ghost">Назад в расписание</button>`;
    const sync=()=>{const p=programs.find(x=>x.id===$('scheduleProgramPick').value);const days=[...new Set((p?.program_exercises||[]).map(x=>x.day_label||'Тренировка'))];$('scheduleProgramDayPick').innerHTML=(days.length?days:['Тренировка']).map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join('')};$('scheduleProgramPick').onchange=sync;sync();
    $('scheduleOpenProgram').onclick=async()=>{const p=programs.find(x=>x.id===$('scheduleProgramPick').value);if(!p)return toast('Выбери программу',true);const created=await createAssignedWorkout({clientId,programId:p.id,programName:p.name,scheduledDate:date,dayLabel:$('scheduleProgramDayPick').value,scheduleEventId:eventId});if(created?.id)return openAssignedWorkout(created.id,{back:'schedule',scheduleDate:date})};
    $('scheduleClientBack').onclick=()=>trainerSchedule(date);
  }catch(e){console.error(e);$('main').innerHTML=card('Ошибка',`<p class="muted">${esc(e.message||e)}</p><button id="scheduleClientBack" class="btn secondary">Назад</button>`);if($('scheduleClientBack'))$('scheduleClientBack').onclick=()=>go('schedule')}
}


async function clientStrengthAverageDelta(clientId){
  const sQ=await sb.from('workout_sessions').select('id,client_completed_at').eq('client_id',clientId).not('client_completed_at','is',null).order('client_completed_at',{ascending:true}).limit(200);
  if(sQ.error)throw sQ.error;const sessions=sQ.data||[];if(sessions.length<2)return null;
  const order=new Map(sessions.map((s,i)=>[s.id,i])),ids=sessions.map(x=>x.id);
  const q=await sb.from('workout_sets').select('session_id,exercise_id,weight').in('session_id',ids).not('weight','is',null);if(q.error)throw q.error;
  const byExercise=new Map();
  for(const row of q.data||[]){const w=Number(row.weight);if(!Number.isFinite(w)||w<=0)continue;const k=row.exercise_id;if(!byExercise.has(k))byExercise.set(k,new Map());const bySession=byExercise.get(k);if(!bySession.has(row.session_id))bySession.set(row.session_id,[]);bySession.get(row.session_id).push(w)}
  const diffs=[];
  for(const bySession of byExercise.values()){
    const rows=[...bySession.entries()].map(([sid,ws])=>({i:order.get(sid),avg:ws.reduce((a,b)=>a+b,0)/ws.length})).filter(x=>Number.isFinite(x.i)).sort((a,b)=>a.i-b.i);
    if(rows.length>=2)diffs.push(rows.at(-1).avg-rows[0].avg);
  }
  if(!diffs.length)return null;return diffs.reduce((a,b)=>a+b,0)/diffs.length;
}
function signedKg(v){if(v==null||!Number.isFinite(Number(v)))return '—';const x=Math.round(Number(v)*10)/10;return `${x>0?'+':''}${x.toLocaleString('ru-RU')} кг`}
async function clientHome(){
  if(demo){$('main').innerHTML=`<h1>Привет, Анна</h1><p class="sub">Твой прогресс в двух цифрах.</p><div class="grid2"><div class="metric progress-tile"><span>Силовые</span><strong class="lime">+6,4 кг</strong><small>средний прогресс</small></div><div class="metric progress-tile"><span>Снижение веса</span><strong>-3,8 кг</strong><small>от первого замера</small></div></div>`;return}
  const [m,p,pack,assignedQ,strengthDelta]=await Promise.all([
    sb.from('body_measurements').select('weight,waist,glutes,measured_at').eq('client_id',user.id).order('measured_at',{ascending:true}).limit(100),
    sb.from('training_programs').select('*').eq('client_id',user.id).eq('active',true).order('created_at',{ascending:false}).limit(1),
    sb.from('client_packages').select('*').eq('client_id',user.id).neq('status','archived').order('created_at',{ascending:false}),
    sb.from('assigned_workouts').select('*').eq('client_id',user.id).eq('status','scheduled').gte('scheduled_date',localDateKey()).order('scheduled_date',{ascending:true}).limit(5),
    clientStrengthAverageDelta(user.id)
  ]);
  for(const q of [m,p,pack,assignedQ])if(q.error)throw q.error;
  const ms=m.data||[],firstWeight=ms.find(x=>x.weight!=null)?.weight,lastWeight=[...ms].reverse().find(x=>x.weight!=null)?.weight;
  const weightChange=firstWeight!=null&&lastWeight!=null?Number(lastWeight)-Number(firstWeight):null;
  const activePacks=(pack.data||[]).filter(x=>x.status==='active'&&packageRemaining(x)>0);
  const sum=t=>activePacks.filter(x=>x.training_type===t).reduce((a,x)=>a+packageRemaining(x),0);
  const packBreakdown=activePacks.length?activePacks.map(x=>`<div class="client-balance-line"><span>${esc(x.package_name)}</span><b>${packageRemaining(x)}</b></div>`).join(''):'<div class="small muted">Активных оплаченных тренировок пока нет.</div>';
  $('main').innerHTML=`<h1>${profile?.full_name?'Привет, '+esc(profile.full_name.split(' ')[0]):'Твой прогресс'}</h1><p class="sub">Самое важное — без лишнего.</p><div class="grid2 client-progress-summary"><div class="metric progress-tile"><span>Силовые</span><strong class="lime">${signedKg(strengthDelta)}</strong><small>среднее изменение рабочих весов</small></div><div class="metric progress-tile"><span>Снижение веса</span><strong>${weightChange==null?'—':signedKg(weightChange)}</strong><small>от первого замера</small></div></div>${assignedQ.data?.length?`<div class="section-title">Ближайшие тренировки</div>${assignedQ.data.map(assignedWorkoutCard).join('')}`:''}<div class="section-title">Остаток тренировок</div><div class="card client-balance-card"><div class="grid2"><div class="metric balance-metric"><span>Персональные</span><strong>${sum('personal')}</strong><small>осталось</small></div><div class="metric balance-metric"><span>Сплит</span><strong>${sum('split')}</strong><small>осталось</small></div><div class="metric balance-metric"><span>Бокс · ПТ</span><strong>${sum('boxing_personal')}</strong><small>осталось</small></div><div class="metric balance-metric"><span>Бокс · сплит</span><strong>${sum('boxing_split')}</strong><small>осталось</small></div></div><div class="client-balance-details">${packBreakdown}</div></div><div class="section-title">Мои программы</div>${p.data?.length?card(p.data[0].name,`<p class="muted">${esc(p.data[0].description||'Назначено тренером')}</p><button id="openProgram" class="btn primary">Открыть программы</button>`):'<div class="empty">Тренер ещё не назначил программу.</div>'}`;
  if($('openProgram'))$('openProgram').onclick=()=>go('programs');bindAssignedWorkoutButtons();
}

async function clientLibrary(){
  const ex=await listExercises();
  if(demo){
    $('main').innerHTML=`<h1>Видеотека</h1><p class="sub">Техника выполнения от тренера.</p>${['Приседания','Жим лёжа','Тяга верхнего блока'].map(x=>card(x,'<p class="muted">Видео и подсказки по технике</p><div class="photo" style="display:grid;place-items:center;font-size:50px">▶</div>')).join('')}<button id="backLibrary" class="btn secondary">Назад</button>`;
    $('backLibrary').onclick=()=>go('home');
    return;
  }
  $('main').innerHTML=`<h1>Видеотека</h1><p class="sub">Видео и подсказки только от твоего тренера.</p>${ex.length?ex.map(x=>`<div class="card"><div class="list-row"><div class="truncate"><b>${esc(x.name)}</b><div class="small muted">${esc(x.muscle_group||'')}</div></div>${x.video_path?'<span class="pill">Видео</span>':''}</div>${x.technique_tips?`<p class="small muted">${esc(x.technique_tips)}</p>`:''}${x.video_path?`<button class="btn secondary" data-client-video="${esc(x.video_path)}">Смотреть технику</button>`:'<div class="small muted">Видео пока не загружено.</div>'}</div>`).join(''):'<div class="empty">Тренер ещё не добавил упражнения или не привязал твой аккаунт.</div>'}<button id="backLibrary" class="btn secondary">Назад</button>`;
  document.querySelectorAll('[data-client-video]').forEach(b=>b.onclick=()=>openSignedVideo(b.dataset.clientVideo));
  $('backLibrary').onclick=()=>go('home');
}


async function openSignedVideo(path){
  if(!path)return toast('Видео ещё не загружено',true);
  const {data,error}=await sb.storage.from('exercise-videos').createSignedUrl(path,3600);
  if(error||!data?.signedUrl)return toast(error?.message||'Не удалось открыть видео',true);
  const overlay=document.createElement('div');
  overlay.className='video-modal';
  const box=document.createElement('div');box.className='video-modal-box';
  const close=document.createElement('button');close.className='video-close';close.type='button';close.textContent='×';
  const video=document.createElement('video');video.controls=true;video.playsInline=true;video.preload='metadata';video.src=data.signedUrl;
  close.onclick=()=>{video.pause();overlay.remove()};overlay.onclick=e=>{if(e.target===overlay)close.onclick()};
  box.append(close,video);overlay.append(box);document.body.append(overlay);video.play().catch(()=>{});
}

async function loadClientProgram(programId){
  const target=$('programDetail');if(!target)return;
  target.innerHTML='<div class="spinner"></div>';
  const dayStart=new Date();dayStart.setHours(0,0,0,0);const dayEnd=new Date(dayStart);dayEnd.setDate(dayEnd.getDate()+1);
  const [itemsQ,doneQ]=await Promise.all([
    sb.from('program_exercises').select('id,day_label,sort_order,target_sets,target_reps,target_weight,target_rpe,notes,exercises(name,muscle_group,technique_tips,video_path,category,equipment)').eq('program_id',programId).order('sort_order'),
    sb.from('workout_sessions').select('id,completed_at').eq('client_id',user.id).eq('program_id',programId).not('completed_at','is',null).gte('completed_at',dayStart.toISOString()).lt('completed_at',dayEnd.toISOString()).order('completed_at',{ascending:false}).limit(1)
  ]);
  if(itemsQ.error){target.innerHTML=`<div class="empty">${esc(itemsQ.error.message)}</div>`;return}if(doneQ.error){target.innerHTML=`<div class="empty">${esc(doneQ.error.message)}</div>`;return}
  const items=itemsQ.data||[],done=doneQ.data?.[0]||null;
  const html=items.map(i=>{
    const ex=i.exercises||{};
    const weight=i.target_weight!=null?`<div class="small muted">Ориентир: ${i.target_weight} кг${i.target_rpe!=null?' · RPE '+i.target_rpe:''}</div>`:'';
    const notes=i.notes?`<div class="small">${esc(i.notes)}</div>`:'';
    const tips=ex.technique_tips?`<div class="small muted">${esc(ex.technique_tips)}</div>`:'';
    const video=ex.video_path?`<button class="btn secondary" data-program-video="${esc(ex.video_path)}">Смотреть технику</button>`:'';
    const badge=`<span class="pill">${esc(ex.category||'Упражнение')}</span>`;
    return `<div class="card"><div class="list-row"><div><b>${esc(ex.name||'Упражнение')}</b><div class="small muted">${esc(i.day_label||'Тренировка')} · ${i.target_sets||'—'} × ${esc(i.target_reps||'—')}</div></div>${badge}</div>${weight}${notes}${tips}${ex.equipment?`<div class="small muted">${esc(ex.equipment)}</div>`:''}${video}</div>`;
  }).join('');
  target.innerHTML=`<div class="section-title">Упражнения</div>${items.length?html:'<div class="empty">В программе пока нет упражнений.</div>'}<div class="section-title">Отметка тренировки</div><label class="workout-complete-check ${done?'is-done':''}"><input id="programWorkoutDone" type="checkbox" ${done?'checked':''}><span><b>${done?'Тренировка завершена':'Отметить: тренировка завершена'}</b><small>${done?'Учтена в план‑факте за этот месяц.':'Поставь галочку только после окончания тренировки.'}</small></span></label>`;
  document.querySelectorAll('[data-program-video]').forEach(b=>b.onclick=()=>openSignedVideo(b.dataset.programVideo));
  $('programWorkoutDone').onchange=async()=>{
    const checked=$('programWorkoutDone').checked;
    if(checked){
      const now=new Date().toISOString();
      let q;
      if(currentWorkoutId)q=await sb.from('workout_sessions').update({program_id:programId,completed_at:now,client_completed_at:now}).eq('id',currentWorkoutId).eq('client_id',user.id);
      else q=await sb.from('workout_sessions').insert({client_id:user.id,program_id:programId,performed_at:now,completed_at:now,client_completed_at:now,notes:'Тренировка по программе завершена'});
      if(q.error){$('programWorkoutDone').checked=false;return toast(q.error.message,true)}currentWorkoutId=null;toast('Тренировка завершена');
    }else if(done){
      const q=await sb.from('workout_sessions').update({completed_at:null,client_completed_at:null}).eq('id',done.id).eq('client_id',user.id);if(q.error){$('programWorkoutDone').checked=true;return toast(q.error.message,true)}toast('Отметка тренировки снята');
    }
    await clientHome();
  };
}

async function listExercises(){if(demo)return [{id:'e1',name:'Приседания',muscle_group:'Ноги / ягодицы',category:'Свободные веса'},{id:'e2',name:'Жим лёжа',muscle_group:'Грудь',category:'Свободные веса'},{id:'e3',name:'Тяга блока',muscle_group:'Спина',category:'Блоки / кроссовер'}];const {data,error}=await sb.from('exercises').select('*').eq('archived',false).order('category').order('name');if(error)throw error;return data||[]}
function programSourceLabel(p){return p.source_kind==='template'?'Шаблон тренера':'Программа тренера'}
function personalCoachingNotice(){return `<div class="card"><b>Персональное ведение</b><p class="muted">Программу, рабочие веса и подходы ведёт тренер. В твоём кабинете остаются прогресс, питание и профиль.</p></div>`}
async function clientProgramsPage(){
  if(coachingMode!=='mixed'){ $('main').innerHTML=`<h1>Мои программы</h1>${personalCoachingNotice()}`;return }
  if(demo){$('main').innerHTML=`<h1>Мои программы</h1><p class="sub">Здесь появляются программы и шаблоны от тренера.</p>${card('Ягодицы · День A','<button class="btn primary">Добавить в тренировку</button>')}`;return}
  const [programsQ,assignedQ]=await Promise.all([
    sb.from('training_programs').select('id,name,description,active,source_kind,created_at,program_exercises(id,exercise_id,day_label,sort_order,target_sets,target_weight,notes,exercises(name,category,equipment,technique_tips,video_path))').eq('client_id',user.id).eq('active',true).order('created_at',{ascending:false}),
    sb.from('assigned_workouts').select('*').eq('client_id',user.id).neq('status','cancelled').order('scheduled_date',{ascending:false}).limit(30)
  ]);
  if(programsQ.error)throw programsQ.error;if(assignedQ.error)throw assignedQ.error;
  const programs=programsQ.data||[],pending=(assignedQ.data||[]).filter(x=>x.status==='scheduled').sort((a,b)=>a.scheduled_date.localeCompare(b.scheduled_date));
  const cards=programs.map(p=>{const items=(p.program_exercises||[]).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));const days=[...new Set(items.map(x=>x.day_label||'Тренировка'))];return `<div class="card client-program-card"><div class="list-row"><div><b>${esc(p.name)}</b><div class="small muted">${esc(programSourceLabel(p))}${p.description?` · ${esc(p.description)}`:''}</div></div><span class="pill">${items.length} упр.</span></div><div class="client-program-days">${days.map(d=>`<button class="btn secondary" data-start-client-program="${p.id}|${esc(d)}">${esc(d)} · добавить в тренировку</button>`).join('')}</div><button class="btn ghost" data-view-client-program="${p.id}">Посмотреть программу</button></div>`}).join('');
  $('main').innerHTML=`<h1>Мои программы</h1><p class="sub">Назначенные тренером программы. Вес и количество подходов фиксируешь ты.</p>${pending.length?`<div class="section-title">Назначено на дату</div>${pending.map(assignedWorkoutCard).join('')}`:''}<div class="section-title">Программы</div>${cards||'<div class="empty">Тренер ещё не назначил программу.</div>'}<div id="clientProgramDetail"></div>`;
  bindAssignedWorkoutButtons();document.querySelectorAll('[data-view-client-program]').forEach(b=>b.onclick=()=>showClientProgramDetail(b.dataset.viewClientProgram));document.querySelectorAll('[data-start-client-program]').forEach(b=>b.onclick=()=>{const [pid,day]=b.dataset.startClientProgram.split('|');openClientProgramWorkout(pid,day)});
}

async function showClientProgramDetail(programId){
  const target=$('clientProgramDetail');if(!target)return;const q=await sb.from('training_programs').select('id,name,description,source_kind,program_exercises(id,day_label,sort_order,target_sets,target_weight,notes,exercises(name,category,equipment,technique_tips))').eq('id',programId).eq('client_id',user.id).single();if(q.error)return toast(q.error.message,true);const p=q.data,items=(p.program_exercises||[]).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
  target.innerHTML=`<div class="section-title">${esc(p.name)}</div>${items.map(i=>`<div class="card"><div class="list-row"><div><b>${esc(i.exercises?.name||'Упражнение')}</b><div class="small muted">${esc(i.day_label||'Тренировка')} · ${i.target_sets||'—'} подхода${i.target_weight!=null?` · ориентир ${i.target_weight} кг`:''}</div></div><span class="pill">${esc(i.exercises?.category||'')}</span></div>${i.notes?`<p class="small muted">${esc(i.notes)}</p>`:''}</div>`).join('')||'<div class="empty">Упражнений пока нет.</div>'}`;target.scrollIntoView({behavior:'smooth',block:'start'});
}
async function openClientProgramWorkout(programId,dayLabel){
  if(coachingMode!=='mixed')return go('home');
  loading();
  try{
    const q=await sb.from('training_programs').select('id,name,program_exercises(id,exercise_id,day_label,sort_order,target_sets,target_weight,notes,exercises(name,category))').eq('id',programId).eq('client_id',user.id).single();if(q.error)throw q.error;const p=q.data;let items=(p.program_exercises||[]).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));if(dayLabel)items=items.filter(x=>(x.day_label||'Тренировка')===dayLabel);
    $('main').innerHTML=`<h1>${esc(p.name)}</h1><p class="sub">${esc(dayLabel||'Тренировка')} · внеси рабочий вес и фактическое количество подходов.</p>${items.map((it,idx)=>`<div class="card client-log-exercise" data-program-log data-exercise="${it.exercise_id}"><div class="list-row"><div><b>${idx+1}. ${esc(it.exercises?.name||'Упражнение')}</b><div class="small muted">План: ${it.target_sets||'—'} подхода${it.target_weight!=null?` · ${it.target_weight} кг`:''}</div></div><span class="pill">${esc(it.exercises?.category||'')}</span></div><div class="row client-log-fields"><div class="field"><label class="label">Вес, кг</label><input class="input cp-weight" inputmode="decimal" value="${it.target_weight??''}" placeholder="0"></div><div class="field"><label class="label">Подходы</label><input class="input cp-sets" inputmode="numeric" value="${it.target_sets||3}" placeholder="3"></div></div></div>`).join('')||'<div class="empty">В этой тренировке пока нет упражнений.</div>'}<button id="saveProgramWorkoutDraft" class="btn secondary">Сохранить значения</button><label class="workout-complete-check assigned-required-check"><input id="completeProgramWorkout" type="checkbox"><span><b>Всё выполнил — тренировка завершена</b><small>После галочки значения попадут в дневник и аналитику.</small></span></label><button id="backToPrograms" class="btn ghost">Назад в мои программы</button>`;
    let sessionId=null;
    const save=async(complete)=>{const rows=Array.from(document.querySelectorAll('[data-program-log]')).map(el=>({exercise_id:el.dataset.exercise,weight:n(el.querySelector('.cp-weight').value),sets:n(el.querySelector('.cp-sets').value)}));for(const r of rows){if(r.weight==null||!inRange(r.weight,0))return toast('Укажи вес. Для собственного веса можно поставить 0',true);if(r.sets==null||!Number.isInteger(r.sets)||r.sets<=0)return toast('Подходы должны быть целым числом больше 0',true)}if(!rows.length)return toast('В программе нет упражнений',true);if(!sessionId){const c=await sb.from('workout_sessions').insert({client_id:user.id,program_id:programId,performed_at:new Date().toISOString(),notes:`Самостоятельно · ${dayLabel||'Тренировка'}`}).select('id').single();if(c.error)return toast(c.error.message,true);sessionId=c.data.id}else{const d=await sb.from('workout_sets').delete().eq('session_id',sessionId);if(d.error)return toast(d.error.message,true)}const ins=[];for(const r of rows)for(let i=1;i<=r.sets;i++)ins.push({session_id:sessionId,exercise_id:r.exercise_id,set_number:i,weight:r.weight,reps:null,rpe:null});const iq=await sb.from('workout_sets').insert(ins);if(iq.error)return toast(iq.error.message,true);if(complete){const now=new Date().toISOString();const cq=await sb.from('workout_sessions').update({completed_at:now,client_completed_at:now}).eq('id',sessionId).eq('client_id',user.id);if(cq.error)return toast(cq.error.message,true);toast('Тренировка завершена');return clientProgramsPage()}toast('Вес и подходы сохранены')};
    $('saveProgramWorkoutDraft').onclick=()=>save(false);$('completeProgramWorkout').onchange=()=>{$('completeProgramWorkout').checked&&save(true)};$('backToPrograms').onclick=clientProgramsPage;
  }catch(e){console.error(e);$('main').innerHTML=card('Ошибка',`<p class="muted">${esc(e.message||e)}</p><button id="backToPrograms" class="btn secondary">Назад</button>`);if($('backToPrograms'))$('backToPrograms').onclick=clientProgramsPage}
}

function measurementMonthLabel(v){if(!v)return '—';return new Date(v.length===10?v+'T12:00:00':v).toLocaleDateString('ru-RU',{month:'long',year:'numeric'})}
function measurementValue(v,unit=' см'){return v==null?'—':`${Number(v)}${unit}`}
function measurementHistory(ms,sex){if(!ms.length)return '<div class="empty">Замеров пока нет. Добавь исходные данные.</div>';return `<div class="measurement-history">${ms.slice().reverse().map(x=>`<div class="measurement-history-row"><div class="list-row"><b>${esc(measurementMonthLabel(x.measured_at))}</b><span class="pill">${fmtDate(x.measured_at)}</span></div><div class="measurement-mini-grid simple-measure-grid"><span>Вес <b>${measurementValue(x.weight,' кг')}</b></span><span>Талия <b>${measurementValue(x.waist)}</b></span>${sex==='female'?`<span>Ягодицы <b>${measurementValue(x.glutes)}</b></span>`:''}</div></div>`).join('')}</div>`}
function monthBoundsForDate(dateValue){const d=new Date(`${dateValue}T12:00:00`);const y=d.getFullYear(),m=d.getMonth();const start=`${y}-${String(m+1).padStart(2,'0')}-01`;const next=new Date(y,m+1,1);const nextKey=`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-01`;return {start,next:nextKey}}

function currentMonthHasMeasurement(ms){const now=new Date(),y=now.getFullYear(),m=now.getMonth();return ms.some(x=>{const d=new Date(`${x.measured_at}T12:00:00`);return d.getFullYear()===y&&d.getMonth()===m})}
function urlBase64ToUint8Array(base64String){const padding='='.repeat((4-base64String.length%4)%4);const base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');const raw=atob(base64);return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))}
async function measurementPushEnabled(){if(demo||!user)return false;const q=await sb.from('push_subscriptions').select('id').eq('user_id',user.id).eq('enabled',true).limit(1);if(q.error)return false;return Boolean(q.data?.length)}
async function enableMeasurementPush(){
  if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))return toast('Push-уведомления не поддерживаются на этом устройстве',true);
  const isiOS=/iPhone|iPad|iPod/i.test(navigator.userAgent);const standalone=window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true;
  if(isiOS&&!standalone)return toast('На iPhone сначала добавь DenisFit на экран «Домой», затем открой приложение оттуда',true);
  const permission=await Notification.requestPermission();if(permission!=='granted')return toast('Разрешение на уведомления не выдано',true);
  const reg=await navigator.serviceWorker.ready;
  let sub=await reg.pushManager.getSubscription();
  if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY)});
  const j=sub.toJSON();const q=await sb.from('push_subscriptions').upsert({user_id:user.id,endpoint:j.endpoint,p256dh:j.keys?.p256dh||'',auth_key:j.keys?.auth||'',enabled:true,updated_at:new Date().toISOString()},{onConflict:'endpoint'});
  if(q.error)return toast(q.error.message,true);toast('Ежемесячные напоминания включены');progressPage();
}
function measurementReminderCard(hasThisMonth,pushEnabled){return `<div class="card measurement-reminder ${hasThisMonth?'is-complete':''}"><div class="list-row"><div><b>${hasThisMonth?'Замеры этого месяца готовы':'Пора обновить замеры'}</b><div class="small muted">${hasThisMonth?'Следующее напоминание появится в новом месяце.':'Зафиксируй вес и объёмы один раз в месяц — так динамика будет видна без догадок.'}</div></div><span class="pill">${hasThisMonth?'✓':'1×/мес'}</span></div>${pushEnabled?'<div class="push-enabled">✓ Push-напоминания включены</div>':'<button id="enableMeasurePush" class="btn secondary">Включить ежемесячное push-напоминание</button>'}</div>`}

async function progressPage(){
  const sex=profile?.sex||'';
  if(demo){$('main').innerHTML=`<h1>Прогресс</h1>${measurementForm('female')}<div class="grid2"><div class="card"><b>Вес</b>${lineChart([71.4,69.2,67.6],'Вес',' кг')}</div><div class="card"><b>Талия</b>${lineChart([78,75.5,73],'Талия',' см')}</div></div>`;bindMeasurement(true);return}
  const [m,pushOn]=await Promise.all([sb.from('body_measurements').select('id,measured_at,weight,waist,glutes').eq('client_id',user.id).order('measured_at',{ascending:true}).limit(100),measurementPushEnabled()]);
  if(m.error)throw m.error;const ms=m.data||[],hasMonth=currentMonthHasMeasurement(ms);
  const sexNotice=!sex?'<div class="card"><b>Укажи пол в профиле</b><p class="small muted">Он нужен, чтобы правильно показывать поля замеров.</p><button id="goProfileSex" class="btn secondary">Открыть профиль</button></div>':'';
  $('main').innerHTML=`<h1>Прогресс</h1><p class="sub">Только основные замеры раз в месяц.</p>${sexNotice}${measurementReminderCard(hasMonth,pushOn)}${measurementForm(sex)}<div class="section-title">Динамика</div><div class="grid2"><div class="card"><b>Вес</b>${lineChart(ms.filter(x=>x.weight!=null).map(x=>x.weight),'Вес',' кг')}</div><div class="card"><b>Талия</b>${lineChart(ms.filter(x=>x.waist!=null).map(x=>x.waist),'Талия',' см')}</div></div>${sex==='female'?`<div class="card"><b>Ягодицы</b>${lineChart(ms.filter(x=>x.glutes!=null).map(x=>x.glutes),'Ягодицы',' см')}</div>`:''}<div class="section-title">История по месяцам</div><div class="card">${measurementHistory(ms,sex)}</div><div class="card"><b>Фото прогресса</b><div class="field"><input id="progressFile" class="input" type="file" accept="image/*" capture="environment"></div><select id="viewType" class="input"><option value="front">Спереди</option><option value="side">Сбоку</option><option value="back">Сзади</option><option value="other">Другое</option></select><button id="uploadProgress" class="btn primary">Загрузить фото</button><div id="progressPhotos"></div></div>`;
  bindMeasurement(false);if($('enableMeasurePush'))$('enableMeasurePush').onclick=enableMeasurementPush;if($('goProfileSex'))$('goProfileSex').onclick=()=>go('profile');$('uploadProgress').onclick=uploadProgress;await loadProgressPhotos();
}
function measurementForm(sex=profile?.sex||''){const today=new Date().toISOString().slice(0,10);return `<div class="card measurement-form"><div class="list-row"><div><b>Добавить замеры</b><div class="small muted">Первый замер — исходный. Дальше обновляй раз в месяц.</div></div><span class="pill">ежемесячно</span></div><div class="field"><label class="label">Дата</label><input id="mDate" class="input" type="date" value="${today}"></div><div class="row"><div class="field"><label class="label">Вес, кг</label><input id="mWeight" class="input" inputmode="decimal" placeholder="67.5"></div><div class="field"><label class="label">Талия, см</label><input id="mWaist" class="input" inputmode="decimal" placeholder="72"></div></div>${sex==='female'?`<div class="field"><label class="label">Ягодицы, см</label><input id="mGlutes" class="input" inputmode="decimal" placeholder="98"></div>`:''}<button id="saveMeasurement" class="btn primary">Сохранить замеры месяца</button></div>`}
function bindMeasurement(isDemo){$('saveMeasurement').onclick=async()=>{const measuredAt=$('mDate').value||new Date().toISOString().slice(0,10),weight=n($('mWeight').value),waist=n($('mWaist').value),glutes=$('mGlutes')?n($('mGlutes').value):null;const vals={weight,waist,glutes};if(!Object.values(vals).some(v=>v!=null))return toast('Заполни хотя бы один замер',true);if(Object.values(vals).some(v=>v!=null&&!inRange(v,0.01)))return toast('Замеры должны быть больше 0',true);if(isDemo){toast('Замеры сохранены в демо');return progressPage()}const b=monthBoundsForDate(measuredAt);const existing=await sb.from('body_measurements').select('id').eq('client_id',user.id).gte('measured_at',b.start).lt('measured_at',b.next).order('measured_at',{ascending:false}).limit(1);if(existing.error)return toast(existing.error.message,true);let q;if(existing.data?.length)q=await sb.from('body_measurements').update({measured_at:measuredAt,...vals,arm_left:null,arm_right:null,thigh_left:null,thigh_right:null}).eq('id',existing.data[0].id).eq('client_id',user.id);else q=await sb.from('body_measurements').insert({client_id:user.id,measured_at:measuredAt,...vals});if(q.error)return toast(q.error.message,true);toast(existing.data?.length?'Замеры месяца обновлены':'Замеры месяца сохранены');progressPage()}}

async function uploadProgress(){const f=$('progressFile').files[0];if(!f)return toast('Выбери фото',true);const ext=(f.name.split('.').pop()||'jpg').toLowerCase(),path=`${user.id}/${uuid()}.${ext}`;const u=await sb.storage.from('progress-photos').upload(path,f,{contentType:f.type||'image/jpeg'});if(u.error)return toast(u.error.message,true);const q=await sb.from('progress_photos').insert({client_id:user.id,photo_path:path,view_type:$('viewType').value});if(q.error){await sb.storage.from('progress-photos').remove([path]);return toast(q.error.message,true)}toast('Фото добавлено');loadProgressPhotos()}
async function loadProgressPhotos(){if(!$('progressPhotos'))return;const {data,error}=await sb.from('progress_photos').select('*').eq('client_id',user.id).order('taken_at',{ascending:false}).limit(8);if(error)throw error;let html='<div class="photo-grid">';for(const x of data||[]){const s=await sb.storage.from('progress-photos').createSignedUrl(x.photo_path,3600);if(s.data?.signedUrl)html+=`<div class="photo-card"><img class="photo" src="${s.data.signedUrl}"><div class="small muted">${fmtDate(x.taken_at)} · ${esc(x.view_type||'')}</div></div>`}html+='</div>';$('progressPhotos').innerHTML=html}

async function getClientNutritionTarget(clientId=user.id){
  const q=await sb.from('client_nutrition_targets').select('*').eq('client_id',clientId).order('updated_at',{ascending:false}).limit(1).maybeSingle();
  if(q.error)throw q.error;return q.data||null;
}
function nutritionTargetCard(t){
  if(!t)return `<div class="card"><b>План питания</b><p class="muted">Тренер пока не задал БЖУ и воду.</p></div>`;
  return `<div class="card nutrition-target-card"><div class="list-row"><div><b>Твой план питания</b><div class="small muted">Ориентиры на день</div></div><span class="pill">от тренера</span></div><div class="nutrition-macro-grid"><span>Белки <b>${Number(t.protein_g||0)} г</b></span><span>Жиры <b>${Number(t.fat_g||0)} г</b></span><span>Углеводы <b>${Number(t.carbs_g||0)} г</b></span><span>Вода <b>${Number(t.water_l||0)} л</b></span></div>${t.supplements_text?`<div class="profile-note"><span class="small muted">РЕКОМЕНДУЕМЫЕ БАДЫ</span><p>${esc(t.supplements_text)}</p></div>`:''}</div>`;
}
function mealAiBlock(x){
  if(x.ai_score!=null)return `<div class="meal-ai"><div class="list-row"><b>Оценка блюда относительно твоего плана</b><strong class="lime">${x.ai_score}/10</strong></div><div class="small muted">Оценочно: Б ${Number(x.ai_estimated_protein||0)} г · Ж ${Number(x.ai_estimated_fat||0)} г · У ${Number(x.ai_estimated_carbs||0)} г</div>${x.ai_feedback?`<p>${esc(x.ai_feedback)}</p>`:''}${x.ai_positives?`<div class="small"><b>Хорошо:</b> ${esc(x.ai_positives)}</div>`:''}${x.ai_adjustment?`<div class="small"><b>Что поправить:</b> ${esc(x.ai_adjustment)}</div>`:''}<div class="small muted">Оценка по фото приблизительная: точность зависит от состава и размера порции.</div></div>`;
  return `<div class="meal-ai pending"><b>Оценка блюда</b><div class="small muted">Фото сохранено. Автооценка появится после анализа.</div></div>`;
}
async function mealsPage(){
  if(demo){$('main').innerHTML=`<h1>Питание</h1><p class="sub">Фотодневник и обратная связь по БЖУ.</p>${nutritionTargetCard({protein_g:120,fat_g:60,carbs_g:220,water_l:2.5,supplements_text:'Омега-3 по рекомендации тренера'})}${mealUploadForm()}<div class="card"><div class="photo" style="display:grid;place-items:center;font-size:38px">🥗</div>${mealAiBlock({ai_score:8,ai_estimated_protein:35,ai_estimated_fat:14,ai_estimated_carbs:52,ai_feedback:'Хороший белковый приём пищи.',ai_positives:'есть белок и овощи',ai_adjustment:'чуть меньше соуса'})}</div>`;bindMealUpload(true);return}
  const [mealsQ,target]=await Promise.all([sb.from('meal_photos').select('*').eq('client_id',user.id).order('eaten_at',{ascending:false}).limit(30),getClientNutritionTarget(user.id)]);if(mealsQ.error)throw mealsQ.error;
  $('main').innerHTML=`<h1>Питание</h1><p class="sub">Фото еды, БЖУ и рекомендации тренера.</p>${nutritionTargetCard(target)}${mealUploadForm()}<div id="mealFeed"></div>`;bindMealUpload(false);let html='';
  for(const x of mealsQ.data||[]){const signed=await sb.storage.from('meal-photos').createSignedUrl(x.photo_path,3600);html+=`<div class="card">${signed.data?.signedUrl?`<img class="photo" src="${signed.data.signedUrl}">`:''}<div class="list-row" style="margin-top:10px"><div><b>${esc(x.meal_type||'Приём пищи')}</b><div class="small muted">${esc(x.comment||'')}</div></div><span class="small muted">${new Date(x.eaten_at).toLocaleString('ru-RU',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</span></div>${mealAiBlock(x)}</div>`} $('mealFeed').innerHTML=html||'<div class="empty">Фото еды появятся здесь.</div>'
}
function mealUploadForm(){return `<div class="card"><div class="field"><label class="label">Фото</label><input id="mealFile" class="input" type="file" accept="image/*" capture="environment"></div><div class="field"><label class="label">Тип</label><select id="mealType" class="input"><option>Завтрак</option><option>Обед</option><option>Ужин</option><option>Перекус</option></select></div><div class="field"><label class="label">Комментарий</label><input id="mealComment" class="input" placeholder="Курица, рис, овощи"></div><button id="uploadMeal" class="btn primary">Добавить в дневник</button></div>`}
function bindMealUpload(isDemo){$('uploadMeal').onclick=async()=>{const f=$('mealFile').files[0];if(!f)return toast('Сфотографируй или выбери еду',true);if(isDemo){demoData.meals++;return toast('Фото добавлено в демо')}const ext=(f.name.split('.').pop()||'jpg').toLowerCase(),path=`${user.id}/${uuid()}.${ext}`;const u=await sb.storage.from('meal-photos').upload(path,f,{contentType:f.type||'image/jpeg'});if(u.error)return toast(u.error.message,true);const q=await sb.from('meal_photos').insert({client_id:user.id,photo_path:path,meal_type:$('mealType').value,comment:$('mealComment').value.trim()}).select('id').single();if(q.error){await sb.storage.from('meal-photos').remove([path]);return toast(q.error.message,true)}toast('Фото добавлено. Анализирую блюдо…');const ai=await sb.functions.invoke('meal-photo-evaluate',{body:{meal_id:q.data.id}});if(ai.error)toast('Фото сохранено. AI-оценка пока недоступна.',true);else if(ai.data?.code==='AI_NOT_CONFIGURED')toast('Фото сохранено. Для автооценки нужно подключить серверный AI-ключ.');else if(ai.data?.score)toast(`Оценка блюда: ${ai.data.score}/10`);mealsPage()}}

async function getTrainerSettings(){
  if(demo)return {monthly_training_plan:80,weekly_training_plan:20};
  const q=await sb.from('trainer_settings').select('*').eq('trainer_id',user.id).maybeSingle();if(q.error)throw q.error;
  if(q.data)return q.data;const ins=await sb.from('trainer_settings').upsert({trainer_id:user.id,monthly_training_plan:0,weekly_training_plan:0,updated_at:new Date().toISOString()},{onConflict:'trainer_id'}).select().single();if(ins.error)throw ins.error;return ins.data;
}
async function profilePage(){
  const nm=profile?.full_name||'';
  if(role==='trainer'){
    const [settings,pricing]=await Promise.all([getTrainerSettings(),getTrainerPricing()]);
    $('main').innerHTML=`<h1>Профиль</h1><div class="card"><div class="field"><label class="label">Имя</label><input id="fullName" class="input" value="${esc(nm)}"></div><div class="field"><label class="label">Email</label><input class="input" disabled value="${esc(user?.email||'—')}"></div><button id="saveTrainerName" class="btn secondary">Сохранить имя</button></div><div class="section-title">Мои планы</div><div class="card"><div class="row"><div class="field"><label class="label">Тренировок в месяц</label><input id="trainerMonthPlan" class="input" type="number" min="0" max="500" value="${settings.monthly_training_plan||0}"></div><div class="field"><label class="label">Тренировок в неделю</label><input id="trainerWeekPlan" class="input" type="number" min="0" max="100" value="${settings.weekly_training_plan||0}"></div></div><button id="saveTrainerPlans" class="btn primary">Сохранить планы</button></div>${pricingForm(pricing,false)}<button id="logout" class="btn danger">Выйти</button>`;
    $('saveTrainerName').onclick=async()=>{const {data,error}=await sb.from('profiles').update({full_name:$('fullName').value.trim(),updated_at:new Date().toISOString()}).eq('id',user.id).select().single();if(error)return toast(error.message,true);profile=data;toast('Имя сохранено')};
    $('saveTrainerPlans').onclick=async()=>{const month=Number($('trainerMonthPlan').value||0),week=Number($('trainerWeekPlan').value||0);if(!Number.isInteger(month)||month<0||month>500||!Number.isInteger(week)||week<0||week>100)return toast('Проверь план тренировок',true);const q=await sb.from('trainer_settings').upsert({trainer_id:user.id,monthly_training_plan:month,weekly_training_plan:week,updated_at:new Date().toISOString()},{onConflict:'trainer_id'});if(q.error)return toast(q.error.message,true);toast('Планы сохранены')};
    $('savePricing').onclick=async()=>{const vals={fitness_single:n($('priceFitnessSingle').value),boxing_single:n($('priceBoxingSingle').value),block_5:n($('priceBlock5').value),block_10:n($('priceBlock10').value)};if(Object.values(vals).some(v=>v==null||!inRange(v,0)))return toast('Проверь суммы тарифов',true);const q=await sb.from('trainer_pricing').upsert({trainer_id:user.id,...vals,updated_at:new Date().toISOString()},{onConflict:'trainer_id'});if(q.error)return toast(q.error.message,true);toast('Тарифы сохранены')};
    $('logout').onclick=async()=>{await sb.auth.signOut();location.reload()};return;
  }
  const q=await sb.from('client_packages').select('*').eq('client_id',user.id).neq('status','archived').order('created_at',{ascending:false});if(q.error)throw q.error;const active=(q.data||[]).filter(x=>x.status==='active'&&packageRemaining(x)>0),sum=t=>active.filter(x=>x.training_type===t).reduce((a,x)=>a+packageRemaining(x),0);
  $('main').innerHTML=`<h1>Профиль</h1><div class="section-title">Мои оплаченные тренировки</div><div class="card client-balance-card"><div class="grid2"><div class="metric balance-metric"><span>Персональные</span><strong>${sum('personal')}</strong></div><div class="metric balance-metric"><span>Сплит</span><strong>${sum('split')}</strong></div><div class="metric balance-metric"><span>Бокс · ПТ</span><strong>${sum('boxing_personal')}</strong></div><div class="metric balance-metric"><span>Бокс · сплит</span><strong>${sum('boxing_split')}</strong></div></div></div><div class="card"><div class="field"><label class="label">Имя</label><input id="fullName" class="input" value="${esc(nm)}"></div><div class="field"><label class="label">Email</label><input class="input" disabled value="${esc(user?.email||'—')}"></div><div class="row"><div class="field"><label class="label">Возраст</label><input id="profileAge" class="input" type="number" value="${profile?.age??''}"></div><div class="field"><label class="label">Пол</label><select id="profileSex" class="input"><option value="">Выбрать</option><option value="female" ${profile?.sex==='female'?'selected':''}>Женский</option><option value="male" ${profile?.sex==='male'?'selected':''}>Мужской</option></select></div></div><div class="field"><label class="label">Телефон</label><input id="profilePhone" class="input" type="tel" value="${esc(profile?.phone||'')}"></div><div class="field"><label class="label">Основная цель</label><input id="profileGoal" class="input" value="${esc(profile?.primary_goal||'')}"></div><div class="field"><label class="label">Код клиента</label><div class="code">${esc(profile?.client_code||'—')}</div></div><button id="saveProfile" class="btn primary">Сохранить</button></div><button id="logout" class="btn danger">Выйти</button>`;
  $('saveProfile').onclick=async()=>{const age=n($('profileAge').value),sex=$('profileSex').value;if(age!=null&&(!Number.isInteger(age)||age<12||age>100))return toast('Возраст — от 12 до 100',true);if(!sex)return toast('Укажи пол',true);const payload={full_name:$('fullName').value.trim(),age,sex,phone:$('profilePhone').value.trim(),primary_goal:$('profileGoal').value.trim(),onboarding_completed:true,updated_at:new Date().toISOString()};const {data,error}=await sb.from('profiles').update(payload).eq('id',user.id).select().single();if(error)return toast(error.message,true);profile=data;toast('Сохранено')};$('logout').onclick=async()=>{await sb.auth.signOut();location.reload()};
}

const DEFAULT_PRICING={fitness_single:3000,boxing_single:4000,block_5:15000,block_10:35000};
async function getTrainerPricing(){
  if(demo)return {...DEFAULT_PRICING};
  const q=await sb.from('trainer_pricing').select('*').eq('trainer_id',user.id).maybeSingle();if(q.error)throw q.error;
  if(q.data)return q.data;
  const ins=await sb.from('trainer_pricing').upsert({trainer_id:user.id,...DEFAULT_PRICING,updated_at:new Date().toISOString()},{onConflict:'trainer_id'}).select().single();if(ins.error)throw ins.error;return ins.data;
}
function singlePriceForType(type,p){if(type==='personal')return Number(p.fitness_single||0);if(type==='boxing_personal')return Number(p.boxing_single||0);return null}
function packagePriceFor(type,count,p){if(count===5)return Number(p.block_5||0);if(count===10)return Number(p.block_10||0);if(count===1)return singlePriceForType(type,p);return null}
function clientForecastUnitPrice(c,p){
  const active=(c?.packages||[]).filter(x=>x.status==='active'&&packageRemaining(x)>0);
  const pack=active[0];
  if(!pack)return Number(p.fitness_single||0);
  const total=Math.max(1,Number(pack.total_sessions||1)),paid=Number(pack.amount_paid||0);
  if(paid>0)return paid/total;
  if(total===5)return Number(p.block_5||0)/5;
  if(total===10)return Number(p.block_10||0)/10;
  return singlePriceForType(pack.training_type,p)??Number(p.fitness_single||0);
}
async function getProjectedMonthlyRevenue(){
  const [clients,pricing]=await Promise.all([getTrainerClients(),getTrainerPricing()]);
  let total=0,scheduledPerWeek=0,pricedClients=0;
  for(const c of clients){
    const weekly=Math.max(0,Number(c.weekly_sessions||0));if(!weekly)continue;
    const unit=clientForecastUnitPrice(c,pricing);if(!Number.isFinite(unit)||unit<0)continue;
    scheduledPerWeek+=weekly;pricedClients++;total+=weekly*4.33*unit;
  }
  return {total:Math.round(total),scheduledPerWeek,pricedClients};
}
function revenueMonthKey(v){const d=new Date(v);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
async function getTrainerDashboardStats(){
  const now=new Date(),monthStart=new Date(now.getFullYear(),now.getMonth(),1),monthEnd=new Date(now.getFullYear(),now.getMonth()+1,1);const day=(now.getDay()+6)%7,weekStart=new Date(now);weekStart.setHours(0,0,0,0);weekStart.setDate(now.getDate()-day);
  const [eventsQ,settings,cQ]=await Promise.all([sb.from('schedule_events').select('id,starts_at,status').eq('trainer_id',user.id).gte('starts_at',monthStart.toISOString()).lt('starts_at',monthEnd.toISOString()),getTrainerSettings(),sb.from('trainer_clients').select('client_id',{count:'exact',head:true}).eq('trainer_id',user.id).eq('status','active')]);
  if(eventsQ.error)throw eventsQ.error;if(cQ.error)throw cQ.error;const events=eventsQ.data||[],ids=events.map(x=>x.id);let parts=[];
  if(ids.length){const q=await sb.from('schedule_event_clients').select('event_id,single_paid,earned_amount,earned_at').in('event_id',ids);if(q.error)throw q.error;parts=q.data||[]}
  const paidEvents=new Set(parts.filter(x=>x.single_paid).map(x=>x.event_id));const counted=events.filter(e=>e.status==='completed'||paidEvents.has(e.id));const weekActual=counted.filter(e=>new Date(e.starts_at)>=weekStart).length,monthActual=counted.length;const earned=parts.filter(x=>x.earned_at&&new Date(x.earned_at)>=monthStart&&new Date(x.earned_at)<monthEnd).reduce((a,x)=>a+Number(x.earned_amount||0),0);
  return {activeClients:Number(cQ.count||0),monthActual,weekActual,monthPlan:Number(settings.monthly_training_plan||0),weekPlan:Number(settings.weekly_training_plan||0),earned};
}
async function trainerHome(){
  if(demo){$('main').innerHTML=`<h1>Кабинет тренера</h1><p class="sub">Только ключевые цифры.</p><div class="grid2"><div class="metric"><span>Активных клиентов</span><strong>12</strong></div><div class="metric"><span>Доход за месяц</span><strong class="lime">186 000 ₽</strong></div></div><div class="card training-plan-card"><div class="list-row"><div><b>План тренировок на месяц</b><div class="small muted">Проведено или отмечено оплаченной</div></div><strong class="plan-fact-number">42 / 80</strong></div>${progressBar(42,80)}</div>`;return}
  const [s,forecast]=await Promise.all([getTrainerDashboardStats(),getProjectedMonthlyRevenue()]);
  $('main').innerHTML=`<h1>Кабинет тренера</h1><p class="sub">Клиенты, план тренировок и заработок.</p><div class="grid2 trainer-money-grid"><div class="metric"><span>Активных клиентов</span><strong>${s.activeClients}</strong></div><div class="metric"><span>Доход за месяц</span><strong class="lime">${money(s.earned)}</strong><small>по проведённым тренировкам</small></div><div class="metric forecast-income-metric"><span>Прогнозируемый доход</span><strong>${money(forecast.total)}</strong><small>${forecast.scheduledPerWeek} трен. / неделю · прогноз на 4,33 недели</small></div></div><div class="section-title">План тренировок</div><div class="card training-plan-card"><div class="list-row"><div><b>Месяц</b><div class="small muted">Факт растёт после «Проведена» или отметки разовой оплаты.</div></div><strong class="plan-fact-number">${s.monthActual} / ${s.monthPlan||'—'}</strong></div>${s.monthPlan?progressBar(s.monthActual,s.monthPlan):'<div class="small muted">Задай план в Профиле.</div>'}</div><div class="card training-plan-card"><div class="list-row"><div><b>Неделя</b><div class="small muted">Текущая неделя.</div></div><strong class="plan-fact-number">${s.weekActual} / ${s.weekPlan||'—'}</strong></div>${s.weekPlan?progressBar(s.weekActual,s.weekPlan):'<div class="small muted">Задай недельный план в Профиле.</div>'}</div><div class="card"><p class="small muted">Доход начисляется по проведённым занятиям: блок 5 распределяется по 3 000 ₽ за занятие, блок 10 — по 3 500 ₽. Для разовой фитнес-тренировки — 3 000 ₽, для бокса — 4 000 ₽. Для сплита можно указать фактическую сумму вручную.</p></div>`;
}
function pricingForm(p,isDemo){return `<div class="section-title">Тарифы</div><div class="card"><div class="row"><div class="field"><label class="label">Фитнес · разовая</label><input id="priceFitnessSingle" class="input" inputmode="numeric" value="${Number(p.fitness_single||0)}"></div><div class="field"><label class="label">Бокс · разовая</label><input id="priceBoxingSingle" class="input" inputmode="numeric" value="${Number(p.boxing_single||0)}"></div></div><div class="row"><div class="field"><label class="label">Блок 5</label><input id="priceBlock5" class="input" inputmode="numeric" value="${Number(p.block_5||0)}"></div><div class="field"><label class="label">Блок 10</label><input id="priceBlock10" class="input" inputmode="numeric" value="${Number(p.block_10||0)}"></div></div><button id="savePricing" class="btn secondary">Сохранить тарифы</button><p class="small muted">Тарифы используются для расчёта заработка по проведённым тренировкам.</p></div>`}

function localDateKey(d=new Date()){
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`;
}
function hm(iso){return new Date(iso).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}
function packageRemaining(p){return Math.max(0,Number(p?.total_sessions||0)-Number(p?.used_sessions||0))}
function trainingTypeLabel(t){return t==='split'?'Сплит':t==='boxing_personal'?'Бокс — персональная':t==='boxing_split'?'Бокс — сплит':'Персональная'}
function isSplitTraining(t){return t==='split'||t==='boxing_split'}
function isBoxingTraining(t){return t==='boxing_personal'||t==='boxing_split'}
function trainingTypeShort(t){return t==='boxing_personal'?'БОКС ПТ':t==='boxing_split'?'БОКС СПЛИТ':t==='split'?'СПЛИТ':'ПТ'}
function statusLabel(s){return s==='completed'?'Проведена':s==='cancelled'?'Отменена':'Записана'}

function paymentModeLabel(m){return m==='single'?'Разово':'Из блока'}

async function trainerSchedule(selectedDate=localDateKey(),prefillClientId=''){
  if(demo){$('main').innerHTML='<h1>Расписание</h1><div class="empty">Расписание недоступно в демо.</div>';return}
  const [clients,templates,exercises,programQ,pricing]=await Promise.all([
    getTrainerClients(),
    getProgramTemplates(),
    listExercises(),
    sb.from('training_programs').select('id,client_id,name,description,program_exercises(day_label)').eq('trainer_id',user.id).eq('active',true).order('created_at',{ascending:false}),
    getTrainerPricing()
  ]);
  if(programQ.error)throw programQ.error;const schedulePrograms=programQ.data||[];
  const quickWorkoutState={1:[],2:[]};
  const dayStart=new Date(`${selectedDate}T00:00:00`),dayEnd=new Date(dayStart);dayEnd.setDate(dayEnd.getDate()+1);
  const eQ=await sb.from('schedule_events').select('*').eq('trainer_id',user.id).gte('starts_at',dayStart.toISOString()).lt('starts_at',dayEnd.toISOString()).order('starts_at',{ascending:true});
  if(eQ.error)throw eQ.error;const events=eQ.data||[];
  let participants=[],scheduleAssignments=[];
  if(events.length){const ids=events.map(x=>x.id);const [q,aQ]=await Promise.all([sb.from('schedule_event_clients').select('*').in('event_id',ids),sb.from('assigned_workouts').select('id,schedule_event_id,client_id,program_name,day_label,status').in('schedule_event_id',ids).neq('status','cancelled')]);if(q.error)throw q.error;if(aQ.error)throw aQ.error;participants=q.data||[];scheduleAssignments=aQ.data||[]}
  const cMap=new Map(clients.map(x=>[x.id,x]));const pMap=new Map();for(const c of clients)for(const p of c.packages||[])pMap.set(p.id,p);
  const assignmentMap=new Map(scheduleAssignments.map(x=>[`${x.schedule_event_id}|${x.client_id}`,x]));
  const byHour=new Map(Array.from({length:24},(_,i)=>[i,[]]));for(const e of events)byHour.get(new Date(e.starts_at).getHours())?.push(e);
  const clientOpts=clients.map(c=>`<option value="${c.id}">${esc(c.full_name||'Без имени')} · ${esc(clientBalanceText(c))}</option>`).join('');
  const hours=Array.from({length:24},(_,h)=>{const ev=byHour.get(h)||[],time=`${String(h).padStart(2,'0')}:00`;return `<div class="schedule-hour"><button type="button" class="schedule-time schedule-time-button" data-schedule-time="${time}" aria-label="Записать клиента на ${time}">${time}<span>＋</span></button><div class="schedule-slot">${ev.map(e=>scheduleEventCard(e,participants,cMap,pMap,assignmentMap)).join('')}</div></div>`}).join('');
  const clientPaymentBlock=(i,title,hidden='')=>`<div id="scheduleClientBlock${i}" class="schedule-client-payment ${hidden}">
    <div class="field"><label class="label">${title}</label><select id="scheduleClient${i}" class="input"><option value="">Выбери клиента</option>${clientOpts}</select></div>
    <div class="row payment-row"><div class="field"><label class="label">Оплата</label><select id="schedulePayment${i}" class="input"><option value="package">Из блока</option><option value="single">Разово</option></select></div>
    <div id="packageField${i}" class="field"><label class="label">Абонемент</label><select id="schedulePackage${i}" class="input"></select></div></div>
    <label id="singlePayField${i}" class="single-pay-toggle hidden"><input id="singlePaid${i}" type="checkbox"><span><b>Разовая оплата получена</b><small>Можно отметить сейчас или позже прямо в расписании.</small></span></label>
    <div id="balanceHint${i}" class="small muted payment-balance-hint"></div>
    <div id="scheduleWorkoutPlan${i}" class="schedule-workout-plan"></div>
  </div>`;
  $('main').innerHTML=`<h1>Расписание</h1><p class="sub">У каждого клиента свой способ оплаты: из блока или разово. Блок списывается только после отметки «Проведена».</p>
  <div class="schedule-datebar"><button id="prevDay" class="btn inline secondary">←</button><input id="scheduleDate" class="input" type="date" value="${selectedDate}"><button id="todayDay" class="btn inline secondary">Сегодня</button><button id="nextDay" class="btn inline secondary">→</button></div>
  <div id="scheduleCreateCard" class="card schedule-create"><b>Новая запись</b><div class="row"><div class="field"><label class="label">Время</label><input id="scheduleTime" class="input" type="time" value="09:00"></div><div class="field"><label class="label">Длительность, мин</label><input id="scheduleDuration" class="input" type="number" inputmode="numeric" min="15" max="240" step="5" value="55"></div></div>
  <div class="field"><label class="label">Тип тренировки</label><select id="scheduleType" class="input"><option value="personal">Персональная</option><option value="split">Сплит</option><option value="boxing_personal">Бокс — персональная</option><option value="boxing_split">Бокс — сплит</option></select></div>
  ${clientPaymentBlock(1,'Клиент 1')}
  ${clientPaymentBlock(2,'Клиент 2','hidden')}
  <div class="field"><label class="label">Комментарий</label><input id="scheduleNotes" class="input" placeholder="Например: техника, лапы, ноги + ягодицы"></div><button id="createScheduleEvent" class="btn primary">Записать на тренировку</button></div>
  <div class="section-title">${new Date(`${selectedDate}T12:00:00`).toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'})}</div><div class="schedule-day">${hours}</div>`;

  const setDay=(delta)=>{const d=new Date(`${$('scheduleDate').value}T12:00:00`);d.setDate(d.getDate()+delta);trainerSchedule(localDateKey(d))};
  $('prevDay').onclick=()=>setDay(-1);$('nextDay').onclick=()=>setDay(1);$('todayDay').onclick=()=>trainerSchedule(localDateKey());$('scheduleDate').onchange=()=>trainerSchedule($('scheduleDate').value);
  document.querySelectorAll('[data-schedule-time]').forEach(b=>b.onclick=()=>{$('scheduleTime').value=b.dataset.scheduleTime;$('scheduleCreateCard')?.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>$('scheduleClient1')?.focus(),280)});

  const refreshClient=(i,forceSmartDefault=false)=>{
    const c=cMap.get($(`scheduleClient${i}`).value),type=$('scheduleType').value,payment=$(`schedulePayment${i}`),packEl=$(`schedulePackage${i}`),packageField=$(`packageField${i}`),singleField=$(`singlePayField${i}`),hint=$(`balanceHint${i}`);
    const packs=(c?.packages||[]).filter(p=>p.training_type===type&&p.status==='active'&&packageRemaining(p)>0);
    const old=packEl.value;
    packEl.innerHTML=packs.map(p=>`<option value="${p.id}">${esc(p.package_name)} · осталось ${packageRemaining(p)}/${p.total_sessions}</option>`).join('');
    if(old&&packs.some(p=>p.id===old))packEl.value=old;
    if(forceSmartDefault||!c){payment.value=packs.length?'package':'single'}
    if(payment.value==='package'&&!packs.length)payment.value='single';
    const single=payment.value==='single';
    packageField.classList.toggle('hidden',single);
    singleField.classList.toggle('hidden',!single);
    hint.textContent=c?(single?'Разовая оплата — тренировка из блока не спишется.':packs.length?clientBalanceText(c):'Нет активного блока этого типа.') : '';
  };
  const uniqueDays=(rows)=>[...new Set((rows||[]).map(x=>x.day_label).filter(Boolean))];
  const dayOptions=(rows)=>{const days=uniqueDays(rows);return `<option value="">Все упражнения</option>${days.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join('')}`};
  const exerciseSelectOptions=()=>groupExercises(exercises).map(([g,rows])=>`<optgroup label="${esc(g)}">${rows.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</optgroup>`).join('');
  const bindQuickRows=(i)=>{
    document.querySelectorAll(`[data-quick-row="${i}"]`).forEach((row,idx)=>{const item=quickWorkoutState[i][idx];if(!item)return;row.querySelector('.quick-sets').oninput=e=>item.target_sets=e.target.value;row.querySelector('.quick-reps').oninput=e=>item.target_reps=e.target.value;row.querySelector('.quick-rpe').oninput=e=>item.target_rpe=e.target.value;row.querySelector('.quick-note').oninput=e=>item.notes=e.target.value});
    document.querySelectorAll(`[data-quick-remove="${i}"]`).forEach(b=>b.onclick=()=>{quickWorkoutState[i].splice(Number(b.dataset.index),1);renderWorkoutPlan(i,'quick')});
  };
  const quickHtml=(i)=>`<div class="quick-workout-builder"><div class="field"><label class="label">Название</label><input id="quickWorkoutName${i}" class="input" value="Быстрая тренировка" placeholder="Например: Ноги + ягодицы"></div><div class="row quick-add-row"><div class="field quick-exercise-select"><label class="label">Упражнение из библиотеки</label><select id="quickExercise${i}" class="input">${exerciseSelectOptions()}</select></div><button id="quickAdd${i}" type="button" class="btn inline secondary">＋ Добавить</button></div><div id="quickChosen${i}" class="quick-chosen">${quickWorkoutState[i].length?quickWorkoutState[i].map((x,idx)=>`<div class="quick-workout-row" data-quick-row="${i}"><div class="quick-workout-title"><b>${idx+1}. ${esc(x.name)}</b><button type="button" class="quick-remove" data-quick-remove="${i}" data-index="${idx}">×</button></div><div class="quick-fields"><input class="input quick-sets" inputmode="numeric" value="${esc(x.target_sets)}" placeholder="подх."><input class="input quick-reps" value="${esc(x.target_reps)}" placeholder="повт."><input class="input quick-rpe" inputmode="decimal" value="${esc(x.target_rpe||'')}" placeholder="RPE"></div><input class="input quick-note" value="${esc(x.notes||'')}" placeholder="Комментарий / техника"></div>`).join(''):'<div class="small muted">Добавь упражнения — они станут тренировкой на выбранную дату.</div>'}</div></div>`;
  const renderWorkoutPlan=(i,forceSource=null)=>{
    const target=$(`scheduleWorkoutPlan${i}`),clientId=$(`scheduleClient${i}`).value,type=$('scheduleType').value;if(!target)return;
    if(!clientId){target.innerHTML='';return}
    if(isBoxingTraining(type)){target.innerHTML='<div class="schedule-workout-info"><b>Бокс</b><span class="small muted">Для бокса программа упражнений не назначается.</span></div>';return}
    const cps=schedulePrograms.filter(p=>p.client_id===clientId);const oldSource=forceSource||$(`scheduleWorkoutSource${i}`)?.value;const defaultSource=oldSource||(cps.length?'program':templates.length?'template':'quick');
    target.innerHTML=`<div class="schedule-workout-box"><div class="small lime schedule-workout-kicker">ТРЕНИРОВКА НА ЭТУ ДАТУ</div><div class="field"><label class="label">Что будем делать?</label><select id="scheduleWorkoutSource${i}" class="input"><option value="program" ${defaultSource==='program'?'selected':''}>Программа клиента</option><option value="template" ${defaultSource==='template'?'selected':''}>Готовый шаблон</option><option value="quick" ${defaultSource==='quick'?'selected':''}>Собрать сейчас из упражнений</option><option value="none" ${defaultSource==='none'?'selected':''}>Без программы</option></select></div><div id="scheduleWorkoutSourceBody${i}"></div></div>`;
    const renderBody=()=>{const src=$(`scheduleWorkoutSource${i}`).value,body=$(`scheduleWorkoutSourceBody${i}`);if(src==='program'){body.innerHTML=cps.length?`<div class="row"><div class="field"><label class="label">Программа</label><select id="scheduleProgram${i}" class="input">${cps.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div><div class="field"><label class="label">Тренировка / день</label><select id="scheduleProgramDay${i}" class="input"></select></div></div>`:'<div class="empty compact-empty">У клиента нет активной программы. Выбери шаблон или «Собрать сейчас».</div>';if(cps.length){const sync=()=>{const p=cps.find(x=>x.id===$(`scheduleProgram${i}`).value);$(`scheduleProgramDay${i}`).innerHTML=dayOptions(p?.program_exercises)};$(`scheduleProgram${i}`).onchange=sync;sync()}}else if(src==='template'){body.innerHTML=templates.length?`<div class="row"><div class="field"><label class="label">Шаблон</label><select id="scheduleTemplate${i}" class="input">${templates.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></div><div class="field"><label class="label">Тренировка / день</label><select id="scheduleTemplateDay${i}" class="input"></select></div></div>`:'<div class="empty compact-empty">Шаблонов пока нет. Выбери «Собрать сейчас».</div>';if(templates.length){const sync=()=>{const t=templates.find(x=>x.id===$(`scheduleTemplate${i}`).value);$(`scheduleTemplateDay${i}`).innerHTML=dayOptions(t?.template_exercises)};$(`scheduleTemplate${i}`).onchange=sync;sync()}}else if(src==='quick'){body.innerHTML=quickHtml(i);$(`quickAdd${i}`).onclick=()=>{const id=$(`quickExercise${i}`).value,x=exercises.find(v=>v.id===id);if(!x)return;quickWorkoutState[i].push({exercise_id:id,name:x.name,target_sets:x.category==='MFR'||x.category==='Mobility'?'1':'3',target_reps:x.category==='MFR'?'60 сек':x.category==='Mobility'?'10–15 мин':'10–12',target_rpe:'',notes:''});renderWorkoutPlan(i,'quick')};bindQuickRows(i)}else body.innerHTML='<div class="small muted">Запись создастся без назначенной программы. Её можно выбрать позже, открыв клиента из расписания.</div>'};
    $(`scheduleWorkoutSource${i}`).onchange=renderBody;renderBody();
  };
  const refresh=()=>{const split=isSplitTraining($('scheduleType').value);$('scheduleClientBlock2').classList.toggle('hidden',!split);refreshClient(1);refreshClient(2);renderWorkoutPlan(1);renderWorkoutPlan(2)};
  $('scheduleType').onchange=()=>{refreshClient(1,true);refreshClient(2,true);refresh()};
  $('scheduleClient1').onchange=()=>{refreshClient(1,true);renderWorkoutPlan(1)};$('scheduleClient2').onchange=()=>{refreshClient(2,true);renderWorkoutPlan(2)};
  $('schedulePayment1').onchange=()=>refreshClient(1);$('schedulePayment2').onchange=()=>refreshClient(2);refresh();

  const createWorkoutForScheduleClient=async(i,clientId,eventId,date)=>{
    if(isBoxingTraining($('scheduleType').value))return true;const src=$(`scheduleWorkoutSource${i}`)?.value||'none';if(src==='none')return true;
    if(src==='program'){const pid=$(`scheduleProgram${i}`)?.value,p=schedulePrograms.find(x=>x.id===pid&&x.client_id===clientId);if(!p){toast(`У клиента ${i} не выбрана программа`,true);return false}const a=await createAssignedWorkout({clientId,programId:p.id,programName:p.name,scheduledDate:date,dayLabel:$(`scheduleProgramDay${i}`)?.value||'',scheduleEventId:eventId});return Boolean(a?.id)}
    if(src==='template'){const tid=$(`scheduleTemplate${i}`)?.value,t=templates.find(x=>x.id===tid);if(!t){toast(`У клиента ${i} не выбран шаблон`,true);return false}const created=await sb.from('training_programs').insert({trainer_id:user.id,client_id:clientId,name:t.name,description:t.description||'Тренировка из шаблона',active:false,source_kind:'template',source_template_id:t.id}).select('id').single();if(created.error){toast(created.error.message,true);return false}const rows=(t.template_exercises||[]).map((x,idx)=>({program_id:created.data.id,exercise_id:x.exercise_id,day_label:x.day_label||'Тренировка',sort_order:x.sort_order??idx+1,target_sets:x.target_sets,target_reps:x.target_reps,target_rpe:x.target_rpe,notes:x.notes}));if(rows.length){const q=await sb.from('program_exercises').insert(rows);if(q.error){toast(q.error.message,true);return false}}const a=await createAssignedWorkout({clientId,programId:created.data.id,programName:t.name,scheduledDate:date,dayLabel:$(`scheduleTemplateDay${i}`)?.value||'',scheduleEventId:eventId});return Boolean(a?.id)}
    if(src==='quick'){const items=quickWorkoutState[i];if(!items.length){toast(`Добавь хотя бы одно упражнение для клиента ${i}`,true);return false}for(const x of items){const sets=Number(x.target_sets);if(!Number.isInteger(sets)||sets<=0){toast('Подходы должны быть целым числом больше 0',true);return false}const rpe=x.target_rpe===''?null:Number(x.target_rpe);if(rpe!=null&&!inRange(rpe,1,10)){toast('RPE должен быть от 1 до 10',true);return false}}const name=$(`quickWorkoutName${i}`)?.value.trim()||`Тренировка · ${fmtDate(date)}`;const created=await sb.from('training_programs').insert({trainer_id:user.id,client_id:clientId,name,description:'Собрана тренером прямо из расписания',active:false}).select('id').single();if(created.error){toast(created.error.message,true);return false}const rows=items.map((x,idx)=>({program_id:created.data.id,exercise_id:x.exercise_id,day_label:'Тренировка',sort_order:idx+1,target_sets:Number(x.target_sets),target_reps:String(x.target_reps||'10–12'),target_rpe:x.target_rpe===''?null:Number(x.target_rpe),notes:x.notes||null}));const q=await sb.from('program_exercises').insert(rows);if(q.error){toast(q.error.message,true);return false}const a=await createAssignedWorkout({clientId,programId:created.data.id,programName:name,scheduledDate:date,dayLabel:'Тренировка',scheduleEventId:eventId});return Boolean(a?.id)}
    return true;
  };
  $('createScheduleEvent').onclick=async()=>{
    const date=$('scheduleDate').value,time=$('scheduleTime').value,type=$('scheduleType').value,duration=Number($('scheduleDuration').value||55),c1=$('scheduleClient1').value,c2=$('scheduleClient2').value;
    if(!date||!time)return toast('Выбери дату и время',true);if(!c1)return toast('Выбери клиента',true);if(isSplitTraining(type)&&!c2)return toast('Для сплит-тренировки выбери второго клиента',true);if(isSplitTraining(type)&&c1===c2)return toast('Для сплит-тренировки нужны два разных клиента',true);if(!Number.isFinite(duration)||duration<15)return toast('Проверь длительность',true);
    const pay1=$('schedulePayment1').value,pay2=$('schedulePayment2').value,pack1=$('schedulePackage1').value,pack2=$('schedulePackage2').value;
    if(pay1==='package'&&!pack1)return toast('У клиента 1 выбери блок или поставь «Разово»',true);
    if(isSplitTraining(type)&&pay2==='package'&&!pack2)return toast('У клиента 2 выбери блок или поставь «Разово»',true);
    const start=new Date(`${date}T${time}:00`),end=new Date(start.getTime()+duration*60000);
    const overlap=events.some(e=>e.status!=='cancelled'&&start<new Date(e.ends_at)&&end>new Date(e.starts_at));if(overlap&&!confirm('На это время уже есть тренировка. Всё равно записать?'))return;
    const ins=await sb.from('schedule_events').insert({trainer_id:user.id,starts_at:start.toISOString(),ends_at:end.toISOString(),training_type:type,status:'scheduled',notes:$('scheduleNotes').value.trim()}).select('id').single();if(ins.error)return toast(ins.error.message,true);
    const paidAmountFor=(i,pay)=>{if(pay!=='single'||!$(`singlePaid${i}`).checked)return null;const fixed=singlePriceForType(type,pricing);if(fixed!=null)return fixed;const raw=prompt(`Укажи сумму разовой оплаты клиента ${i}, ₽`,'');if(raw==null)return false;const amount=n(raw);if(amount==null||amount<0){toast('Проверь сумму оплаты',true);return false}return amount};
    const amount1=paidAmountFor(1,pay1);if(amount1===false){await sb.from('schedule_events').delete().eq('id',ins.data.id);return}
    let amount2=null;if(isSplitTraining(type)){amount2=paidAmountFor(2,pay2);if(amount2===false){await sb.from('schedule_events').delete().eq('id',ins.data.id);return}}
    const rowFor=(i,client,pay,pack,amount)=>({event_id:ins.data.id,client_id:client,payment_mode:pay,package_id:pay==='package'?pack:null,single_paid:pay==='single'?Boolean($(`singlePaid${i}`).checked):false,paid_amount:amount,paid_at:amount!=null?new Date().toISOString():null});
    const rows=[rowFor(1,c1,pay1,pack1,amount1)];if(isSplitTraining(type))rows.push(rowFor(2,c2,pay2,pack2,amount2));
    const q=await sb.from('schedule_event_clients').insert(rows);if(q.error){await sb.from('schedule_events').delete().eq('id',ins.data.id);return toast(q.error.message,true)}
    let ok=true;
    if(isBoxingTraining(type)){
      const a1=await createAssignedWorkout({clientId:c1,programId:null,programName:trainingTypeLabel(type),scheduledDate:date,scheduleEventId:ins.data.id});ok=Boolean(a1?.id)&&ok;
      if(isSplitTraining(type)){const a2=await createAssignedWorkout({clientId:c2,programId:null,programName:trainingTypeLabel(type),scheduledDate:date,scheduleEventId:ins.data.id});ok=Boolean(a2?.id)&&ok}
    }else{
      ok=(await createWorkoutForScheduleClient(1,c1,ins.data.id,date))&&ok;if(isSplitTraining(type))ok=(await createWorkoutForScheduleClient(2,c2,ins.data.id,date))&&ok
    }
    toast(ok?'Клиент записан, тренировка назначена':'Запись создана. Проверь назначение тренировки.',!ok);trainerSchedule(date);
  };
  document.querySelectorAll('[data-event-status]').forEach(b=>b.onclick=async()=>{const [id,status]=b.dataset.eventStatus.split('|');const q=await sb.rpc('set_schedule_event_status',{p_event_id:id,p_status:status});if(q.error)return toast(q.error.message,true);toast(status==='completed'?'Тренировка проведена — остаток списан и заработок обновлён':status==='cancelled'?'Запись отменена':'Запись восстановлена');trainerSchedule(selectedDate)});
  document.querySelectorAll('[data-single-paid]').forEach(b=>b.onclick=async()=>{const [id,paid]=b.dataset.singlePaid.split('|'),mark=paid==='true';const part=participants.find(x=>x.id===id),ev=events.find(x=>x.id===part?.event_id);let amount=null;if(mark){amount=singlePriceForType(ev?.training_type,pricing);if(amount==null){const raw=prompt('Укажи сумму разовой оплаты, ₽','');if(raw==null)return;amount=n(raw);if(amount==null||amount<0)return toast('Проверь сумму оплаты',true)}}const q=await sb.from('schedule_event_clients').update(mark?{single_paid:true,paid_amount:amount,paid_at:new Date().toISOString()}:{single_paid:false,paid_amount:null,paid_at:null}).eq('id',id);if(q.error)return toast(q.error.message,true);if(mark&&ev?.status==='completed'){await sb.from('schedule_event_clients').update({earned_amount:amount,earned_at:ev.starts_at}).eq('id',id)}else if(!mark&&ev?.status!=='completed'){await sb.from('schedule_event_clients').update({earned_amount:null,earned_at:null}).eq('id',id)}toast(mark?`Оплата ${money(amount)} отмечена`:'Отметка оплаты снята');trainerSchedule(selectedDate)});
  document.querySelectorAll('[data-delete-event]').forEach(b=>b.onclick=async()=>{if(!confirm('Удалить тренировку из расписания полностью? Если она была проведена, списание и начисленный доход будут отменены.'))return;const q=await sb.rpc('delete_schedule_event',{p_event_id:b.dataset.deleteEvent});if(q.error)return toast(q.error.message,true);toast('Тренировка удалена из расписания');trainerSchedule(selectedDate)});
  document.querySelectorAll('[data-open-schedule-client]').forEach(b=>b.onclick=()=>{const [eventId,clientId]=b.dataset.openScheduleClient.split('|');openScheduleClientWorkout(eventId,clientId)});
  if(prefillClientId&&cMap.has(prefillClientId)){ $('scheduleClient1').value=prefillClientId; refreshClient(1,true); renderWorkoutPlan(1); $('scheduleTime').focus(); }
}
function scheduleEventCard(e,participants,cMap,pMap,assignmentMap=new Map()){
  const pp=participants.filter(x=>x.event_id===e.id);
  const people=pp.map(x=>{const c=cMap.get(x.client_id),p=pMap.get(x.package_id),a=assignmentMap.get(`${e.id}|${x.client_id}`);const open=`data-open-schedule-client="${e.id}|${x.client_id}"`,workout=a?`<span class="schedule-program-label">${esc(a.program_name)}${a.day_label?` · ${esc(a.day_label)}`:''}</span>`:'<span class="schedule-program-label muted">Программа не выбрана</span>';if(x.payment_mode==='single'){const paid=Boolean(x.single_paid);return `<div class="schedule-person payment-single"><button class="schedule-client-link" ${open}><b>${esc(c?.full_name||'Клиент')}</b>${workout}<span class="schedule-open-hint">Открыть тренировку →</span><span class="payment-badge ${paid?'paid':'unpaid'}">Разово · ${paid?`оплачено${x.paid_amount!=null?' · '+money(x.paid_amount):''}`:'не оплачено'}</span></button><button class="payment-toggle ${paid?'paid':''}" data-single-paid="${x.id}|${paid?'false':'true'}">${paid?'✓ Оплачено':'Отметить оплату'}</button></div>`}return `<div class="schedule-person"><button class="schedule-client-link" ${open}><b>${esc(c?.full_name||'Клиент')}</b>${workout}<span class="schedule-open-hint">Открыть тренировку →</span><span>${p?`${esc(p.package_name)} · осталось ${packageRemaining(p)}/${p.total_sessions}`:'Из блока · пакет не выбран'}</span></button><span class="payment-badge package">Из блока</span></div>`}).join('');
  const cls=e.status==='completed'?'schedule-completed':e.status==='cancelled'?'schedule-cancelled':'';
  return `<div class="schedule-event ${cls}"><div class="list-row"><div><b>${hm(e.starts_at)}–${hm(e.ends_at)}</b><div class="small muted">${trainingTypeLabel(e.training_type)} · ${statusLabel(e.status)}</div></div><span class="pill">${trainingTypeShort(e.training_type)}</span></div>${people}${e.notes?`<div class="small muted schedule-note">${esc(e.notes)}</div>`:''}<div class="schedule-actions">${e.status==='scheduled'?`<button class="btn inline primary" data-event-status="${e.id}|completed">Проведена</button><button class="btn inline danger" data-event-status="${e.id}|cancelled">Отменить</button>`:`<button class="btn inline secondary" data-event-status="${e.id}|scheduled">Вернуть в запись</button>`}<button class="btn inline danger" data-delete-event="${e.id}">Удалить полностью</button></div></div>`;
}


async function getTrainerClients(){
  if(demo)return [{id:'c1',full_name:'Анна Смирнова',phone:'+7 916 555-11-22',client_code:'ANNA2026',age:29,weekly_sessions:3,primary_goal:'Снижение веса',motivation:'Нравиться себе',client_category:'Лёгкий',client_features:'Любит силовые',packages:[{training_type:'personal',total_sessions:5,used_sessions:1,status:'active'}]}];
  const {data:l,error}=await sb.from('trainer_clients').select('client_id,status,client_category,coaching_notes,client_features,created_at,weekly_sessions').eq('trainer_id',user.id).eq('status','active');if(error)throw error;if(!l?.length)return[];
  const ids=l.map(x=>x.client_id);
  const [pQ,packQ]=await Promise.all([
    sb.from('profiles').select('id,full_name,client_code,phone,age,sex,weekly_sessions,primary_goal,motivation').in('id',ids),
    sb.from('client_packages').select('*').eq('trainer_id',user.id).in('client_id',ids).neq('status','archived').order('created_at',{ascending:false})
  ]);
  if(pQ.error)throw pQ.error;if(packQ.error)throw packQ.error;
  const linkMap=new Map(l.map(x=>[x.client_id,x]));
  const packMap=new Map();for(const x of packQ.data||[]){if(!packMap.has(x.client_id))packMap.set(x.client_id,[]);packMap.get(x.client_id).push(x)}
  return (pQ.data||[]).map(x=>({...x,...linkMap.get(x.id),packages:packMap.get(x.id)||[]})).sort((a,b)=>(a.full_name||'').localeCompare(b.full_name||'','ru'));
}
function clientBalanceText(c){
  const active=(c?.packages||[]).filter(x=>x.status==='active');
  const personal=active.filter(x=>x.training_type==='personal').reduce((a,x)=>a+Math.max(0,Number(x.total_sessions)-Number(x.used_sessions)),0);
  const split=active.filter(x=>x.training_type==='split').reduce((a,x)=>a+Math.max(0,Number(x.total_sessions)-Number(x.used_sessions)),0);
  const boxingPersonal=active.filter(x=>x.training_type==='boxing_personal').reduce((a,x)=>a+Math.max(0,Number(x.total_sessions)-Number(x.used_sessions)),0);
  const boxingSplit=active.filter(x=>x.training_type==='boxing_split').reduce((a,x)=>a+Math.max(0,Number(x.total_sessions)-Number(x.used_sessions)),0);
  if(!active.length)return (c?.packages||[]).some(x=>x.status!=='archived')?'Нет остатка':'Абонемент не добавлен';
  const parts=[];if(personal)parts.push(`ПТ: ${personal}`);if(split)parts.push(`Сплит: ${split}`);if(boxingPersonal)parts.push(`Бокс ПТ: ${boxingPersonal}`);if(boxingSplit)parts.push(`Бокс сплит: ${boxingSplit}`);
  return parts.length?parts.join(' · '):'Нет остатка';
}
function packageUrgencyClass(p){
  if(!p||p.status!=='active')return 'balance-neutral';
  const remaining=packageRemaining(p),total=Math.max(1,Number(p.total_sessions||1));
  if(remaining<=0)return 'balance-red';
  if(total<=5){if(remaining>=4)return 'balance-green';if(remaining>=2)return 'balance-yellow';return 'balance-red'}
  if(total<=10){if(remaining>=6)return 'balance-green';if(remaining>=3)return 'balance-yellow';return 'balance-red'}
  const ratio=remaining/total;return ratio>=.6?'balance-green':ratio>=.3?'balance-yellow':'balance-red';
}
function clientUrgencyClass(c){
  const all=(c?.packages||[]).filter(x=>x.status!=='archived');if(!all.length)return 'balance-neutral';
  const active=all.filter(x=>x.status==='active'&&packageRemaining(x)>0);if(!active.length)return 'balance-red';
  const rank={'balance-red':3,'balance-yellow':2,'balance-green':1,'balance-neutral':0};
  return active.map(packageUrgencyClass).sort((a,b)=>rank[b]-rank[a])[0]||'balance-neutral';
}
function inviteStatusLabel(s){return s==='active'?'Ожидает клиента':s==='used'?'Клиент подключён':s==='revoked'?'Отозван':'Истёк'}
function inviteUrl(invite){const token=String(invite?.invite_token||'');if(invite?.stable_client_id)return `${PUBLIC_APP_ORIGIN}/join/${encodeURIComponent(token)}`;return `${SUPABASE_URL}/functions/v1/client-access?token=${encodeURIComponent(token)}`}
function drawPassQr(targetId,url,size=208){const el=$(targetId);if(!el)return;el.innerHTML='';if(window.QRCode){new QRCode(el,{text:url,width:size,height:size,colorDark:'#0a0d0b',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.H})}else el.innerHTML='<div class="empty">QR временно недоступен</div>'}
async function passCardBlob(){if(!window.html2canvas||!$('passShareCard'))return null;const canvas=await html2canvas($('passShareCard'),{scale:2.4,backgroundColor:null,useCORS:true,logging:false});return await new Promise(resolve=>canvas.toBlob(resolve,'image/png',1))}

async function showDenisFitPass(invite){
  const url=inviteUrl(invite);
  const shareText='Твой личный кабинет DenisFit готов. Нажми на ссылку:';
  $('main').innerHTML=`<button id="backFromPass" class="btn inline ghost">← Клиенты</button><div class="pass-screen-head"><div class="invite-kicker">DENISFIT</div><h1>Ссылка готова</h1><p class="sub">Отправь её клиенту в Telegram, WhatsApp или любой другой мессенджер.</p></div><div class="card pass-actions-card"><div class="field"><label class="label">Персональная ссылка клиента</label><textarea id="clientInviteLink" class="input selectable" readonly style="height:100px;padding-top:13px">${esc(url)}</textarea></div><button id="sharePass" class="btn primary">Отправить ссылку</button><button id="copyPassLink" class="btn secondary">Скопировать ссылку</button><p class="small muted center">Клиент нажимает ссылку, вводит только своё имя и сразу попадает в DenisFit. Почта и пароль не нужны.</p></div>`;
  $('backFromPass').onclick=trainerClients;
  $('copyPassLink').onclick=async()=>{try{await navigator.clipboard.writeText(url);toast('Ссылка скопирована')}catch(e){toast('Не удалось скопировать ссылку',true)}};
  $('sharePass').onclick=async()=>{try{if(navigator.share){await navigator.share({title:'DenisFit',text:shareText,url});return}await navigator.clipboard.writeText(url);toast('Ссылка скопирована — вставь её в мессенджер')}catch(e){if(e?.name!=='AbortError')toast(e.message||'Не удалось отправить ссылку',true)}};
}
async function createTrainerPass(){
  const btn=$('newDenisFitPass');
  if(btn?.disabled)return;
  if(btn){btn.disabled=true;btn.textContent='Создаю ссылку…'}
  try{
    const {data,error}=await sb.rpc('create_client_pass',{p_client_name:'Новый клиент',p_coaching_mode:'mixed',p_weekly_sessions:2,p_template_id:null});
    if(error)throw error;
    const invite=Array.isArray(data)?data[0]:data;
    if(!invite)throw new Error('Ссылка не была создана');
    toast('Ссылка клиента готова');
    await showDenisFitPass(invite);
  }catch(e){toast(e.message||'Не удалось создать ссылку',true)}
  finally{if(btn){btn.disabled=false;btn.textContent='＋ Пригласить клиента'}}
}
async function manageClientAccess(action,clientId){
  const {data:{session},error:sessionError}=await sb.auth.getSession();
  if(sessionError||!session?.access_token)throw new Error('Сессия тренера истекла. Войди снова.');
  const res=await fetch(`${SUPABASE_URL}/functions/v1/manage-client-access`,{
    method:'POST',
    headers:{'Authorization':`Bearer ${session.access_token}`,'Content-Type':'application/json','apikey':SUPABASE_KEY},
    body:JSON.stringify({action,client_id:clientId})
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok||data.error)throw new Error(data.error||'Не удалось изменить доступ клиента');
  return data;
}
function clientAccessShareText(c,access){
  const trainer=profile?.full_name||'Денис';
  return `${c.full_name||'Привет'}, ${trainer} открыл тебе личный кабинет DenisFit.\n\nНажми на ссылку — регистрация, почта и пароль не нужны:\n${access.access_url}\n\nЗапасной код: ${access.short_code}`;
}
function setClientAccessUi(access){
  const status=$('clientAccessStatus'),code=$('clientAccessCode'),hint=$('clientAccessHint');
  if(!status||!code||!hint)return;
  if(!access||access.status==='revoked'){
    status.textContent='Закрыт';status.className='pill';
    code.innerHTML='<span>Доступ закрыт</span><strong>—</strong>';
    hint.textContent='Старая ссылка и код больше не работают. Нажми «Новая ссылка», чтобы открыть доступ снова.';
    return;
  }
  status.textContent='Активен';status.className='pill lime-pill';
  code.innerHTML=`<span>ЗАПАСНОЙ КОД</span><strong>${esc(access.short_code||'—')}</strong>`;
  hint.textContent=access.expires_at?`Ссылка действует до ${new Date(access.expires_at).toLocaleDateString('ru-RU')}. На телефоне клиента вход сохранится.`:'На телефоне клиента вход сохранится.';
}
async function getOrCreateClientAccess(clientId){
  const access=await manageClientAccess('issue',clientId);setClientAccessUi(access);return access;
}
async function trainerClients(){
  const [clients,templates,invQ]=await Promise.all([
    getTrainerClients(),
    getProgramTemplates(),
    demo?Promise.resolve({data:[],error:null}):sb.from('client_invites').select('*').eq('trainer_id',user.id).order('created_at',{ascending:false}).limit(8)
  ]);
  if(invQ.error)throw invQ.error;const invites=invQ.data||[],activeInvites=invites.filter(x=>x.status==='active'&&new Date(x.expires_at)>new Date());
  const templateOptions=`<option value="">Без программы</option>${templates.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('')}`;
  const inviteRows=invites.length?invites.map(x=>`<div class="invite-history-row"><button class="invite-history-main" data-open-pass="${x.id}"><div><b>${esc(x.client_name)}</b><div class="small muted">${esc(x.short_code)} · ${inviteStatusLabel(x.status)}</div></div><span class="pill ${x.status==='active'?'lime-pill':''}">${x.status==='active'?'Ссылка':'✓'}</span></button>${x.status==='active'?`<button class="btn inline danger" data-revoke-pass="${x.id}">Отозвать</button>`:''}</div>`).join(''):'<div class="empty">Приглашений пока нет.</div>';
  $('main').innerHTML=`<h1>Клиенты</h1><p class="sub">Только твои активные клиенты.</p><button id="newDenisFitPass" class="btn primary invite-main-button">＋ Пригласить клиента</button><div id="passCreator" class="card pass-creator hidden"><div class="invite-kicker">DENISFIT PASS</div><b>Новый персональный доступ</b><div class="field"><label class="label">Имя клиента</label><input id="passClientName" class="input" placeholder="Например: Марк" autocomplete="off"></div><div class="row"><div class="field"><label class="label">Режим ведения</label><select id="passCoachingMode" class="input"><option value="personal">Персональное</option><option value="mixed" selected>Смешанное</option></select></div><div class="field"><label class="label">Тренировок в неделю</label><input id="passWeeklySessions" class="input" type="number" min="0" max="14" value="2"></div></div><div id="passModeHelp" class="small muted"></div><div class="field"><label class="label">Назначить программу сразу</label><select id="passTemplate" class="input">${templateOptions}</select></div><button id="createPassBtn" class="btn primary">Создать Pass</button></div>${activeInvites.length?`<div class="pass-active-note"><b>${activeInvites.length}</b> ссылок ожидают подключения</div>`:''}<div class="client-simple-list">${clients.length?clients.map(x=>`<button class="client-btn client-simple-row ${clientUrgencyClass(x)}" data-client="${x.id}"><div><b>${esc(x.full_name||'Без имени')}</b><div class="small client-balance-line">${esc(clientBalanceText(x))}</div><div class="small muted">${Number(x.weekly_sessions||0)} трен. / неделю</div></div><span>→</span></button>`).join(''):'<div class="empty">Клиентов пока нет.</div>'}</div><details class="card pass-history"><summary><b>История приглашений</b></summary>${inviteRows}</details><details class="card"><summary><b>Резервный способ · добавить по старому коду</b></summary><div class="field"><input id="clientCode" class="input" placeholder="Код клиента" autocomplete="off" autocapitalize="characters"></div><button id="linkClient" class="btn secondary">Добавить клиента</button></details>`;
  $('newDenisFitPass').onclick=()=>createTrainerPass();
  const modeHelp=()=>{$('passModeHelp').textContent=$('passCoachingMode').value==='personal'?'Программу и дневник ведёшь ты. Клиент не заполняет рабочие веса.':'Клиент видит назначенные программы и может сам вносить результаты.'};$('passCoachingMode').onchange=modeHelp;modeHelp();
  if($('createPassBtn'))$('createPassBtn').onclick=()=>createTrainerPass();
  if($('linkClient'))$('linkClient').onclick=async()=>{const code=$('clientCode').value.trim().toUpperCase();if(!/^[A-Z0-9]{8}$/.test(code))return toast('Код клиента — 8 символов',true);const {data,error}=await sb.functions.invoke('link-client-by-code',{body:{code}});if(error)return toast(error.message||'Не удалось добавить клиента',true);if(data?.error)return toast(data.error,true);toast('Клиент добавлен');trainerClients()};
  document.querySelectorAll('[data-client]').forEach(b=>b.onclick=()=>clientDetail(b.dataset.client,clients.find(x=>x.id===b.dataset.client)));
  document.querySelectorAll('[data-open-pass]').forEach(b=>b.onclick=()=>{const x=invites.find(v=>v.id===b.dataset.openPass);if(!x)return;if(x.status!=='active')return toast('Этот Pass уже нельзя использовать',true);showDenisFitPass(x)});
  document.querySelectorAll('[data-revoke-pass]').forEach(b=>b.onclick=async()=>{if(!confirm('Отозвать этот DenisFit Pass? QR и короткий код перестанут работать.'))return;const q=await sb.from('client_invites').update({status:'revoked'}).eq('id',b.dataset.revokePass).eq('trainer_id',user.id);if(q.error)return toast(q.error.message,true);toast('Pass отозван');trainerClients()});
}
function monthsWithTrainerSince(v){if(!v)return '—';const a=new Date(v),b=new Date();let m=(b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth();if(b.getDate()<a.getDate())m--;return m<=0?'меньше месяца':`${m} мес.`}
async function getClientTrainerEconomics(clientId){
  const start=new Date();start.setDate(1);start.setHours(0,0,0,0);const end=new Date(start.getFullYear(),start.getMonth()+1,1);
  const eQ=await sb.from('schedule_events').select('id,status,starts_at').eq('trainer_id',user.id).gte('starts_at',start.toISOString()).lt('starts_at',end.toISOString());if(eQ.error)throw eQ.error;const ids=(eQ.data||[]).map(x=>x.id);if(!ids.length)return {earned:0,sessions:0};
  const pQ=await sb.from('schedule_event_clients').select('event_id,earned_amount,single_paid').in('event_id',ids).eq('client_id',clientId);if(pQ.error)throw pQ.error;const parts=pQ.data||[],eventMap=new Map((eQ.data||[]).map(x=>[x.id,x])),eventIds=new Set(parts.filter(x=>eventMap.get(x.event_id)?.status==='completed'||x.single_paid).map(x=>x.event_id));return {earned:parts.reduce((a,x)=>a+Number(x.earned_amount||0),0),sessions:eventIds.size};
}
async function clientDetail(id,c){
  const [packQ,programQ,econ,linkQ,targetQ,templates]=await Promise.all([
    sb.from('client_packages').select('*').eq('trainer_id',user.id).eq('client_id',id).neq('status','archived').order('created_at',{ascending:false}),
    sb.from('training_programs').select('id,name,description,active').eq('trainer_id',user.id).eq('client_id',id).eq('active',true).order('created_at',{ascending:false}),
    getClientTrainerEconomics(id),
    sb.from('trainer_clients').select('*').eq('trainer_id',user.id).eq('client_id',id).single(),
    sb.from('client_nutrition_targets').select('*').eq('trainer_id',user.id).eq('client_id',id).maybeSingle(),
    getProgramTemplates()
  ]);
  for(const q of [packQ,programQ,linkQ,targetQ])if(q.error)throw q.error;const packages=packQ.data||[],link=linkQ.data||{},target=targetQ.data||{},pricing=await getTrainerPricing(),active=packages.filter(x=>x.status==='active'&&packageRemaining(x)>0),sum=t=>active.filter(x=>x.training_type===t).reduce((a,x)=>a+packageRemaining(x),0);
  const packageHtml=packages.length?packages.map(p=>`<div class="package-row ${p.status==='exhausted'?'package-empty':''}"><div><b>${esc(p.package_name)}</b><div class="small muted">${trainingTypeLabel(p.training_type)}${p.entry_mode==='purchase'&&Number(p.amount_paid||0)>0?` · оплачено ${money(p.amount_paid)}`:''}</div></div><div class="package-balance"><strong>${packageRemaining(p)}</strong><span>осталось</span></div>${p.status!=='archived'?`<button class="btn inline ghost" data-archive-package="${p.id}">Убрать</button>`:''}</div>`).join(''):'<div class="empty">Абонементов пока нет.</div>';
  const templateButtons=templates.length?templates.map(t=>`<button class="client-btn" data-client-template="${t.id}"><div><b>${esc(t.name)}</b><div class="small muted">${esc(t.description||'Шаблон тренировки')} · ${t.template_exercises?.length||0} упр.</div></div><span>＋</span></button>`).join(''):'<div class="empty">Сначала создай шаблон во вкладке «Программы».</div>';
  const mode=link.coaching_mode||'mixed';
  $('main').innerHTML=`<button id="backClients" class="btn inline ghost">← Клиенты</button><h1>${esc(c.full_name||'Клиент')}</h1><p class="sub">${c.primary_goal?esc(c.primary_goal):'Цель не указана'}</p>
  <div class="grid2"><div class="metric"><span>Занимается со мной</span><strong>${monthsWithTrainerSince(link.created_at)}</strong><small>${fmtDate(link.created_at)}</small></div><div class="metric"><span>Доход за месяц</span><strong class="lime">${money(econ.earned)}</strong><small>${econ.sessions} тренировок</small></div></div>
  <div class="client-actions-grid"><button id="assignFromClient" class="btn primary big-action">＋ Назначить тренировку</button><button id="addProgramFromClient" class="btn secondary big-action">＋ Добавить программу тренировок</button></div>
  <div class="section-title">Доступ клиента</div><div class="card client-access-card"><div class="client-access-head"><div><b>Вход без регистрации</b><p class="small muted">Клиент получает ссылку, нажимает её и сразу попадает в свой DenisFit.</p></div><span id="clientAccessStatus" class="pill">По запросу</span></div><div id="clientAccessCode" class="client-access-code"><span>ЗАПАСНОЙ КОД</span><strong>—</strong></div><div class="client-access-actions"><button id="shareClientAccess" class="btn primary">Отправить ссылку</button><button id="copyClientAccess" class="btn secondary">Скопировать</button><button id="rotateClientAccess" class="btn secondary">Новая ссылка</button><button id="revokeClientAccess" class="btn danger">Закрыть доступ</button></div><p id="clientAccessHint" class="small muted center">Ссылка создастся при первом нажатии. Старую ссылку можно отозвать в любой момент.</p></div>
  <div id="clientProgramPicker" class="card hidden"><b>Выбери программу</b><p class="small muted">Список твоих готовых шаблонов. Нажми — и программа сразу появится у клиента при смешанном ведении.</p>${templateButtons}</div>
  <div class="section-title">Формат ведения</div><div class="card"><div class="field"><label class="label">Режим клиента</label><select id="clientCoachingMode" class="input"><option value="personal" ${mode==='personal'?'selected':''}>Персональное ведение</option><option value="mixed" ${mode==='mixed'?'selected':''}>Смешанное ведение</option></select></div><div class="field"><label class="label">Тренировок в неделю</label><input id="clientWeeklySessions" class="input" type="number" min="0" max="14" value="${link.weekly_sessions??c.weekly_sessions??0}"><div class="small muted">Используется для прогноза дохода на главной.</div></div><div id="coachingModeHelp" class="small muted"></div></div>
  <div class="section-title">Остаток тренировок</div><div class="card client-balance-card"><div class="grid2"><div class="metric balance-metric"><span>Персональные</span><strong>${sum('personal')}</strong></div><div class="metric balance-metric"><span>Сплит</span><strong>${sum('split')}</strong></div><div class="metric balance-metric"><span>Бокс · ПТ</span><strong>${sum('boxing_personal')}</strong></div><div class="metric balance-metric"><span>Бокс · сплит</span><strong>${sum('boxing_split')}</strong></div></div></div>
  <div class="section-title">Кардио</div><div class="card"><div class="row"><div class="field"><label class="label">Раз в неделю</label><input id="clientCardioWeek" class="input" type="number" min="0" max="14" value="${link.cardio_sessions_per_week||0}"></div><div class="field"><label class="label">Минут за сессию</label><input id="clientCardioMinutes" class="input" type="number" min="0" max="300" value="${link.cardio_minutes||0}"></div></div></div>
  <div class="section-title">Питание</div><div class="card"><div class="nutrition-macro-grid edit"><label>Белки, г<input id="nutritionProtein" class="input" inputmode="decimal" value="${target.protein_g??''}"></label><label>Жиры, г<input id="nutritionFat" class="input" inputmode="decimal" value="${target.fat_g??''}"></label><label>Углеводы, г<input id="nutritionCarbs" class="input" inputmode="decimal" value="${target.carbs_g??''}"></label><label>Вода, л<input id="nutritionWater" class="input" inputmode="decimal" value="${target.water_l??''}"></label></div><div class="field"><label class="label">Рекомендуемые БАДы</label><textarea id="nutritionSupplements" class="input" placeholder="Свободный текст: только то, что ты рекомендуешь клиенту">${esc(target.supplements_text||'')}</textarea></div><button id="saveClientPlan" class="btn primary">Сохранить ведение, кардио и питание</button></div>
  <div class="section-title">Абонементы</div><div class="card">${packageHtml}<div class="package-create"><div class="field"><label class="label">Что добавляем</label><select id="packageEntryMode" class="input"><option value="remaining">Текущий оплаченный остаток</option><option value="new">Новая покупка / блок</option></select></div><div class="row"><div class="field"><label class="label">Тип</label><select id="packageType" class="input"><option value="personal">Персональная</option><option value="split">Сплит</option><option value="boxing_personal">Бокс — персональная</option><option value="boxing_split">Бокс — сплит</option></select></div><div class="field"><label class="label">Тренировок</label><input id="packageCount" class="input" type="number" min="1" max="100" value="5"></div></div><div id="packageAmountField" class="field hidden"><label class="label">Сумма блока / оплаты, ₽</label><input id="packageAmount" class="input" inputmode="numeric" placeholder="15000"></div><div class="package-presets"><button type="button" class="btn inline secondary" data-pack-count="1">1</button><button type="button" class="btn inline secondary" data-pack-count="5">5</button><button type="button" class="btn inline secondary" data-pack-count="10">10</button></div><button id="addPackage" class="btn secondary">Добавить</button></div></div>
  <div class="section-title">Данные клиента</div><div class="card"><div class="row"><div><span class="small muted">Пол</span><b>${c.sex==='female'?'Женский':c.sex==='male'?'Мужской':'—'}</b></div><div><span class="small muted">Возраст</span><b>${c.age??'—'}</b></div></div><div class="profile-note"><span class="small muted">Цель</span><p>${esc(c.primary_goal||'Не указана')}</p></div><div class="field"><label class="label">Заметка тренера</label><textarea id="coachingNotes" class="input">${esc(link.coaching_notes||'')}</textarea></div><button id="saveClientNote" class="btn secondary">Сохранить заметку</button></div>
  <div class="section-title">Программы</div>${(programQ.data||[]).length?(programQ.data||[]).map(x=>card(x.name,`<p class="small muted">${esc(x.description||'Активная программа')}</p>`)).join(''):'<div class="empty">Активной программы нет.</div>'}<button id="deleteClient" class="btn danger">Удалить клиента</button>`;
  $('backClients').onclick=trainerClients;$('assignFromClient').onclick=()=>{page='schedule';renderNav();trainerSchedule(localDateKey(),id)};$('addProgramFromClient').onclick=()=>{$('clientProgramPicker').classList.toggle('hidden')};document.querySelectorAll('[data-client-template]').forEach(b=>b.onclick=()=>assignTemplate(b.dataset.clientTemplate,id,true));
  $('shareClientAccess').onclick=async()=>{try{const access=await getOrCreateClientAccess(id),text=clientAccessShareText(c,access);if(navigator.share){await navigator.share({title:'DenisFit',text});return}await navigator.clipboard.writeText(text);toast('Приглашение скопировано — вставь его в мессенджер')}catch(e){if(e?.name!=='AbortError')toast(e.message||'Не удалось отправить ссылку',true)}};
  $('copyClientAccess').onclick=async()=>{try{const access=await getOrCreateClientAccess(id);await navigator.clipboard.writeText(access.access_url);toast('Ссылка клиента скопирована')}catch(e){toast(e.message||'Не удалось скопировать ссылку',true)}};
  $('rotateClientAccess').onclick=async()=>{if(!confirm('Создать новую ссылку? Старая ссылка и код сразу перестанут работать.'))return;try{const access=await manageClientAccess('rotate',id);setClientAccessUi(access);toast('Новая ссылка создана')}catch(e){toast(e.message||'Не удалось создать новую ссылку',true)}};
  $('revokeClientAccess').onclick=async()=>{if(!confirm('Закрыть доступ клиенту? Старая ссылка и код сразу перестанут работать.'))return;try{const access=await manageClientAccess('revoke',id);setClientAccessUi(access);toast('Доступ клиента закрыт')}catch(e){toast(e.message||'Не удалось закрыть доступ',true)}};
  const modeHelp=()=>{$('coachingModeHelp').textContent=$('clientCoachingMode').value==='personal'?'Клиент не видит программы и не может вносить рабочие веса/подходы. Всё ведёшь ты.':'Клиент видит назначенные программы и может сам вести веса и подходы.'};$('clientCoachingMode').onchange=modeHelp;modeHelp();
  $('saveClientPlan').onclick=async()=>{const coaching_mode=$('clientCoachingMode').value,weekly_sessions=Number($('clientWeeklySessions').value||0),cardio_sessions_per_week=Number($('clientCardioWeek').value||0),cardio_minutes=Number($('clientCardioMinutes').value||0);if(!Number.isInteger(weekly_sessions)||weekly_sessions<0||weekly_sessions>14)return toast('Проверь количество тренировок в неделю',true);if(!Number.isInteger(cardio_sessions_per_week)||cardio_sessions_per_week<0||cardio_sessions_per_week>14||!Number.isInteger(cardio_minutes)||cardio_minutes<0||cardio_minutes>300)return toast('Проверь кардио',true);const macros={protein_g:n($('nutritionProtein').value)||0,fat_g:n($('nutritionFat').value)||0,carbs_g:n($('nutritionCarbs').value)||0,water_l:n($('nutritionWater').value)||0,supplements_text:$('nutritionSupplements').value.trim(),updated_at:new Date().toISOString()};if([macros.protein_g,macros.fat_g,macros.carbs_g,macros.water_l].some(v=>v<0))return toast('БЖУ и вода не могут быть отрицательными',true);const [a,b]=await Promise.all([sb.from('trainer_clients').update({coaching_mode,weekly_sessions,cardio_sessions_per_week,cardio_minutes}).eq('trainer_id',user.id).eq('client_id',id),sb.from('client_nutrition_targets').upsert({trainer_id:user.id,client_id:id,...macros},{onConflict:'trainer_id,client_id'})]);if(a.error)return toast(a.error.message,true);if(b.error)return toast(b.error.message,true);toast('Настройки клиента сохранены');clientDetail(id,c)};
  $('saveClientNote').onclick=async()=>{const q=await sb.from('trainer_clients').update({coaching_notes:$('coachingNotes').value.trim()}).eq('trainer_id',user.id).eq('client_id',id);if(q.error)return toast(q.error.message,true);toast('Заметка сохранена')};
  const syncAmount=()=>{if(!$('packageAmount'))return;const val=packagePriceFor($('packageType').value,Number($('packageCount').value),pricing);if(val!=null)$('packageAmount').value=String(val)};document.querySelectorAll('[data-pack-count]').forEach(b=>b.onclick=()=>{$('packageCount').value=b.dataset.packCount;syncAmount()});const syncMode=()=>{const remaining=$('packageEntryMode').value==='remaining';$('packageAmountField').classList.toggle('hidden',remaining);if(!remaining)syncAmount()};$('packageEntryMode').onchange=syncMode;$('packageType').onchange=syncAmount;$('packageCount').oninput=syncAmount;syncMode();
  $('addPackage').onclick=async()=>{const type=$('packageType').value,count=Number($('packageCount').value),remaining=$('packageEntryMode').value==='remaining';if(!Number.isInteger(count)||count<1||count>100)return toast('Проверь количество тренировок',true);let amount=0;if(!remaining){amount=n($('packageAmount').value);if(amount==null||amount<0)return toast('Проверь сумму',true)}const name=remaining?`Текущий остаток ${count} · ${trainingTypeLabel(type)}`:(count===1?`Разовая · ${trainingTypeLabel(type)}`:`Блок ${count} · ${trainingTypeLabel(type)}`);const q=await sb.from('client_packages').insert({trainer_id:user.id,client_id:id,training_type:type,package_name:name,total_sessions:count,used_sessions:0,status:'active',entry_mode:remaining?'remaining':'purchase',amount_paid:remaining?0:amount,paid_at:remaining?null:new Date().toISOString()});if(q.error)return toast(q.error.message,true);toast(remaining?'Остаток добавлен':'Блок добавлен');clientDetail(id,c)};
  document.querySelectorAll('[data-archive-package]').forEach(b=>b.onclick=async()=>{const q=await sb.from('client_packages').update({status:'archived',updated_at:new Date().toISOString()}).eq('id',b.dataset.archivePackage).eq('trainer_id',user.id);if(q.error)return toast(q.error.message,true);clientDetail(id,c)});
  $('deleteClient').onclick=async()=>{if(!confirm('Удалить клиента из активных? История сохранится.'))return;await sb.from('training_programs').update({active:false,updated_at:new Date().toISOString()}).eq('trainer_id',user.id).eq('client_id',id).eq('active',true);const q=await sb.from('trainer_clients').update({status:'archived'}).eq('trainer_id',user.id).eq('client_id',id);if(q.error)return toast(q.error.message,true);trainerClients()};
}

async function trainerLibrary(){
  const ex=await listExercises();
  const categories=['Все',...Array.from(new Set(ex.map(x=>x.category||'Силовые'))).sort((a,b)=>a.localeCompare(b,'ru'))];
  $('main').innerHTML=`<h1>Библиотека упражнений</h1><p class="sub">${ex.length} упражнений · нажми на мышечную группу, чтобы раскрыть список.</p>
  <div class="card">
    <div class="field"><label class="label">Поиск</label><input id="exerciseSearch" class="input" placeholder="Например, ягодичный мост"></div>
    <div class="field"><label class="label">Категория</label><select id="exerciseCategory" class="input">${categories.map(x=>`<option>${esc(x)}</option>`).join('')}</select></div>
  </div>
  <details class="card"><summary><b>Добавить своё упражнение</b></summary>
    <div class="field"><label class="label">Название</label><input id="exName" class="input" placeholder="Болгарские выпады"></div>
    <div class="row"><div class="field"><label class="label">Категория</label><select id="exCategory" class="input">
      <option>Тренажёры</option><option>Свободные веса</option><option>Блоки / кроссовер</option><option>Собственный вес</option><option>MFR</option><option>Mobility</option><option>Другое</option>
    </select></div><div class="field"><label class="label">Оборудование</label><input id="exEquipment" class="input" placeholder="Гантели / ролл"></div></div>
    <div class="field"><label class="label">Мышечная группа</label><input id="exMuscle" class="input" placeholder="Спина / грудь / плечи / бицепс..."></div>
    <div class="field"><label class="label">Подсказки</label><textarea id="exTips" class="input" placeholder="Техника, темп, амплитуда..."></textarea></div>
    <div class="field"><label class="label">Видео</label><input id="exVideo" class="input" type="file" accept="video/*"></div>
    <button id="saveExercise" class="btn primary">Добавить упражнение</button>
  </details>
  <div id="exerciseLibraryList"></div>`;

  const render=()=>{
    const q=$('exerciseSearch').value.trim().toLowerCase(),cat=$('exerciseCategory').value;
    const filtered=ex.filter(x=>(cat==='Все'||(x.category||'Силовые')===cat)&&(!q||`${x.name} ${x.muscle_group||''} ${x.equipment||''}`.toLowerCase().includes(q)));
    const groups=groupExercises(filtered);
    $('exerciseLibraryList').innerHTML=`<div class="section-title">Найдено · ${filtered.length}</div>${groups.length?groups.map(([group,items])=>`<details class="exercise-group" ${q?'open':''}>
      <summary><span>${esc(group)}</span><span class="group-count">${items.length}</span></summary>
      <div class="exercise-group-body">${items.map(x=>`<div class="exercise-item">
        <div class="list-row"><div class="truncate"><b>${esc(x.name)}</b><div class="small muted">${esc(x.muscle_group||'')} · ${esc(x.equipment||'без оборудования')}</div></div><span class="pill">${esc(x.category||'Силовые')}</span></div>
        ${x.technique_tips?`<p class="small muted">${esc(x.technique_tips)}</p>`:''}
        ${x.video_path?`<button class="btn secondary" data-watch="${esc(x.video_path)}">Смотреть видео</button>`:''}
        <button class="btn secondary" data-upload-video="${x.id}">${x.video_path?'Заменить видео':'Добавить видео техники'}</button>
        <button class="btn danger" data-delete-exercise="${x.id}">Удалить упражнение</button>
      </div>`).join('')}</div>
    </details>`).join(''):'<div class="empty">По фильтру ничего не найдено.</div>'}`;
    document.querySelectorAll('[data-watch]').forEach(b=>b.onclick=()=>openSignedVideo(b.dataset.watch));
    document.querySelectorAll('[data-upload-video]').forEach(b=>b.onclick=()=>uploadExerciseVideo(b.dataset.uploadVideo,ex));
    document.querySelectorAll('[data-delete-exercise]').forEach(b=>b.onclick=async()=>{
      const id=b.dataset.deleteExercise,x=ex.find(e=>e.id===id);
      if(!confirm(`Удалить упражнение «${x?.name||'Упражнение'}»? Оно исчезнет из библиотеки и программ, но история выполненных подходов сохранится.`))return;
      const pe=await sb.from('program_exercises').delete().eq('exercise_id',id);if(pe.error)return toast(pe.error.message,true);
      const q=await sb.from('exercises').update({archived:true,video_path:null,updated_at:new Date().toISOString()}).eq('id',id).eq('trainer_id',user.id);
      if(q.error)return toast(q.error.message,true);
      if(x?.video_path)await sb.storage.from('exercise-videos').remove([x.video_path]);
      toast('Упражнение удалено');trainerLibrary();
    });
  };
  $('exerciseSearch').oninput=render;$('exerciseCategory').onchange=render;

  $('saveExercise').onclick=async()=>{
    const name=$('exName').value.trim();if(!name)return toast('Введите название',true);
    let path=null;const f=$('exVideo').files[0];
    if(f){const ext=(f.name.split('.').pop()||'mp4').toLowerCase();path=`${user.id}/${uuid()}.${ext}`;const u=await sb.storage.from('exercise-videos').upload(path,f,{contentType:f.type||'video/mp4'});if(u.error)return toast(u.error.message,true)}
    const q=await sb.from('exercises').insert({trainer_id:user.id,name,muscle_group:$('exMuscle').value.trim(),technique_tips:$('exTips').value.trim(),video_path:path,archived:false,category:$('exCategory').value,equipment:$('exEquipment').value.trim()||null,is_system:false});
    if(q.error){if(path)await sb.storage.from('exercise-videos').remove([path]);return toast(q.error.message,true)}
    toast('Упражнение добавлено');trainerLibrary();
  };
  render();
}
async function uploadExerciseVideo(id,ex){
  const item=ex.find(x=>x.id===id);if(!item)return;
  const input=document.createElement('input');input.type='file';input.accept='video/*';
  input.onchange=async()=>{
    const f=input.files?.[0];if(!f)return;
    const ext=(f.name.split('.').pop()||'mp4').toLowerCase(),path=`${user.id}/${uuid()}.${ext}`;
    toast('Загружаю видео...');
    const u=await sb.storage.from('exercise-videos').upload(path,f,{contentType:f.type||'video/mp4'});
    if(u.error)return toast(u.error.message,true);
    const q=await sb.from('exercises').update({video_path:path,updated_at:new Date().toISOString()}).eq('id',id).eq('trainer_id',user.id);
    if(q.error){await sb.storage.from('exercise-videos').remove([path]);return toast(q.error.message,true)}
    if(item.video_path)await sb.storage.from('exercise-videos').remove([item.video_path]);
    toast('Видео сохранено');trainerLibrary();
  };
  input.click();
}

async function getProgramTemplates(){
  const {data,error}=await sb.from('program_templates').select('*,template_exercises(*,exercises(name))').eq('trainer_id',user.id).order('created_at');if(error)throw error;return data||[];
}
async function assignTemplate(templateId,clientId,stayOnClient=false,scheduledDate=null,dayLabel=''){
  if(!clientId)return toast('Сначала выбери клиента',true);
  const {data:t,error}=await sb.from('program_templates').select('*,template_exercises(*)').eq('id',templateId).eq('trainer_id',user.id).single();if(error)return toast(error.message,true);
  const created=await sb.from('training_programs').insert({trainer_id:user.id,client_id:clientId,name:t.name,description:t.description,active:true,source_kind:'template',source_template_id:t.id}).select('id').single();if(created.error)return toast(created.error.message,true);
  const rows=(t.template_exercises||[]).map(x=>({program_id:created.data.id,exercise_id:x.exercise_id,day_label:x.day_label,sort_order:x.sort_order,target_sets:x.target_sets,target_reps:x.target_reps,target_rpe:x.target_rpe,notes:x.notes}));
  if(rows.length){const q=await sb.from('program_exercises').insert(rows);if(q.error)return toast(q.error.message,true)}
  if(scheduledDate){const ok=await createAssignedWorkout({clientId,programId:created.data.id,programName:t.name,scheduledDate,dayLabel});if(!ok)return}else toast('Шаблон назначен клиенту');
  if(stayOnClient){const clients=await getTrainerClients();const c=clients.find(x=>x.id===clientId);if(c)return clientDetail(clientId,c)}
  trainerPrograms();
}
async function trainerPrograms(){
  const [clients,ex,templates]=await Promise.all([getTrainerClients(),listExercises(),getProgramTemplates()]);
  if(!clients.length){$('main').innerHTML='<h1>Программы</h1><div class="empty">Сначала добавь клиента по коду.</div>';return}
  const {data:programs,error}=await sb.from('training_programs').select('*').eq('trainer_id',user.id).order('created_at',{ascending:false});if(error)throw error;
  $('main').innerHTML=`<h1>Программы</h1><p class="sub">Создавай программы и отдельные шаблоны, которые потом можно назначать любому клиенту.</p>${programBuilder(clients,ex)}<div class="section-title">Шаблоны тренировок</div><button id="newTemplate" class="btn primary">＋ Добавить шаблон тренировки</button><div id="templateEditor"></div><div class="template-grid">${templates.length?templates.map(t=>`<div class="card template-card"><div class="list-row"><div><b>${esc(t.name)}</b><div class="small muted">${esc(t.description||'Шаблон программы')}</div></div><span class="pill">${t.template_exercises?.length||0} упр.</span></div><button class="btn secondary" data-edit-template="${t.id}">Редактировать шаблон</button><button class="btn primary" data-use-template="${t.id}">Назначить выбранному клиенту</button><button class="btn danger" data-delete-template="${t.id}">Удалить шаблон</button></div>`).join(''):'<div class="empty">Шаблонов пока нет. Нажми «Добавить шаблон тренировки».</div>'}</div><div class="section-title">Созданные программы</div>${programs?.length?programs.map(p=>`<button class="client-btn" data-program="${p.id}"><div class="list-row"><div><b>${esc(p.name)}</b><div class="small muted">${esc(clients.find(c=>c.id===p.client_id)?.full_name||'Клиент')}</div></div><span class="pill">${p.active?'Активна':'Архив'}</span></div></button>`).join(''):'<div class="empty">Программ пока нет.</div>'}<div id="programEditor"></div>`;
  bindProgramBuilder(false);
  $('newTemplate').onclick=()=>newTemplateForm(ex);
  document.querySelectorAll('[data-program]').forEach(b=>b.onclick=()=>openProgramEditor(b.dataset.program,ex));
  document.querySelectorAll('[data-edit-template]').forEach(b=>b.onclick=()=>openTemplateEditor(b.dataset.editTemplate,ex));
  document.querySelectorAll('[data-use-template]').forEach(b=>b.onclick=()=>assignTemplate(b.dataset.useTemplate,$('programClient').value,false,$('programAssignDate').value,''));
  document.querySelectorAll('[data-delete-template]').forEach(b=>b.onclick=async()=>{if(!confirm('Удалить шаблон? Уже назначенные клиентам программы останутся.'))return;const q=await sb.from('program_templates').delete().eq('id',b.dataset.deleteTemplate).eq('trainer_id',user.id);if(q.error)return toast(q.error.message,true);toast('Шаблон удалён');trainerPrograms()});
}

function newTemplateForm(ex){
  $('templateEditor').innerHTML=`<div class="card template-create-card"><b>Новый шаблон тренировки</b><div class="field"><label class="label">Название</label><input id="templateName" class="input" placeholder="Например: Ноги + плечи"></div><div class="field"><label class="label">Описание</label><input id="templateDesc" class="input" placeholder="Для кого и какая цель"></div><button id="createTemplate" class="btn primary">Создать и добавить упражнения</button></div>`;
  $('templateEditor').scrollIntoView({behavior:'smooth',block:'start'});
  $('createTemplate').onclick=async()=>{const name=$('templateName').value.trim();if(!name)return toast('Введите название шаблона',true);const q=await sb.from('program_templates').insert({trainer_id:user.id,name,description:$('templateDesc').value.trim()}).select('id').single();if(q.error)return toast(q.error.message,true);toast('Шаблон создан');openTemplateEditor(q.data.id,ex)};
}

async function openTemplateEditor(templateId,ex){
  const [tQ,iQ]=await Promise.all([
    sb.from('program_templates').select('*').eq('id',templateId).eq('trainer_id',user.id).single(),
    sb.from('template_exercises').select('*,exercises(name,category,equipment)').eq('template_id',templateId).order('sort_order')
  ]);if(tQ.error)throw tQ.error;if(iQ.error)throw iQ.error;const t=tQ.data,items=iQ.data||[];
  const cats=['Все',...Array.from(new Set(ex.map(x=>x.category||'Силовые'))).sort((a,b)=>a.localeCompare(b,'ru'))];
  $('templateEditor').innerHTML=`<div class="card template-editor-card"><div class="list-row"><div><b>${esc(t.name)}</b><div class="small muted">${esc(t.description||'Шаблон тренировки')}</div></div><span class="pill">${items.length} упр.</span></div><div class="row"><div class="field"><label class="label">Категория</label><select id="teCategory" class="input">${cats.map(x=>`<option>${esc(x)}</option>`).join('')}</select></div><div class="field"><label class="label">Поиск</label><input id="teSearch" class="input" placeholder="Найти упражнение"></div></div><input id="teExercise" type="hidden"><label class="label">Выбери упражнение</label><div id="teExerciseGroups"></div><div id="teSelectedExercise" class="selected-exercise hidden"></div><div class="field"><label class="label">День / блок</label><input id="teDay" class="input" placeholder="Тренировка 1"></div><div class="row"><div class="field"><label class="label">Подходы</label><input id="teSets" class="input" inputmode="numeric" value="3"></div><div class="field"><label class="label">Повторы / время</label><input id="teReps" class="input" value="10–12"></div></div><div class="field"><label class="label">RPE</label><input id="teRpe" class="input" inputmode="decimal" placeholder="8"></div><div class="field"><label class="label">Комментарий</label><input id="teNotes" class="input" placeholder="Темп, техника, амплитуда..."></div><button id="addTemplateExercise" class="btn primary">Добавить упражнение в шаблон</button><div class="section-title">Упражнения шаблона</div>${items.length?items.map(i=>`<div class="template-exercise-row"><div><b>${esc(i.exercises?.name||'Упражнение')}</b><div class="small muted">${esc(i.day_label||'Тренировка')} · <b>${i.target_sets||1} подхода</b> · ${esc(i.target_reps||'—')}${i.target_rpe?` · RPE ${i.target_rpe}`:''}</div></div><div class="set-stepper"><button class="step-btn" data-template-set="${i.id}|-1|${i.target_sets||1}">−</button><span>${i.target_sets||1}</span><button class="step-btn" data-template-set="${i.id}|1|${i.target_sets||1}">＋</button><button class="btn inline danger" data-remove-template-exercise="${i.id}">Удалить</button></div></div>`).join(''):'<div class="empty">Добавь первое упражнение.</div>'}<button id="finishTemplateEdit" class="btn secondary">Готово</button></div>`;
  let selectedId='';
  const pick=(id)=>{const x=ex.find(v=>v.id===id);if(!x)return;selectedId=id;$('teExercise').value=id;$('teSelectedExercise').classList.remove('hidden');$('teSelectedExercise').innerHTML=`<div class="small muted">ВЫБРАНО</div><b>${esc(x.name)}</b><div class="small muted">${esc(exerciseGroup(x))} · ${esc(x.category||'Силовые')}</div>`;document.querySelectorAll('[data-te-pick]').forEach(b=>b.classList.toggle('selected',b.dataset.tePick===id));if(x.category==='MFR'){$('teSets').value='1';$('teReps').value='60 сек';$('teRpe').value=''}else if(x.category==='Mobility'){$('teSets').value='1';$('teReps').value='10–15 мин';$('teRpe').value=''}};
  const refresh=()=>{const cat=$('teCategory').value,q=$('teSearch').value.trim().toLowerCase();const filtered=ex.filter(x=>(cat==='Все'||(x.category||'Силовые')===cat)&&(!q||`${x.name} ${x.muscle_group||''} ${x.equipment||''}`.toLowerCase().includes(q)));const groups=groupExercises(filtered);$('teExerciseGroups').innerHTML=groups.length?groups.map(([group,rows])=>`<details class="exercise-group compact" ${q?'open':''}><summary><span>${esc(group)}</span><span class="group-count">${rows.length}</span></summary><div class="exercise-choice-list">${rows.map(x=>`<button type="button" class="exercise-choice ${selectedId===x.id?'selected':''}" data-te-pick="${x.id}"><span>${esc(x.name)}</span><small>${esc(x.category||'Силовые')} · ${esc(x.equipment||'без оборудования')}</small></button>`).join('')}</div></details>`).join(''):'<div class="empty">Ничего не найдено.</div>';document.querySelectorAll('[data-te-pick]').forEach(b=>b.onclick=()=>pick(b.dataset.tePick))};
  $('teCategory').onchange=refresh;$('teSearch').oninput=refresh;refresh();
  $('addTemplateExercise').onclick=async()=>{if(!selectedId)return toast('Выбери упражнение',true);const sets=n($('teSets').value),rpe=n($('teRpe').value);if(sets==null||!Number.isInteger(sets)||sets<=0)return toast('Подходы должны быть целым числом больше 0',true);if(rpe!=null&&!inRange(rpe,1,10))return toast('RPE должен быть от 1 до 10',true);const q=await sb.from('template_exercises').insert({template_id:templateId,exercise_id:selectedId,day_label:$('teDay').value.trim()||'Тренировка',sort_order:items.length+1,target_sets:sets,target_reps:$('teReps').value.trim()||'10–12',target_rpe:rpe,notes:$('teNotes').value.trim()});if(q.error)return toast(q.error.message,true);toast('Упражнение добавлено');openTemplateEditor(templateId,ex)};
  document.querySelectorAll('[data-template-set]').forEach(b=>b.onclick=async()=>{const [row,delta,current]=b.dataset.templateSet.split('|');const next=Math.max(1,Number(current)+Number(delta));const q=await sb.from('template_exercises').update({target_sets:next}).eq('id',row);if(q.error)return toast(q.error.message,true);openTemplateEditor(templateId,ex)});
  document.querySelectorAll('[data-remove-template-exercise]').forEach(b=>b.onclick=async()=>{const q=await sb.from('template_exercises').delete().eq('id',b.dataset.removeTemplateExercise);if(q.error)return toast(q.error.message,true);toast('Упражнение удалено');openTemplateEditor(templateId,ex)});
  $('finishTemplateEdit').onclick=()=>trainerPrograms();
  $('templateEditor').scrollIntoView({behavior:'smooth',block:'start'});
}

function programBuilder(clients,ex){return `<div class="card"><label class="label">Клиент</label><select id="programClient" class="input">${clients.map(c=>`<option value="${c.id}">${esc(c.full_name||'Клиент')}</option>`).join('')}</select><div class="field"><label class="label">Дата быстрого назначения шаблона</label><input id="programAssignDate" class="input" type="date" value="${localDateKey()}"></div><div class="field"><label class="label">Название программы</label><input id="programName" class="input" placeholder="Блок 1 · Гипертрофия"></div><div class="field"><label class="label">Описание</label><input id="programDesc" class="input" placeholder="2–3 тренировки в неделю"></div><button id="createProgram" class="btn primary">Создать программу</button></div>`}
function bindProgramBuilder(isDemo){$('createProgram').onclick=async()=>{const name=$('programName').value.trim();if(!name)return toast('Введите название',true);if(isDemo)return toast('Программа создана в демо');const {error}=await sb.from('training_programs').insert({trainer_id:user.id,client_id:$('programClient').value,name,description:$('programDesc').value.trim(),active:true});if(error)return toast(error.message,true);toast('Программа создана');trainerPrograms()}}
async function openProgramEditor(programId,ex){
  const [itemsQ,programQ]=await Promise.all([sb.from('program_exercises').select('*,exercises(name,category,equipment)').eq('program_id',programId).order('sort_order'),sb.from('training_programs').select('id,name,description,client_id').eq('id',programId).eq('trainer_id',user.id).single()]);
  if(itemsQ.error)throw itemsQ.error;if(programQ.error)throw programQ.error;const items=itemsQ.data||[],program=programQ.data;
  const cats=['Все',...Array.from(new Set(ex.map(x=>x.category||'Силовые'))).sort((a,b)=>a.localeCompare(b,'ru'))];
  const days=[...new Set(items.map(x=>x.day_label).filter(Boolean))];
  $('programEditor').innerHTML=`<div class="section-title">Назначить эту программу</div><div class="card"><div class="list-row"><div><b>${esc(program.name)}</b><div class="small muted">Выбери дату и конкретную тренировку программы.</div></div><span class="pill">назначение</span></div><div class="row"><div class="field"><label class="label">Тренировка / день</label><select id="editorAssignDay" class="input"><option value="">Все упражнения</option>${days.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join('')}</select></div><div class="field"><label class="label">Дата</label><input id="editorAssignDate" class="input" type="date" value="${localDateKey()}"></div></div><button id="editorAssignProgram" class="btn primary">Назначить на дату</button></div><div class="section-title">Редактор</div><div class="card">${ex.length?`
    <div class="row"><div class="field"><label class="label">Категория</label><select id="peCategory" class="input">${cats.map(x=>`<option>${esc(x)}</option>`).join('')}</select></div>
    <div class="field"><label class="label">Поиск</label><input id="peSearch" class="input" placeholder="Найти упражнение"></div></div>
    <label class="label">Выбери мышечную группу</label><input id="peExercise" type="hidden"><div id="peExerciseGroups"></div>
    <div id="peSelectedExercise" class="selected-exercise hidden"></div>
    <div class="field"><label class="label">День / блок</label><input id="peDay" class="input" placeholder="День A · Разминка / Силовая / Заминка"></div>
    <div class="row"><div class="field"><label class="label">Подходы</label><input id="peSets" class="input" inputmode="numeric" value="3"></div><div class="field"><label class="label">Повторы / время</label><input id="peReps" class="input" value="10" placeholder="10–12 / 60 сек / 5 дыханий"></div></div>
    <div class="row"><div class="field"><label class="label">Вес, кг</label><input id="peWeight" class="input" inputmode="decimal"></div><div class="field"><label class="label">RPE</label><input id="peRpe" class="input" inputmode="decimal"></div></div>
    <div class="field"><label class="label">Комментарий</label><input id="peNotes" class="input" placeholder="Темп, сторона, амплитуда..."></div>
    <button id="addProgramExercise" class="btn primary">Добавить в программу</button>`:'<div class="empty">В библиотеке пока нет упражнений.</div>'}
    ${(items||[]).map(i=>`<div class="list program-exercise-edit-row"><div class="list-row"><div><b>${esc(i.exercises?.name||'Упражнение')}</b><div class="small muted">${esc(i.day_label||'Тренировка')} · <b>${i.target_sets||1} подхода</b> · ${esc(i.target_reps||'—')}</div></div><span class="pill">${esc(i.exercises?.category||'Силовые')}</span></div><div class="set-stepper"><button class="step-btn" data-program-set="${i.id}|-1|${i.target_sets||1}">−</button><span>${i.target_sets||1}</span><button class="step-btn" data-program-set="${i.id}|1|${i.target_sets||1}">＋</button></div></div>`).join('')}
    <button id="saveAsTemplate" class="btn secondary">Сохранить как шаблон</button><button id="deleteProgram" class="btn danger">Удалить программу</button><div class="small muted">Выполненные тренировки сохранятся в истории.</div></div>`;

  $('editorAssignProgram').onclick=async()=>{const ok=await createAssignedWorkout({clientId:program.client_id,programId:program.id,programName:program.name,scheduledDate:$('editorAssignDate').value,dayLabel:$('editorAssignDay').value});if(ok)toast('Программа назначена клиенту')};
  if($('peExercise')){
    let selectedId='';
    const applyExerciseDefaults=(id)=>{
      const x=ex.find(v=>v.id===id);if(!x)return;
      selectedId=id;$('peExercise').value=id;
      $('peSelectedExercise').classList.remove('hidden');
      $('peSelectedExercise').innerHTML=`<div class="small muted">ВЫБРАНО</div><b>${esc(x.name)}</b><div class="small muted">${esc(exerciseGroup(x))} · ${esc(x.category||'Силовые')} · ${esc(x.equipment||'без оборудования')}</div>`;
      document.querySelectorAll('[data-pick-exercise]').forEach(b=>b.classList.toggle('selected',b.dataset.pickExercise===id));
      if(x.category==='MFR'){$('peSets').value='1';$('peReps').value='60 сек';$('peWeight').value='';$('peRpe').value='';}
      else if(x.category==='Mobility'){$('peSets').value='1';$('peReps').value='10–15 мин';$('peWeight').value='';$('peRpe').value='';}
    };
    const refresh=()=>{
      const cat=$('peCategory').value,q=$('peSearch').value.trim().toLowerCase();
      const filtered=ex.filter(x=>(cat==='Все'||(x.category||'Силовые')===cat)&&(!q||`${x.name} ${x.muscle_group||''} ${x.equipment||''}`.toLowerCase().includes(q)));
      const groups=groupExercises(filtered);
      $('peExerciseGroups').innerHTML=groups.length?groups.map(([group,rows])=>`<details class="exercise-group compact" ${q?'open':''}><summary><span>${esc(group)}</span><span class="group-count">${rows.length}</span></summary><div class="exercise-choice-list">${rows.map(x=>`<button type="button" class="exercise-choice ${selectedId===x.id?'selected':''}" data-pick-exercise="${x.id}"><span>${esc(x.name)}</span><small>${esc(x.category||'Силовые')} · ${esc(x.equipment||'без оборудования')}</small></button>`).join('')}</div></details>`).join(''):'<div class="empty">Ничего не найдено.</div>';
      document.querySelectorAll('[data-pick-exercise]').forEach(b=>b.onclick=()=>applyExerciseDefaults(b.dataset.pickExercise));
    };
    $('peCategory').onchange=refresh;$('peSearch').oninput=refresh;refresh();

    $('addProgramExercise').onclick=async()=>{
      if(!selectedId)return toast('Сначала выбери мышечную группу и упражнение',true);
      const sets=n($('peSets').value),weight=n($('peWeight').value),rpe=n($('peRpe').value);
      if(sets==null||!Number.isInteger(sets)||sets<=0)return toast('Подходы должны быть целым числом больше 0',true);
      if(weight!=null&&!inRange(weight,0))return toast('Вес не может быть отрицательным',true);
      if(rpe!=null&&!inRange(rpe,1,10))return toast('RPE должен быть от 1 до 10',true);
      const {error:e}=await sb.from('program_exercises').insert({program_id:programId,exercise_id:selectedId,day_label:$('peDay').value.trim()||'Тренировка',target_sets:sets,target_reps:$('peReps').value.trim()||'10',target_weight:weight,target_rpe:rpe,notes:$('peNotes').value.trim(),sort_order:(items?.length||0)+1});
      if(e)return toast(e.message,true);toast('Добавлено в программу');openProgramEditor(programId,ex);
    };
  }
  document.querySelectorAll('[data-program-set]').forEach(b=>b.onclick=async()=>{const [row,delta,current]=b.dataset.programSet.split('|');const next=Math.max(1,Number(current)+Number(delta));const q=await sb.from('program_exercises').update({target_sets:next}).eq('id',row);if(q.error)return toast(q.error.message,true);openProgramEditor(programId,ex)});
  if($('saveAsTemplate')) $('saveAsTemplate').onclick=async()=>{const templateName=prompt('Название шаблона');if(!templateName?.trim())return;const pQ=await sb.from('training_programs').select('name,description').eq('id',programId).eq('trainer_id',user.id).single();if(pQ.error)return toast(pQ.error.message,true);const tQ=await sb.from('program_templates').insert({trainer_id:user.id,name:templateName.trim(),description:pQ.data.description||pQ.data.name}).select('id').single();if(tQ.error)return toast(tQ.error.message,true);const rows=(items||[]).map(x=>({template_id:tQ.data.id,exercise_id:x.exercise_id,day_label:x.day_label,sort_order:x.sort_order,target_sets:x.target_sets,target_reps:x.target_reps,target_rpe:x.target_rpe,notes:x.notes}));if(rows.length){const q=await sb.from('template_exercises').insert(rows);if(q.error)return toast(q.error.message,true)}toast('Шаблон сохранён');trainerPrograms()};
  $('deleteProgram').onclick=async()=>{if(!confirm('Удалить программу? Выполненные тренировки и результаты клиента останутся в истории.'))return;const q=await sb.from('training_programs').delete().eq('id',programId).eq('trainer_id',user.id);if(q.error)return toast(q.error.message,true);toast('Программа удалена');trainerPrograms()};
}

sb.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT')showAuth()});
init().catch(e=>{console.error(e);toast(e.message||'Ошибка запуска',true);showAuth()});
})();
