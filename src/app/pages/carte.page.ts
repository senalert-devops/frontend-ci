import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CarteComponent } from '../ui/carte.component';
import { DetailComponent } from '../ui/detail.component';
import { IcoComponent } from '../ui/ico.component';
import { COULEURS, communeDe, SignalementService, STATUTS, TYPES, ZONES } from '../signalement.service';

@Component({
  selector: 'app-carte-page',
  imports: [FormsModule, RouterLink, CarteComponent, DetailComponent, IcoComponent],
  template: `
    <div class="page">
      <div class="entete">
        <div>
          <h1>Carte des signalements</h1>
          <p class="mut">Obstructions signalées à Dakar et dans sa périphérie.</p>
        </div>
        <a routerLink="/signaler" class="btn main"><app-ico n="plus"/> Nouveau signalement</a>
      </div>

      <div class="panneau filtres-barre">
        <div><label for="f-type">Type de problème</label>
          <select id="f-type" [ngModel]="type()" (ngModelChange)="type.set($event)">
            <option value="">Tous les types</option>
            @for (t of types; track t) { <option>{{ t }}</option> }
          </select></div>
        <div><label for="f-statut">Statut</label>
          <select id="f-statut" [ngModel]="statut()" (ngModelChange)="statut.set($event)">
            <option value="">Tous les statuts</option>
            @for (s of statuts; track s) { <option>{{ s }}</option> }
          </select></div>
        <div><label for="f-commune">Commune</label>
          <select id="f-commune" [ngModel]="lieu()" (ngModelChange)="lieu.set($event)">
            <option value="">Toutes les communes</option>
            @for (c of communes; track c) { <option>{{ c }}</option> }
          </select></div>
        <div class="fin">
          <span class="mut"><b>{{ visibles().length }}</b> résultat(s)</span>
          <button (click)="reinit()">Réinitialiser</button>
        </div>
      </div>

      <div class="grille-carte">
        <app-carte [signalements]="visibles()" [selection]="choix()" (choisirSignalement)="choix.set($event)">
          <div class="legende">
            @for (s of statuts; track s) { <span [style.--c]="couleurs[s]"><i></i>{{ s }}</span> }
          </div>
        </app-carte>

        @if (courant(); as r) {
          <aside class="panneau">
            <button (click)="choix.set(null)" style="margin-bottom:12px"><app-ico n="list"/> Retour à la liste</button>
            <app-detail [s]="r"/>
          </aside>
        } @else {
          <aside class="bloc">
            <div class="liste-tete">Signalements <span class="mut">{{ visibles().length }}</span></div>
            <div class="liste-corps">
              @for (r of visibles(); track r.id) {
                <button class="item" (click)="choix.set(r.id)">
                  <div><b>{{ r.id }}</b><span class="st" [style.--c]="couleurs[r.statut]">{{ r.statut }}</span></div>
                  <small>{{ r.type }} · {{ commune(r.x, r.y) }}</small>
                </button>
              } @empty {
                <p class="vide" style="margin:16px">Aucun signalement ne correspond à ces filtres.</p>
              }
            </div>
          </aside>
        }
      </div>
    </div>`,
})
export class CartePage {
  svc = inject(SignalementService);
  types = TYPES; statuts = STATUTS; couleurs = COULEURS; commune = communeDe;
  communes = ZONES.map(z => z.n);
  type = signal(''); statut = signal(''); lieu = signal(''); choix = signal<string | null>(null);
  visibles = computed(() => this.svc.liste().filter(r =>
    (!this.type() || r.type === this.type()) && (!this.statut() || r.statut === this.statut()) &&
    (!this.lieu() || communeDe(r.x, r.y) === this.lieu())));
  courant = computed(() => this.svc.liste().find(r => r.id === this.choix()));
  reinit() { this.type.set(''); this.statut.set(''); this.lieu.set(''); }
}
