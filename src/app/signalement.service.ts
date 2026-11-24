import { Injectable, signal, computed } from '@angular/core';
import { environment } from '../environments/environment';
import { depuisGps, versGps } from './geo';

export type Statut = 'Signalé' | 'Vérifié' | 'En traitement' | 'Résolu' | 'Rejeté';
export const STATUTS: Statut[] = ['Signalé', 'Vérifié', 'En traitement', 'Résolu', 'Rejeté'];
export const TYPES = ['Rue bouchée', 'Canal bouché', 'Caniveau bouché'];
export const COULEURS: Record<Statut, string> = {
  'Signalé': '#D97706', 'Vérifié': '#059669', 'En traitement': '#EA580C', 'Résolu': '#0F4C3A', 'Rejeté': '#DC2626',
};
// Centres approximatifs des communes (GPS). La commune d'un signalement est la plus proche.
const CENTRES = [
  { n: 'Parcelles Assainies', latitude: 14.76, longitude: -17.44 },
  { n: 'Guédiawaye', latitude: 14.7695, longitude: -17.4 },
  { n: 'Pikine', latitude: 14.7549, longitude: -17.3908 },
  { n: 'Keur Massar', latitude: 14.7833, longitude: -17.3167 },
  { n: 'Rufisque', latitude: 14.7157, longitude: -17.2733 },
];
export const ZONES = CENTRES.map(c => ({ n: c.n, ...depuisGps(c.latitude, c.longitude) }));
const COS_LAT = Math.cos((14.75 * Math.PI) / 180); // 1° de longitude est plus court que 1° de latitude
export const communeDe = (x: number, y: number) => {
  const p = versGps(x, y);
  const dist = (c: { latitude: number; longitude: number }) =>
    Math.hypot(c.latitude - p.latitude, (c.longitude - p.longitude) * COS_LAT);
  return CENTRES.reduce((a, c) => (dist(c) < dist(a) ? c : a)).n;
};

export interface Etape { statut: Statut; date: string; note: string }

/** Signalement tel que l'affiche l'interface : la position est un point (x, y), voir geo.ts. */
export interface Signalement {
  id: string; type: string; description: string; x: number; y: number;
  statut: Statut; photo?: string; apres?: string; historique: Etape[];
}

/** Signalement tel que le renvoie l'API FastAPI : la position est un point GPS. */
interface SignalementApi extends Omit<Signalement, 'x' | 'y' | 'photo' | 'apres'> {
  latitude: number; longitude: number; photo?: string | null; apres?: string | null;
}

const depuisApi = ({ latitude, longitude, photo, apres, ...reste }: SignalementApi): Signalement =>
  ({ ...reste, ...depuisGps(latitude, longitude), photo: photo ?? undefined, apres: apres ?? undefined });

/**
 * Accès à l'API SenAlert (`environment.apiUrl`, en production `/api`, relayé par nginx vers le
 * backend). Aucune donnée ni identifiant n'est écrit ici : les signalements viennent de la base
 * PostgreSQL et la connexion administrateur est vérifiée par le backend avec le Secret Kubernetes.
 */
@Injectable({ providedIn: 'root' })
export class SignalementService {
  private readonly api = environment.apiUrl;
  private jeton = '';
  readonly liste = signal<Signalement[]>([]);
  readonly admin = signal(false);
  readonly parStatut = computed(() =>
    STATUTS.map(s => ({ statut: s, n: this.liste().filter(r => r.statut === s).length })));

  constructor() { this.charger().catch(() => {}); }

  trouver(id: string) { return this.liste().find(r => r.id === id); }

  /** Recharge la liste depuis l'API. */
  async charger(): Promise<void> {
    const l = await this.appel<SignalementApi[]>('GET', '/signalements');
    this.liste.set(l.map(depuisApi));
  }

  async creer(d: { type: string; description: string; x: number; y: number; photo: string }): Promise<string> {
    const { x, y, ...reste } = d;
    const s = depuisApi(await this.appel<SignalementApi>('POST', '/signalements', { ...reste, ...versGps(x, y) }));
    this.liste.update(l => [...l, s]);
    return s.id;
  }

  async changer(id: string, statut: Statut, note = '', apres?: string): Promise<void> {
    const s = depuisApi(await this.appel<SignalementApi>('PATCH', `/signalements/${id}/statut`, { statut, note, apres }));
    this.liste.update(l => l.map(r => (r.id === id ? s : r)));
  }

  /** Connexion administrateur : le backend vérifie l'identifiant et le mot de passe. */
  async connexion(u: string, p: string): Promise<boolean> {
    try {
      this.jeton = (await this.appel<{ token: string }>('POST', '/admin/login', { username: u, password: p })).token;
      this.admin.set(true);
      return true;
    } catch {
      this.deconnexion();
      return false;
    }
  }

  deconnexion() { this.jeton = ''; this.admin.set(false); }

  private async appel<T>(methode: string, chemin: string, corps?: unknown): Promise<T> {
    const r = await fetch(this.api + chemin, {
      method: methode,
      headers: { 'Content-Type': 'application/json', ...(this.jeton ? { Authorization: `Bearer ${this.jeton}` } : {}) },
      body: corps === undefined ? undefined : JSON.stringify(corps),
    });
    if (!r.ok) {
      // Jeton expiré ou refusé : retour à l'écran de connexion
      if (r.status === 401 && this.jeton) this.deconnexion();
      const detail = (await r.json().catch(() => null))?.detail;
      throw new Error(typeof detail === 'string' ? detail : `Erreur du serveur (${r.status}).`);
    }
    return r.json() as Promise<T>;
  }
}
