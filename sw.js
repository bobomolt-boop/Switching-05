const CACHE_NAME = 'mpf-app-v7-network-first';
const urlsToCache = [
  '/',
  '/index.html',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// 安裝 Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
  // 立即激活新的 Service Worker
  self.skipWaiting();
});

// 攔截請求 - 使用 Network First 策略
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // 對於 JS 文件和圖片，使用 Network First 策略
  if (url.pathname.endsWith('.js') || url.pathname.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 如果網絡請求成功，更新緩存
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // 如果網絡失敗，使用緩存
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // 對於其他請求，使用 Cache First 策略
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// 更新 Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 立即控制所有客戶端
  self.clients.claim();
});