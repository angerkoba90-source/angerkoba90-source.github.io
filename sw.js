const CACHE='denisfit-v17.2.0';
const SHELL=[
  '/',
  '/styles.css?v=17.2.0',
  '/app.js?v=17.2.0',
  '/vendor/supabase.min.js?v=17.2.0',
  '/manifest.webmanifest?v=17.2.0',
  '/assets/hero-main.jpg?v=17.2.0',
  '/assets/hero-coach.png?v=17.2.0',
  '/assets/icon-192.png?v=17.2.0'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>caches.match('/')));
    return;
  }
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{})}
    return response;
  })));
});

self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?event.data.json():{}}catch{data={body:event.data?.text()||''}}
  event.waitUntil(self.registration.showNotification(data.title||'DenisFit',{
    body:data.body||'',
    tag:data.tag||'denisfit',
    icon:'/assets/icon-192.png',
    badge:'/assets/icon-192.png',
    data:{url:data.url||'/'}
  }));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=new URL(event.notification.data?.url||'/',self.location.origin).href;
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const client of list){if('focus' in client){client.navigate(target);return client.focus()}}
    return clients.openWindow?clients.openWindow(target):null;
  }));
});
