const CACHE='denisfit-journal-v1.1.1';
const ROOT='/workout-journal-v2/';
const SHELL=[
  ROOT,
  `${ROOT}index.html`,
  `${ROOT}week-calendar-v8.css?v=8`,
  `${ROOT}workout-editor-v4.js?v=7`,
  `${ROOT}manual-exercises-v9.js?v=9.1`,
  `${ROOT}compact-template-v11.js?v=11`,
  `${ROOT}bootstrap.js?v=1`
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('denisfit-journal-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

async function renderDiary(request){
  const response=await fetch(request,{cache:'no-store'});
  if(!response.ok)return response;
  let html=await response.text();
  if(!html.includes('week-calendar-v8.css?v=8'))html=html.replace('</head>','<link rel="stylesheet" href="/workout-journal-v2/week-calendar-v8.css?v=8"></head>');
  if(!html.includes('workout-editor-v4.js?v=7'))html=html.replace('</body>','<script src="/workout-journal-v2/workout-editor-v4.js?v=7"></script></body>');
  if(!html.includes('manual-exercises-v9.js?v=9.1'))html=html.replace('</body>','<script src="/workout-journal-v2/manual-exercises-v9.js?v=9.1"></script></body>');
  if(!html.includes('compact-template-v11.js?v=11'))html=html.replace('</body>','<script src="/workout-journal-v2/compact-template-v11.js?v=11"></script></body>');
  if(!html.includes('bootstrap.js?v=1'))html=html.replace('</body>','<script src="/workout-journal-v2/bootstrap.js?v=1"></script></body>');
  const headers=new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control','no-store');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(renderDiary(event.request).catch(()=>caches.match(ROOT)));
    return;
  }
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{})}
    return response;
  })));
});
