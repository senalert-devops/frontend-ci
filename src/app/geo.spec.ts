import { depuisGps, versGps } from './geo';
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

  it('le trajet aller-retour redonne la même position', () => {
    for (const [x, y] of [[0, 0], [123, 45], [320, 200], [600, 380]]) {
      const { latitude, longitude } = versGps(x, y);
      expect(depuisGps(latitude, longitude)).toEqual({ x, y });
    }
  });

  it('les communes restent reconnues après passage par le GPS', () => {
    for (const z of ZONES) {
      const { latitude, longitude } = versGps(z.x, z.y);
      const p = depuisGps(latitude, longitude);
      expect(communeDe(p.x, p.y)).toBe(z.n);
    }
  });

  it('Rufisque est à l’est et au sud de Parcelles Assainies', () => {
    const rufisque = versGps(520, 310);
    const parcelles = versGps(200, 80);
    expect(rufisque.longitude).toBeGreaterThan(parcelles.longitude);
    expect(rufisque.latitude).toBeLessThan(parcelles.latitude);
  });
});
