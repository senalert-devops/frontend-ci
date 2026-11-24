import { dansLaZone, depuisGps, versGps } from './geo';
import { communeDe, ZONES } from './signalement.service';

// Cadre accepté par l'API (voir backend, schemas.py)
const dansLeSenegal = (lat: number, lon: number) => lat >= 12 && lat <= 17 && lon >= -18 && lon <= -11;

describe('position : plan de la carte <-> GPS', () => {
  it('tout le plan de la carte tombe dans le cadre accepté par l’API', () => {
    for (const [x, y] of [[0, 0], [600, 0], [0, 380], [600, 380], [300, 190]]) {
      const { latitude, longitude } = versGps(x, y);
      expect(dansLeSenegal(latitude, longitude)).toBe(true);
    }
  });

  it('le trajet aller-retour redonne la même position (à 1 m près)', () => {
    for (const [x, y] of [[0, 0], [123, 45], [320, 200], [600, 380]]) {
      const { latitude, longitude } = versGps(x, y);
      const p = depuisGps(latitude, longitude);
      expect(p.x).toBeCloseTo(x, 1);
      expect(p.y).toBeCloseTo(y, 1);
    }
  });

  it('un clic sur la vraie carte garde sa précision GPS', () => {
    const clic = { latitude: 14.755312, longitude: -17.391745 };
    const p = depuisGps(clic.latitude, clic.longitude);
    const retour = versGps(p.x, p.y);
    expect(retour.latitude).toBeCloseTo(clic.latitude, 4);
    expect(retour.longitude).toBeCloseTo(clic.longitude, 4);
  });

  it('les communes restent reconnues après passage par le GPS', () => {
    for (const z of ZONES) {
      const { latitude, longitude } = versGps(z.x, z.y);
      const p = depuisGps(latitude, longitude);
      expect(communeDe(p.x, p.y)).toBe(z.n);
    }
  });

  it('des points réels sont rattachés à la bonne commune', () => {
    const commune = (lat: number, lon: number) => { const p = depuisGps(lat, lon); return communeDe(p.x, p.y); };
    expect(commune(14.7549, -17.3908)).toBe('Pikine');
    expect(commune(14.7833, -17.3167)).toBe('Keur Massar');
    expect(commune(14.7157, -17.2733)).toBe('Rufisque');
    expect(commune(14.762, -17.4425)).toBe('Parcelles Assainies');
  });

  it('Rufisque est à l’est et au sud de Parcelles Assainies', () => {
    const rufisque = versGps(520, 310);
    const parcelles = versGps(200, 80);
    expect(rufisque.longitude).toBeGreaterThan(parcelles.longitude);
    expect(rufisque.latitude).toBeLessThan(parcelles.latitude);
  });

  it('la zone couverte accepte Dakar et refuse l’étranger ou le reste du Sénégal', () => {
    expect(dansLaZone(14.7549, -17.3908)).toBe(true);   // Pikine
    expect(dansLaZone(14.7157, -17.2733)).toBe(true);   // Rufisque
    expect(dansLaZone(48.8566, 2.3522)).toBe(false);    // Paris
    expect(dansLaZone(14.79, -16.93)).toBe(false);      // Thiès, hors de la carte
  });

  it('toute la zone couverte est acceptée par l’API', () => {
    for (const [lat, lon] of [[14.6, -17.6], [14.9, -17.1]]) expect(dansLeSenegal(lat, lon)).toBe(true);
  });
});
