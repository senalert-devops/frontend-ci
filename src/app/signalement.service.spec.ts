import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SignalementService } from './signalement.service';

// Faux serveur : même contrat que le vrai backend (positions en latitude / longitude,
// connexion par identifiant et mot de passe, jeton Bearer). Aucun identifiant n'est écrit
// en dur : le mot de passe est tiré au hasard à chaque lancement des tests.
const UTILISATEUR = 'admin-test';
const MOT_DE_PASSE = 'mdp-' + Math.random().toString(36).slice(2);
const JETON = 'jeton-' + Math.random().toString(36).slice(2);

interface Appel { methode: string; url: string; corps: any; autorisation: string | null }

const existant = {
  id: 'SIG-000001', type: 'Rue bouchée', description: 'Eau stagnante dans la rue',
  latitude: 14.7549, longitude: -17.3908, statut: 'Signalé', photo: null, apres: null,
  historique: [{ statut: 'Signalé', date: '01/11/2026', note: '' }],
};

describe('SignalementService (API)', () => {
  let appels: Appel[];
  let svc: SignalementService;

  beforeEach(async () => {
    appels = [];
    let suivant = 2;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}) => {
      const corps = init.body ? JSON.parse(init.body as string) : undefined;
      const autorisation = (init.headers as Record<string, string>)['Authorization'] ?? null;
      appels.push({ methode: init.method!, url, corps, autorisation });
      const rep = (status: number, donnees: unknown) => ({ ok: status < 400, status, json: async () => donnees });

      if (url === '/api/signalements' && init.method === 'GET') return rep(200, [existant]);
      if (url === '/api/signalements' && init.method === 'POST') {
        if ('x' in corps || 'y' in corps) return rep(422, { detail: [] });
        return rep(201, { ...corps, id: `SIG-00000${suivant++}`, statut: 'Signalé', apres: null,
          historique: [{ statut: 'Signalé', date: '02/11/2026', note: '' }] });
      }
      if (url === '/api/admin/login') {
        return corps.username === UTILISATEUR && corps.password === MOT_DE_PASSE
          ? rep(200, { token: JETON }) : rep(401, { detail: 'Identifiants incorrects.' });
      }
      if (url.endsWith('/statut')) {
        if (autorisation !== `Bearer ${JETON}`) return rep(401, { detail: 'Connexion administrateur requise.' });
        return rep(200, { ...existant, statut: corps.statut,
          historique: [...existant.historique, { statut: corps.statut, date: '03/11/2026', note: corps.note }] });
      }
      return rep(404, { detail: 'inconnu' });
    }));
    TestBed.configureTestingModule({});
    svc = TestBed.inject(SignalementService);
    await svc.charger();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('charge les signalements de l’API et convertit la position GPS en point du plan', () => {
    const s = svc.trouver('SIG-000001')!;
    expect(s.statut).toBe('Signalé');
    expect(s.x).toBeGreaterThan(0);
    expect(s.y).toBeGreaterThan(0);
    expect(s.photo).toBeUndefined();
  });

  it('crée un signalement en envoyant latitude et longitude (jamais x ni y)', async () => {
    const id = await svc.creer({ type: 'Caniveau bouché', description: 'Caniveau bouché devant l’école', x: 300, y: 200, photo: 'data:image/png;base64,AA' });
    const envoi = appels.find(a => a.methode === 'POST' && a.url === '/api/signalements')!.corps;
    expect(envoi.latitude).toBeGreaterThan(12);
    expect(envoi.latitude).toBeLessThan(17);
    expect(envoi.longitude).toBeGreaterThan(-18);
    expect(envoi.longitude).toBeLessThan(-11);
    expect('x' in envoi || 'y' in envoi).toBe(false);
    const cree = svc.trouver(id)!;
    expect(cree.statut).toBe('Signalé');
    expect(cree.x).toBeCloseTo(300, 1);
    expect(cree.y).toBeCloseTo(200, 1);
  });

  it('refuse un mauvais mot de passe administrateur', async () => {
    expect(await svc.connexion(UTILISATEUR, 'faux')).toBe(false);
    expect(svc.admin()).toBe(false);
  });

  it('refuse les anciens identifiants de démonstration', async () => {
    expect(await svc.connexion('admin', 'demo123')).toBe(false);
    expect(svc.admin()).toBe(false);
  });

  it('accepte les bons identifiants et envoie le jeton pour changer un statut', async () => {
    expect(await svc.connexion(UTILISATEUR, MOT_DE_PASSE)).toBe(true);
    expect(svc.admin()).toBe(true);
    await svc.changer('SIG-000001', 'Vérifié');
    const patch = appels.find(a => a.methode === 'PATCH')!;
    expect(patch.autorisation).toBe(`Bearer ${JETON}`);
    expect(svc.trouver('SIG-000001')?.historique.map(h => h.statut)).toEqual(['Signalé', 'Vérifié']);
  });

  it('refuse de changer un statut sans être connecté et affiche le message du serveur', async () => {
    await expect(svc.changer('SIG-000001', 'Vérifié')).rejects.toThrow('Connexion administrateur requise.');
  });

  it('la déconnexion retire l’accès administrateur', async () => {
    await svc.connexion(UTILISATEUR, MOT_DE_PASSE);
    svc.deconnexion();
    expect(svc.admin()).toBe(false);
    await expect(svc.changer('SIG-000001', 'Vérifié')).rejects.toThrow();
  });
});
