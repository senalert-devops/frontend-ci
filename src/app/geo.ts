// Passage entre la position (x, y) utilisée par l'interface et les coordonnées GPS
// (degrés décimaux, WGS84) que l'API enregistre et que la carte OpenStreetMap affiche.
//
// (x, y) est un repère interne de la banlieue de Dakar : une transformation linéaire du GPS,
// sans arrondi, donc sans perte de précision (1 m environ après enregistrement). Les pages
// (liste, détail, tableau de bord) l'utilisent pour calculer la commune ; la carte, elle,
// travaille directement en latitude et longitude.
export const LAT_ORIGINE = 14.8;     // latitude en haut du plan (y = 0)
export const LAT_PAR_PX = 0.00028;   // degrés de latitude par unité de y (vers le sud)
export const LON_ORIGINE = -17.55;   // longitude à gauche du plan (x = 0)
export const LON_PAR_PX = 0.00053;   // degrés de longitude par unité de x (vers l'est)

const arrondi = (n: number) => Math.round(n * 100_000) / 100_000;

/** Position (x, y) de l'interface → coordonnées GPS envoyées à l'API. */
export function versGps(x: number, y: number): { latitude: number; longitude: number } {
  return {
    latitude: arrondi(LAT_ORIGINE - y * LAT_PAR_PX),
    longitude: arrondi(LON_ORIGINE + x * LON_PAR_PX),
  };
}

/** Coordonnées GPS reçues de l'API → position (x, y) de l'interface. */
export function depuisGps(latitude: number, longitude: number): { x: number; y: number } {
  return {
    x: (longitude - LON_ORIGINE) / LON_PAR_PX,
    y: (LAT_ORIGINE - latitude) / LAT_PAR_PX,
  };
}

// Zone couverte par l'application : Dakar et sa banlieue (limites de la carte).
export const ZONE_DAKAR = { sud: 14.6, nord: 14.9, ouest: -17.6, est: -17.1 };

/** Vrai si la position GPS est dans la zone couverte (et donc acceptée par l'API). */
export function dansLaZone(latitude: number, longitude: number): boolean {
  return latitude >= ZONE_DAKAR.sud && latitude <= ZONE_DAKAR.nord
    && longitude >= ZONE_DAKAR.ouest && longitude <= ZONE_DAKAR.est;
}
