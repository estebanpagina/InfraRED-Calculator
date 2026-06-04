const CACHE_NAME = 'infrared-cache-v2'; // Cambiado a v2 para forzar la actualización de caché
const assets = [
  './',
  './index.html',
  './manifest.json',
  './logoinfrared.png',
  './logoSena.png'
];

// Instalar el Service Worker y guardar en caché los archivos esenciales de inmediato
self.addEventListener('install', event => {
  self.skipWaiting(); // Fuerza al nuevo Service Worker a activarse sin esperar a que cierres la pestaña
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// Activar y limpiar cachés antiguas, tomando el control de la aplicación de inmediato
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim(); // Toma el control de la página web desde la primera carga
});

// Intercepta las peticiones y responde con la caché si estás offline
self.addEventListener('fetch', event => {
  // Evita interceptar peticiones de extensiones de navegador u otros protocolos
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse; // Si el archivo ya está en la memoria caché, lo entrega al instante
      }

      // Si no está en caché, lo busca en internet
      return fetch(event.request).then(networkResponse => {
        // Si es una fuente de Google Fonts, la clona y la guarda en la caché dinámicamente para que no se rompa el diseño offline
        if (event.request.url.includes('fonts.googleapis.com') || event.request.url.includes('fonts.gstatic.com')) {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      }).catch(() => {
        // Si no hay internet y el archivo no estaba en caché, falla silenciosamente sin trabar la app
      });
    })
  );
});