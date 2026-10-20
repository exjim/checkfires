const V='checkfires-v3';
const CORE=['./','index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request,u=new URL(req.url);
  if(req.method!=='GET')return;
  // 서버 연결(Firebase) 요청과 예약 경로는 캐시하지 않고 그대로 통과
  if(u.pathname.startsWith('/__/')||(u.origin!==location.origin&&!/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)))return;
  // 앱 본체는 네트워크 우선(배포 즉시 반영), 오프라인이면 캐시
  if(req.mode==='navigate'||u.pathname.endsWith('/index.html')||u.pathname.endsWith('/sw.js')){
    e.respondWith(fetch(req).then(r=>{if(r&&r.ok){const c=r.clone();caches.open(V).then(x=>x.put(req,c))}return r}).catch(()=>caches.match(req).then(h=>h||caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{
    if(r&&r.ok&&(r.type==='basic'||/fonts\.(googleapis|gstatic)\.com/.test(req.url))){const c=r.clone();caches.open(V).then(x=>x.put(req,c))}
    return r;
  }).catch(()=>caches.match('index.html'))));
});
