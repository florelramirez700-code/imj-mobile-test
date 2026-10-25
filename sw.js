// IMJ Mobile -- permet a l'application de s'ouvrir meme sans reseau.
//
// Strategie "reseau d'abord" : avec internet, on charge toujours la derniere
// version (les mises a jour arrivent normalement) et on en garde une copie ;
// sans internet, on sert la derniere copie gardee.
// Les appels a Supabase (autre adresse) ne sont JAMAIS touches ni gardes.
// Nom a part : la vraie appli imj-mobile utilise "imj-mobile-v...", au meme endroit du telephone.
const CACHE = "imj-mobile-test-v1";
const FICHIERS = ["./", "index.html", "manifest.json", "logo.png"];

self.addEventListener("install", (evenement) => {
  evenement.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FICHIERS)));
  self.skipWaiting();
});

// Au changement de version, on n'efface que les anciennes copies de CETTE appli.
// Les applis de cours (ECM, HG, Francais) et les autres applis IMJ sont a la meme adresse
// (florelramirez700-code.github.io) et partagent le meme stockage : on n'y touche pas.
self.addEventListener("activate", (evenement) => {
  evenement.waitUntil(
    caches.keys().then((cles) => Promise.all(
      cles.filter((cle) => cle.startsWith("imj-mobile-test-v") && cle !== CACHE).map((cle) => caches.delete(cle))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (evenement) => {
  const requete = evenement.request;
  if (requete.method !== "GET" || new URL(requete.url).origin !== self.location.origin) return;

  evenement.respondWith(
    fetch(requete)
      .then((reponse) => {
        if (reponse.ok) {
          const copie = reponse.clone();
          caches.open(CACHE).then((cache) => cache.put(requete, copie));
        }
        return reponse;
      })
      .catch(() =>
        caches.match(requete, { ignoreSearch: true }).then((enCache) => enCache || caches.match("index.html"))
      )
  );
});
