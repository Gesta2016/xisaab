const C='xisaab-v4',F=['./','index.html','manifest.json','icon.svg'];
self.addEventListener('install',e=>{
 e.waitUntil(caches.open(C).then(c=>Promise.all(F.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
 e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
 const r=e.request;
 if(r.method!=='GET'||!r.url.startsWith(self.location.origin))return;
 e.respondWith((async()=>{
  const c=await caches.open(C);
  const hit=await c.match(r,{ignoreSearch:true});
  const path=new URL(r.url).pathname;
  const isDoc=r.mode==='navigate'||/\/$|index\.html$/.test(path);
  const net=fetch(r).then(async res=>{
   if(res&&res.ok){
    if(isDoc){
     const fresh=await res.clone().text();
     const old=hit?await hit.clone().text():null;
     if(fresh!==old){
      const b=self.registration.scope;
      for(const u of [r.url,b,b+'index.html'])await c.put(u,res.clone());
      if(old!==null)(await self.clients.matchAll()).forEach(cl=>cl.postMessage({type:'updated'}));
     }
    }else await c.put(r,res.clone());
   }
   return res;
  }).catch(()=>null);
  if(hit){e.waitUntil(net);return hit}
  return (await net)||(await c.match('index.html'))||Response.error();
 })());
});
