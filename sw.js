const CACHE='denisfit-v18.2.2';
const SHELL=[
  '/',
  '/styles.css?v=18.2.0',
  '/enhancements-v174.css?v=18.2.0',
  '/online-v180.css?v=18.2.0',
  '/online-v181.css?v=18.2.0',
  '/design-v182.css?v=18.2.0',
  '/app.js?v=18.2.0',
  '/enhancements-v174.js?v=18.2.0',
  '/online-v180.js?v=18.2.0',
  '/online-v181.js?v=18.2.0',
  '/library-v182.js?v=18.2.0',
  '/vendor/supabase.min.js?v=18.2.0',
  '/manifest.webmanifest?v=18.2.0',
  '/assets/hero-main.jpg?v=18.2.0',
  '/assets/hero-coach.png?v=18.2.0',
  '/assets/icon-192.png?v=18.2.0'
];

self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});

async function injectWorkoutEditor(request){
  const response=await fetch(request,{cache:'no-store'});
  if(!response.ok)return response;
  let html=await response.text();
  if(!html.includes('workout-editor-v4.js?v=5'))html=html.replace('</body>','<script src="/workout-journal-v2/workout-editor-v4.js?v=5"></script></body>');
  const headers=new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control','no-store');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    if(url.pathname==='/workout-journal-v2/'||url.pathname==='/workout-journal-v2/index.html'){
      event.respondWith(injectWorkoutEditor(event.request).catch(()=>fetch(event.request,{cache:'no-store'})));
      return;
    }
    event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>caches.match('/')));return;
  }
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{})}return response})))
});
self.addEventListener('push',event=>{let data={};try{data=event.data?event.data.json():{}}catch{data={body:event.data?.text()||''}}event.waitUntil(self.registration.showNotification(data.title||'DenisFit',{body:data.body||'',tag:data.tag||'denisfit',icon:'/assets/icon-192.png',badge:'/assets/icon-192.png',data:{url:data.url||'/'}}))});
self.addEventListener('notificationclick',event=>{event.notification.close();const target=new URL(event.notification.data?.url||'/',self.location.origin).href;event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const client of list){if('focus' in client){client.navigate(target);return client.focus()}}return clients.openWindow?clients.openWindow(target):null}))});
