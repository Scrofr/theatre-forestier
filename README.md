# Théâtre Forestier — carte d’orientation GPS

Carte FFCO du **Théâtre Forestier** (Pontarlier, Bois de Doubs), préchargée et **recalée sur le plan IGN**.

Sur le terrain, autorisez la géolocalisation : votre position s’affiche sur la carte d’orientation.

## Déployer sur GitHub Pages

1. Dans le dépôt : **Settings → Pages**
2. Source : **GitHub Actions** (le workflow `.github/workflows/pages.yml` publie le dossier `docs/`)
3. Adresse : `https://scrofr.github.io/theatre-forestier/`

Le GPS ne fonctionne qu’en **HTTPS** (GitHub Pages l’est déjà).

## Utilisation

- **Me localiser** — GPS du téléphone, suivi en direct
- **Fonds de carte** — Plan IGN, carte IGN, OSM, orthophoto, satellite
- **Caler** — décalage / rotation / échelle si le recale d’origine doit être affiné (mémorisé sur l’appareil)
- Opacité + fusion papier (multiply) pour comparer la carte O’ au fond IGN

## Recale

Le calage utilise le théâtre de verdure OSM (`46.91931, 6.36962`), l’échelle 1/7500 de la feuille et la déclinaison magnétique 2013 (~1,5° E). Un panneau permet de corriger de quelques mètres sur place.

Carte : FFCO / Evasio / Balise 25 — n° 2013 25 180. Fonds : © IGN Geoportail, © OpenStreetMap, © Esri.
