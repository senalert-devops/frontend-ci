import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DetailComponent } from '../ui/detail.component';
import { SignalementService } from '../signalement.service';

@Component({
  selector: 'app-suivre',
  imports: [FormsModule, DetailComponent],
  template: `
    <div class="page etroit">
      <h1>Suivre un signalement</h1>
      <p class="mut">Entrez le code reçu lors de votre signalement, sans compte.</p>
      <div class="duo">
        <input aria-label="Code de suivi" [ngModel]="saisie()" (ngModelChange)="saisie.set($event)" placeholder="Ex. SIG-000119" (keyup.enter)="chercher()">
        <button class="main" (click)="chercher()">Rechercher</button>
      </div>
      @if (cherche() && !resultat()) { <p class="err">Aucun signalement avec ce code. Vérifiez qu’il commence par SIG-.</p> }
      @else { <div class="panneau"><app-detail [s]="resultat()"/></div> }
      <p class="mut">Essayez SIG-000119 ou SIG-000118.</p>
    </div>`,
})
export class SuivrePage {
  svc = inject(SignalementService);
  saisie = signal('');
  code = signal('');
  cherche = signal(false);
  resultat = computed(() => this.svc.trouver(this.code()));
  constructor() {
    const c = inject(ActivatedRoute, { optional: true })?.snapshot.queryParamMap.get('code');
    if (c) { this.saisie.set(c); void this.chercher(); }
  }

  async chercher() {
    await this.svc.charger().catch(() => {});
    this.code.set(this.saisie().trim().toUpperCase());
    this.cherche.set(true);
  }
}
