// Cambia questo numero a ogni nuova versione (deve coincidere con APP_VERSION in index.html)
var VERSION = '1.2.0';
var CACHE = 'mtb-' + VERSION;
var FILES = ['index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      // cache:'reload' salta la cache HTTP di GitHub e scarica file freschi
      return Promise.all(FILES.map(function(f){
        return fetch(new Request(f, {cache: 'reload'})).then(function(r){
          if(r.ok) return c.put(f, r);
        });
      }));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

// Rete per prima (sempre la versione aggiornata), cache solo se sei offline
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req, {cache: 'no-cache'}).then(function(r){
      if(r && r.ok){
        var copy = r.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
      }
      return r;
    }).catch(function(){
      return caches.match(req, {ignoreSearch: true}).then(function(m){
        return m || (req.mode === 'navigate' ? caches.match('index.html') : Response.error());
      });
    })
  );
});
