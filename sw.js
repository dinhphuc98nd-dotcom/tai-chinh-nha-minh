// Tài chính nhà mình · service worker cho bản web/iPhone: tải sẵn toàn bộ app để mở được khi mất mạng.
// Đổi CACHE mỗi lần phát hành để máy tải bản mới.
const CACHE = 'tcnm-web-1.4';
const SHELL = [
  './',
  './index.html',
  './support.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './react.production.min.js',
  './react-dom.production.min.js',
  './supabase.js',
  './archivo-latin.woff2',
  './archivo-latin-ext.woff2',
  './archivo-vietnamese.woff2',
  './styles.css',
  './ds_bundle.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// File của app: dùng bản đã lưu ngay (mở nhanh, chạy offline) rồi cập nhật ngầm.
// Dữ liệu sổ (Supabase) và thư viện bên ngoài: luôn đi thẳng ra mạng.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => { if (res && res.ok) c.put(req, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const res = await net;
    return res || (req.mode === 'navigate' ? c.match('./index.html') : Response.error());
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./')));
});
