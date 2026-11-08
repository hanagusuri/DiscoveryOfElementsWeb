const CACHE = "eod-v12";
const FILES = ["./", "index.html", "style.css", "data.js", "elements.js", "elements_extra.js", "elements_compounds.js", "elements_safety.js", "elements_phases.js", "elements_distill.js", "elements_electric.js", "elements_cells.js", "molviz.js", "elements_organic.js", "elements_chem.js", "elements_dyn.js", "elements_yield.js", "elements_yield2.js", "elements_why.js", "elements_market.js", "elements_uses.js", "elements_era.js", "elements_more.js", "elements_inorg.js", "elements_org2.js", "elements_bio.js", "elements_org3.js", "elements_inorg2.js", "elements_adv.js", "elements_nat.js", "industry.js", "fx.js", "chemui.js", "dynui.js", "game.js", "manifest.json", "icon.svg"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))));
// ネットワーク優先、オフライン時はキャッシュ
self.addEventListener("fetch", (e) => {
  e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});
