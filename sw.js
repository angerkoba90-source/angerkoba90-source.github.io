const CACHE='denisfit-v19.8.0';
const SHELL=[
  '/',
  '/styles.css?v=18.2.0',
  '/enhancements-v174.css?v=18.2.0',
  '/online-v180.css?v=18.2.0',
  '/online-v181.css?v=18.2.0',
  '/design-v182.css?v=18.2.0',
  '/schedule-collapse-v183.css?v=18.3.0',
  '/schedule-week-v184.css?v=18.4.0',
  '/program-template-v186.css?v=18.6.0',
  '/trainer-diary-v187.css?v=18.7.0',
  '/client-workflow-v192.css?v=19.2.0',
  '/app.js?v=18.2.0',
  '/enhancements-v174.js?v=18.2.0',
  '/online-v180.js?v=18.2.0',
  '/online-v181.js?v=18.2.0',
  '/library-v182.js?v=18.2.0',
  '/manual-exercises-v185.js?v=18.9.0',
  '/program-template-v186.js?v=18.6.0',
  '/trainer-diary-v188.js?v=18.8.0',
  '/trainer-progress-v190.js?v=19.0.0',
  '/client-workflow-v192.js?v=19.2.0',
  '/schedule-collapse-v183.js?v=18.3.0',
  '/schedule-week-v185.js?v=18.5.0',
  '/vendor/supabase.min.js?v=18.2.0',
  '/manifest.webmanifest?v=18.2.0',
  '/assets/hero-main.jpg?v=18.2.0',
  '/assets/hero-coach.png?v=18.2.0',
  '/assets/icon-192.png?v=18.2.0'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('denisfit-v')&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
    const list=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of list){
      try{const u=new URL(client.url);if(u.origin===self.location.origin&&!u.pathname.startsWith('/journal/'))await client.navigate(client.url)}catch{}
    }
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname.startsWith('/journal/'))return;
  if(url.pathname.startsWith('/workout-journal-v2/')){
    if(event.request.mode==='navigate')event.respondWith(Promise.resolve(Response.redirect(new URL('/journal/',self.location.origin).href,302)));
    return;
  }
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>caches.match('/')));
    return;
  }
  const liveAsset=/\.(?:js|css)$/i.test(url.pathname);
  if(liveAsset){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy)).catch(()=>{})}
      return response;
    }).catch(()=>caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy)).catch(()=>{})}
    return response;
  })));
});

self.addEventListener('push',event=>{
  let data={};try{data=event.data?event.data.json():{}}catch{data={body:event.data?.text()||''}}
  event.waitUntil(self.registration.showNotification(data.title||'DenisFit',{body:data.body||'',tag:data.tag||'denisfit',icon:'/assets/icon-192.png',badge:'/assets/icon-192.png',data:{url:data.url||'/'}}));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();const target=new URL(event.notification.data?.url||'/',self.location.origin).href;
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const client of list){if('focus' in client){client.navigate(target);return client.focus()}}return clients.openWindow?clients.openWindow(target):null}));
});
