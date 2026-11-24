import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IcoComponent } from '../ui/ico.component';
import { SignalementService } from '../signalement.service';

@Component({
  selector: 'app-accueil',
  imports: [FormsModule, RouterLink, IcoComponent],
  template: `
    <section class="hero">
      <div class="hero-in">
        <div>
          <span class="pastille">Prévention des inondations au Sénégal</span>
          <h1>Signaler aujourd’hui pour prévenir les inondations de demain.</h1>
          <p class="lead">Rues bloquées, canaux encombrés ou caniveaux bouchés : alertez rapidement les services compétents, consultez la carte de votre commune et suivez chaque intervention en toute transparence.</p>
          <div class="boutons">
            <a routerLink="/signaler" class="btn blanc"><app-ico n="plus-circle"/> Signaler un problème</a>
            <a routerLink="/carte" class="btn fantome"><app-ico n="map-pin"/> Consulter la carte</a>
          </div>
        </div>
        <div class="apercu">
          <h2><app-ico n="activity"/> Suivi rapide citoyen</h2>
          <p class="mut" style="margin:0">Vous avez un code de suivi (ex. <a routerLink="/suivre" [queryParams]="{ code: 'SIG-000119' }"><b>SIG-000119</b></a>) ? Entrez-le ici.</p>
          <div class="duo" style="margin:0">
            <input aria-label="Code de suivi" placeholder="Ex. SIG-000118" [ngModel]="code()" (ngModelChange)="code.set($event)" (keyup.enter)="suivre()">
            <button class="main" (click)="suivre()">Suivre</button>
          </div>
          <div class="mini">
            <div><b>{{ m().total }}</b><span>Signalements</span></div>
            <div class="o"><b>{{ m().cours }}</b><span>En cours</span></div>
            <div class="v"><b>{{ m().resolus }}</b><span>Résolus</span></div>
          </div>
        </div>
      </div>
    </section>

    <section class="kpis">
      <div class="panneau kpi"><span class="ib"><app-ico n="file-text"/></span><div><b>{{ m().total }}</b><span>Signalements enregistrés</span></div></div>
      <div class="panneau kpi"><span class="ib emeraude"><app-ico n="check-circle"/></span><div><b style="color:#047857">{{ m().resolus }}</b><span>Signalements résolus</span></div></div>
      <div class="panneau kpi"><span class="ib orange"><app-ico n="clock"/></span><div><b style="color:#c2410c">{{ m().cours }}</b><span>Signalements en cours</span></div></div>
    </section>

    <section class="page">
      <span class="surtitre">Comment fonctionne SenAlert ?</span>
      <h2 style="font-size:1.8rem;margin-top:4px">Un processus simple en 4 étapes</h2>
      <p class="mut" style="max-width:40rem">Chaque citoyen peut contribuer à l’assainissement préventif de son quartier en moins de deux minutes, sans création de compte.</p>
      <div class="etapes">
        @for (e of etapes; track e[0]) {
          <div class="panneau etape">
            <header><span class="ib p"><app-ico [n]="e[2]"/></span><span>{{ e[0] }}</span></header>
            <h3>{{ e[1] }}</h3>
            <p>{{ e[3] }}</p>
          </div>
        }
      </div>
    </section>

    <section class="cta">
      <div class="cadre">
        <div>
          <h3>Un caniveau ou une rue obstruée dans votre quartier ?</h3>
          <p>Aidez les communes de Dakar et de sa périphérie à intervenir avant l’hivernage.</p>
        </div>
        <div class="boutons">
          <a routerLink="/signaler" class="btn main">Créer un signalement</a>
          <a routerLink="/carte" class="btn">Voir la carte</a>
        </div>
      </div>
    </section>`,
})
export class AccueilPage {
  svc = inject(SignalementService);
  router = inject(Router);
  code = signal('');
  m = computed(() => {
    const p = this.svc.parStatut();
    const n = (s: string) => p.find(x => x.statut === s)?.n ?? 0;
    return { total: p.reduce((a, x) => a + x.n, 0), resolus: n('Résolu'), cours: n('En traitement') };
  });
  etapes = [
    ['01', 'Signaler', 'megaphone', 'Décrivez l’obstruction, ajoutez une photo et indiquez sa position, sans créer de compte.'],
    ['02', 'Vérifier', 'search', 'Les équipes techniques examinent le signalement et localisent précisément l’ouvrage concerné.'],
    ['03', 'Traiter', 'wrench', 'Une brigade ou un engin de curage est déployé pour dégager la rue, le canal ou le caniveau.'],
    ['04', 'Résoudre', 'check-circle', 'L’écoulement est rétabli et une note de résolution est publiée sur votre suivi.'],
  ];
  suivre() {
    const c = this.code().trim();
    this.router.navigate(['/suivre'], { queryParams: c ? { code: c } : {} });
  }
}
