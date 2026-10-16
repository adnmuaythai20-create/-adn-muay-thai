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
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// Installation : mise en cache de tous les fichiers
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(FICHIERS_A_CACHER).catch(function(err) {
        // Si un fichier est absent, on continue quand même
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
  // On ne met pas en cache les appels Formspree ni Firebase
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
      // Pas dans le cache : on va chercher sur le réseau
      return fetch(event.request).then(function(reponseReseau) {
        if (!reponseReseau || reponseReseau.status !== 200 || reponseReseau.type !== 'basic') {
          return reponseReseau;
        }
        // On met en cache la nouvelle ressource
        var reponseAMettreDansCache = reponseReseau.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, reponseAMettreDansCache);
        });
        return reponseReseau;
      }).catch(function() {
        // Hors ligne et pas dans le cache : retourner index.html
        return caches.match('./index.html');
      });
    })
  );
});
