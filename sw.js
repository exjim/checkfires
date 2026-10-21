// 소방점검 폰 앱: 앱 껍데기만 캐시한다. 데이터는 Firestore 로컬 캐시가 맡는다.
const V = 'fire-app-v8';
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(['/', '/manifest.webmanifest', '/icons/icon-192.png'])).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== V).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET') return;
  if (u.origin === location.origin && (u.pathname.startsWith('/api/') || u.pathname.startsWith('/__/') || u.pathname === '/admin' || u.pathname.startsWith('/admin/'))) return;
  const sdk = u.hostname === 'www.gstatic.com' && u.pathname.startsWith('/firebasejs/');
  const font = /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (u.origin !== location.origin && !sdk && !font) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { if (r.ok && u.pathname === '/') { const c = r.clone(); caches.open(V).then((x) => x.put('/', c)); } return r; }).catch(() => caches.match('/')));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(V).then((x) => x.put(req, c)); } return r; })));
});
