const KILL_VERSION='denisfit-cache-reset-2026-08-21';
self.addEventListener('install',event=>{event.waitUntil(self.skipWaiting())});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.map(key=>caches.delete(key)));
    await self.clients.claim();
    await self.registration.unregister();
    const clientsList=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of clientsList){try{client.postMessage({type:'DENISFIT_CACHE_RESET',version:KILL_VERSION})}catch{}}
  })());
});
self.addEventListener('fetch',()=>{});
