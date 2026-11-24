import { Component, ElementRef, OnDestroy, afterNextRender, effect, input, output, signal, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { depuisGps, versGps, ZONE_DAKAR } from '../geo';
import { COULEURS, Signalement } from '../signalement.service';

// Vraie carte OpenStreetMap (Leaflet) centrée sur la banlieue de Dakar.
// Les signalements sont affichés à leur position GPS ; un clic sur la carte renvoie la position choisie.
const CENTRE: L.LatLngTuple = [14.75, -17.37];
const LIMITES: L.LatLngBoundsExpression = [[ZONE_DAKAR.sud, ZONE_DAKAR.ouest], [ZONE_DAKAR.nord, ZONE_DAKAR.est]];

@Component({
  selector: 'app-carte',
  template: `
    <div class="bloc">
      <div #carte class="plan" role="application" aria-label="Carte des signalements (OpenStreetMap)"
           style="height:420px;width:100%;border-radius:12px;z-index:0"></div>
      <ng-content />
    </div>`,
})
export class CarteComponent implements OnDestroy {
  signalements = input<Signalement[]>([]);
  selection = input<string | null>(null);
  repere = input<{ x: number; y: number } | null>(null);
  choisirSignalement = output<string>();
  choisirPosition = output<{ x: number; y: number }>();

  private readonly conteneur = viewChild.required<ElementRef<HTMLDivElement>>('carte');
  private readonly prete = signal(false);
  private carte?: L.Map;
  private points = L.layerGroup();
  private marqueurRepere?: L.CircleMarker;

  constructor() {
    afterNextRender(() => {
      this.carte = L.map(this.conteneur().nativeElement, { center: CENTRE, zoom: 12, minZoom: 10, maxBounds: LIMITES });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(this.carte);
      this.points.addTo(this.carte);
      this.carte.on('click', (ev: L.LeafletMouseEvent) =>
        this.choisirPosition.emit(depuisGps(ev.latlng.lat, ev.latlng.lng)));
      this.prete.set(true);
    });

    // Signalements : un cercle coloré par statut, plus grand pour celui qui est sélectionné
    effect(() => {
      if (!this.prete()) return;
      const choix = this.selection();
      this.points.clearLayers();
      for (const r of this.signalements()) {
        const { latitude, longitude } = versGps(r.x, r.y);
        L.circleMarker([latitude, longitude], {
          radius: choix === r.id ? 13 : 9,
          color: '#ffffff', weight: 2, fillColor: COULEURS[r.statut], fillOpacity: 0.95,
          bubblingMouseEvents: false,
        })
          .bindTooltip(`${r.id} · ${r.statut}`)
          .on('click', () => this.choisirSignalement.emit(r.id))
          .addTo(this.points);
      }
    });

    // Repère de la position choisie dans le formulaire de signalement
    effect(() => {
      if (!this.prete()) return;
      const p = this.repere();
      this.marqueurRepere?.remove();
      this.marqueurRepere = undefined;
      if (p) {
        const { latitude, longitude } = versGps(p.x, p.y);
        this.marqueurRepere = L.circleMarker([latitude, longitude], {
          radius: 12, color: '#ffffff', weight: 3.5, fillColor: '#0b2a35', fillOpacity: 1,
        }).addTo(this.carte!);
      }
    });
  }

  /** Centre la carte sur une position et rapproche la vue (utilisé après « Utiliser ma position »). */
  centrer(p: { x: number; y: number }) {
    if (!this.carte) return;
    const { latitude, longitude } = versGps(p.x, p.y);
    this.carte.setView([latitude, longitude], Math.max(this.carte.getZoom(), 15));
  }

  ngOnDestroy() { this.carte?.remove(); }
}
