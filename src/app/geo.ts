// Passage entre le plan schématique de la carte (x de 0 à 600, y de 0 à 380) et les
// coordonnées GPS (degrés décimaux, WGS84) que l'API enregistre.
//
// Le plan représente la banlieue de Dakar. Les deux droites ci-dessous ont été calées sur
// les positions réelles des communes affichées (Parcelles Assainies, Guédiawaye, Pikine,
// Keur Massar, Rufisque) : tout le plan tombe dans le cadre accepté par l'API (Sénégal).
// Une carte réelle (Leaflet, OpenStreetMap...) enverrait directement latitude et longitude.
export const LAT_ORIGINE = 14.8;     // latitude en haut du plan (y = 0)
export const LAT_PAR_PX = 0.00028;   // degrés de latitude par unité de y (vers le sud)
export const LON_ORIGINE = -17.55;   // longitude à gauche du plan (x = 0)
export const LON_PAR_PX = 0.00053;   // degrés de longitude par unité de x (vers l'est)

const arrondi = (n: number) => Math.round(n * 100_000) / 100_000;

/** Position sur le plan → coordonnées GPS envoyées à l'API. */
export function versGps(x: number, y: number): { latitude: number; longitude: number } {
  return {
    latitude: arrondi(LAT_ORIGINE - y * LAT_PAR_PX),
    longitude: arrondi(LON_ORIGINE + x * LON_PAR_PX),
  };
}

/** Coordonnées GPS reçues de l'API → position sur le plan. */
export function depuisGps(latitude: number, longitude: number): { x: number; y: number } {
  return {
    x: Math.round((longitude - LON_ORIGINE) / LON_PAR_PX),
    y: Math.round((LAT_ORIGINE - latitude) / LAT_PAR_PX),
  };
}