// ADN Muay-Thaï 2.0 — Service Worker
const CACHE_NAME = 'adn-muaythai-v1';

const FICHIERS_A_CACHER = [
  './',
  './index.html',
  './inscription-adherent-en-ligne.html',
  './inscription-adherent-public.html',
  './inscription-enfant-en-ligne.html',
  './inscription-enfant-public.html',
  './manifest.json',
  './icône-192x192.png',
  './icône-512x512.png'
];

// Installation : mise en cache de tous les fichiers
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(FICHIERS_A_CACHER).catch(function(err) {
        console.warn('Certains fichiers non mis en cache :', err);
      });
    })
  );
  self.skipWaiting();
});

// Activation : suppression des anciens caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

// Interception des requêtes : cache en priorité, réseau en fallback
self.addEventListener('fetch', function(event) {
  const url = event.request.url;
  if (
    url.includes('formspree.io') ||
    url.includes('firebaseio.com') ||
    url.includes('googleapis.com') ||
    url.includes('firebase') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(reponseCache) {
      if (reponseCache) {
        return reponseCache;
      }
      return fetch(event.request).then(function(reponseReseau) {
        if (!reponseReseau || reponseReseau.status !== 200 || reponseReseau.type !== 'basic') {
          return reponseReseau;
        }
        var reponseAMettreDansCache = reponseReseau.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, reponseAMettreDansCache);
        });
        return reponseReseau;
      }).catch(function() {
        return caches.match('./index.html');
      });
    })
  );
});
