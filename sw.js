/* Lancer Defense — offline cache.
   Bump CACHE when you upload a new build so kids pick it up. */
const CACHE = "lancer-defense-v1.3.0";
const FILES = ["./", "./index.html", "./TennysonHighLogo.webp"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Network first, fall back to cache. Fresh when online, still works on the bus.
   no-store keeps the browser's own HTTP cache out of it â€” GitHub Pages serves
   index.html with a 10 minute max-age, and without this the "network" copy can
   be that stale file, so a fresh upload never reaches the kids. */
const fresh = req => new Request(req.url, { cache: "no-store", credentials: "same-origin" });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(fresh(e.request))
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});
