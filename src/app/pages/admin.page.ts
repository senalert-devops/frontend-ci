import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DetailComponent } from '../ui/detail.component';
import { IcoComponent } from '../ui/ico.component';
import { LogoComponent } from '../ui/logo.component';
import { COULEURS, communeDe, SignalementService, Statut, STATUTS, ZONES } from '../signalement.service';

@Component({
  selector: 'app-admin',
  imports: [FormsModule, NgTemplateOutlet, RouterLink, DetailComponent, IcoComponent, LogoComponent],
  template: `
    @if (!svc.admin()) {
      <div class="login">
        <div class="auth panneau">
          <span class="ib"><app-ico n="shield-check"/></span>
          <h1>Espace Administrateur</h1>
          <p class="mut">Connectez-vous pour gérer et traiter les signalements SenAlert.</p>
          @if (erreur()) { <p class="err">{{ erreur() }}</p> }
          <label for="u">Identifiant</label><input id="u" [(ngModel)]="u">
          <label for="p">Mot de passe</label><input id="p" type="password" [(ngModel)]="p" (keyup.enter)="connecter()">
          <p><button class="main large" (click)="connecter()">Se connecter</button></p>
          <p class="mut">Démonstration : admin / demo123 (compte fictif).</p>
        </div>
      </div>
    } @else {
      <div class="adm">
        <aside class="adm-side" [class.ouvert]="menu()">
          <div class="adm-logo">
            <app-logo [clair]="true"/>
            <button class="burger" style="width:auto;padding:6px" aria-label="Fermer le menu" (click)="menu.set(false)"><app-ico n="x"/></button>
          </div>
          <nav class="adm-nav" aria-label="Administration">
            <button [class.on]="vue() === 'tableau'" (click)="aller('tableau')"><app-ico n="layout"/> Tableau de bord</button>
            <button [class.on]="vue() === 'gestion'" (click)="aller('gestion')"><app-ico n="list"/> Gestion des signalements</button>
          </nav>
          <div class="adm-pied">
            <a routerLink="/"><app-ico n="external"/> Voir l’espace citoyen</a>
            <button class="sortie" (click)="svc.admin.set(false)"><app-ico n="log-out"/> Déconnexion</button>
          </div>
        </aside>
        @if (menu()) { <div class="voile" (click)="menu.set(false)"></div> }
        <div class="adm-main">
          <header class="adm-top">
            <button class="burger" aria-label="Menu" (click)="menu.set(true)"><app-ico n="menu"/></button>
            <h1>{{ vue() === 'tableau' ? 'Tableau de bord administrateur' : 'Gestion des signalements' }}</h1>
            <span class="avatar">AD</span>
          </header>
          <main class="adm-corps">
            @if (vue() === 'tableau') {
              <div class="kpis-adm">
                @for (k of kpis(); track k.l) {
                  <div class="panneau"><span class="ib p" [class]="'ib p ' + k.c"><app-ico [n]="k.i"/></span><b>{{ k.n }}</b><span>{{ k.l }}</span></div>
                }
              </div>
              <div class="grille3">
                <div class="panneau">
                  <h3 style="margin-top:0">Répartition par statut</h3>
                  @for (x of svc.parStatut(); track x.statut) {
                    <div class="ligne-barre"><span>{{ x.statut }}</span>
                      <span class="piste"><i [style.width.%]="total() ? x.n * 100 / total() : 0" [style.background]="couleurs[x.statut]"></i></span>
                      <b>{{ x.n }}</b></div>
                  }
                </div>
                <div class="panneau">
                  <h3 style="margin-top:0">Signalements par commune</h3>
                  @for (c of parCommune(); track c.nom) {
                    <div class="ligne-barre"><span>{{ c.nom }}</span>
                      <span class="piste"><i style="background:#0F4C3A" [style.width.%]="c.pct"></i></span>
                      <b>{{ c.n }}</b></div>
                  }
                </div>
                <div class="panneau">
                  <h3 style="margin-top:0">Derniers signalements</h3>
                  @for (r of recents(); track r.id) {
                    <div class="recent"><span><b>{{ r.id }}</b><br><small class="mut">{{ r.type }} · {{ commune(r.x, r.y) }}</small></span>
                      <span class="st" [style.--c]="couleurs[r.statut]">{{ r.statut }}</span></div>
                  }
                </div>
              </div>
            } @else {
              <div class="split">
                <section>
                  <div class="duo">
                    <select aria-label="Filtrer par statut" [ngModel]="filtre()" (ngModelChange)="filtre.set($event)">
                      <option value="">Tous les statuts</option>
                      @for (s of statuts; track s) { <option>{{ s }}</option> }
                    </select>
                    <span class="mut" style="align-self:center">{{ visibles().length }} résultat(s)</span>
                  </div>
                  <div class="tableau"><table>
                    <tr><th>Code</th><th>Type</th><th>Commune</th><th>Statut</th></tr>
                    @for (r of visibles(); track r.id) {
                      <tr class="ligne" [class.sel]="choix() === r.id" (click)="choix.set(r.id); erreur.set('')">
                        <td><b>{{ r.id }}</b></td><td>{{ r.type }}</td><td>{{ commune(r.x, r.y) }}</td>
                        <td><span class="st" [style.--c]="couleurs[r.statut]">{{ r.statut }}</span></td>
                      </tr>
                    }
                  </table></div>
                </section>
                <aside class="panneau">
                  <app-detail [s]="courant()">
                    @if (courant(); as r) {
                      <hr style="border:0;border-top:1px solid var(--trait);margin:16px 0">
                      @if (erreur()) { <p class="err">{{ erreur() }}</p> }
                      @switch (r.statut) {
                        @case ('Signalé') {
                          <button class="main" (click)="avancer('Vérifié')">Marquer vérifié</button>
                          <ng-container *ngTemplateOutlet="rejet"/>
                        }
                        @case ('Vérifié') {
                          <button class="main" (click)="avancer('En traitement')">Prendre en charge</button>
                          <ng-container *ngTemplateOutlet="rejet"/>
                        }
                        @case ('En traitement') {
                          <label>Note de résolution (obligatoire)</label>
                          <textarea rows="2" [ngModel]="note()" (ngModelChange)="note.set($event)"></textarea>
                          <label>Photo après intervention (facultative)</label>
                          <input type="file" accept="image/jpeg,image/png" (change)="choisirApres($event)">
                          <p><button class="main" (click)="resoudre()">Marquer résolu</button></p>
                        }
                        @default { <p class="mut">Statut final : aucune action possible.</p> }
                      }
                    }
                  </app-detail>
                </aside>
              </div>
            }
          </main>
        </div>
      </div>
    }
    <ng-template #rejet>
      <label>Motif de rejet</label>
      <select [ngModel]="motif()" (ngModelChange)="motif.set($event)">
        <option>Doublon</option><option>Hors sujet</option><option>Contenu inapproprié</option>
      </select>
      <p><button (click)="avancer('Rejeté', 'Motif : ' + motif())">Rejeter</button></p>
    </ng-template>`,
})
export class AdminPage {
  svc = inject(SignalementService);
  statuts = STATUTS; couleurs = COULEURS; commune = communeDe;
  u = 'admin'; p = 'demo123';
  vue = signal<'tableau' | 'gestion'>('tableau'); menu = signal(false);
  filtre = signal(''); choix = signal<string | null>(null);
  note = signal(''); motif = signal('Doublon'); apres = signal(''); erreur = signal('');
  visibles = computed(() => this.svc.liste().filter(r => !this.filtre() || r.statut === this.filtre()));
  courant = computed(() => this.svc.liste().find(r => r.id === this.choix()));
  total = computed(() => this.svc.liste().length);
  recents = computed(() => this.svc.liste().slice(0, 5));
  kpis = computed(() => {
    const p = this.svc.parStatut();
    const n = (s: Statut) => p.find(x => x.statut === s)?.n ?? 0;
    return [
      { l: 'Total signalements', n: this.total(), i: 'layers', c: 'gris' },
      { l: 'Reçus (Signalés)', n: n('Signalé'), i: 'inbox', c: 'ambre' },
      { l: 'Vérifiés', n: n('Vérifié'), i: 'shield-check', c: 'emeraude' },
      { l: 'En traitement', n: n('En traitement'), i: 'wrench', c: 'orange' },
      { l: 'Résolus', n: n('Résolu'), i: 'check-circle', c: '' },
      { l: 'Rejetés', n: n('Rejeté'), i: 'x-circle', c: 'rouge' },
    ];
  });
  parCommune = computed(() => {
    const l = ZONES.map(z => ({ nom: z.n, n: this.svc.liste().filter(r => communeDe(r.x, r.y) === z.n).length }));
    const max = Math.max(1, ...l.map(c => c.n));
    return l.sort((a, b) => b.n - a.n).map(c => ({ ...c, pct: c.n * 100 / max }));
  });

  aller(v: 'tableau' | 'gestion') { this.vue.set(v); this.menu.set(false); }
  async connecter() { this.erreur.set((await this.svc.connexion(this.u, this.p)) ? '' : 'Identifiants incorrects.'); }

  async avancer(s: Statut, note = '') {
    try { await this.svc.changer(this.choix()!, s, note); this.erreur.set(''); }
    catch (err) { this.erreur.set((err as Error).message); }
  }

  choisirApres(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0];
    this.apres.set('');
    if (!f) return;
    if (!/^image\/(jpeg|png)$/.test(f.type) || f.size > 5_000_000) { this.erreur.set('Photo refusée : JPEG ou PNG, 5 Mo maximum.'); return; }
    const r = new FileReader();
    r.onload = () => this.apres.set(r.result as string);
    r.readAsDataURL(f);
  }

  async resoudre() {
    if (!this.note().trim()) { this.erreur.set('La note de résolution est obligatoire.'); return; }
    try {
      await this.svc.changer(this.choix()!, 'Résolu', this.note().trim(), this.apres() || undefined);
      this.note.set(''); this.apres.set(''); this.erreur.set('');
    } catch (err) { this.erreur.set((err as Error).message); }
  }
}
