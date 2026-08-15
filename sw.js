/* Service Worker - cachea la app para uso offline.
 *
 * Reglas importantes:
 *  - Las llamadas a /api/ NUNCA se cachean ni se sustituyen: son datos vivos
 *    y protegidos por PIN. Si no hay red, deben fallar limpiamente para que la
 *    app active su modo local, no recibir una respuesta vieja o equivocada.
 *  - El respaldo con index.html solo aplica a la NAVEGACION (abrir la app).
 *    Antes se aplicaba a todo, asi que un script que fallara recibia el HTML
 *    de la pagina y el navegador lanzaba un error confuso.
 */
const CACHE = 'auditoria-hk-v2';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Datos vivos: fuera del Service Worker por completo.
  if (url.pathname.startsWith('/api/')) return;

  // Abrir la app: red primero, y si no hay conexion, la copia guardada.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Recursos (imagenes, iconos, librerias): red primero, cache como respaldo.
  // Si tampoco esta en cache, se devuelve el error real en vez de HTML.
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok && url.origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || Response.error()))
  );
});
