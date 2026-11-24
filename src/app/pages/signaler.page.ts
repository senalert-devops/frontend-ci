import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CarteComponent } from '../ui/carte.component';
import { communeDe, SignalementService, TYPES } from '../signalement.service';

@Component({
  selector: 'app-signaler',
  imports: [FormsModule, RouterLink, CarteComponent],
  template: `
    <div class="page" [class.etroit]="code()">
      @if (code()) {
        <h1>Signalement enregistré</h1>
        <p>Votre identifiant de suivi :</p>
        <div class="code">{{ code() }}</div>
        <p class="mut">Conservez-le : il permet de suivre le signalement sans compte, en lecture seule.</p>
        <div class="actions">
          <button (click)="copier()">{{ copie() ? 'Code copié' : 'Copier le code' }}</button>
          <a routerLink="/" class="btn main">Voir la carte</a>
          <a routerLink="/suivre" class="btn">Suivre un signalement</a>
        </div>
      } @else {
        <h1>Signaler un problème</h1>
        <p class="mut">Trois étapes : le type, une photo, l’emplacement sur la carte.</p>
        @if (erreur()) { <p class="err">{{ erreur() }}</p> }
        <div class="split egal">
          <section>
            <label>Type de problème</label>
            <div class="seg" role="group" aria-label="Type de problème">
              @for (t of types; track t) {
                <button [class.on]="type() === t" [attr.aria-pressed]="type() === t" (click)="type.set(t)">{{ t }}</button>
              }
            </div>
            <label for="desc">Description</label>
            <textarea id="desc" rows="4" [ngModel]="description()" (ngModelChange)="description.set($event)"
                      placeholder="Décrivez le problème (10 caractères minimum)"></textarea>
            <label>Photo</label>
            <label class="drop">
              <input class="sr" type="file" accept="image/jpeg,image/png" (change)="choisirPhoto($event)">
              @if (photo()) { <img [src]="photo()" alt="Aperçu de la photo"> }
              @else { <span>Touchez pour ajouter une photo<br><small>JPEG ou PNG, 5 Mo maximum</small></span> }
            </label>
          </section>
          <section>
            <label>Position</label>
            <p class="mut" style="margin-top:0">Cliquez sur la carte pour placer le problème. Dans la version finale, le GPS du navigateur remplira ce champ.</p>
            <app-carte [repere]="position()" (choisirPosition)="position.set($event)"/>
            <p class="mut">{{ libellePosition() }}</p>
          </section>
        </div>
        <div class="actions"><button class="main large" (click)="envoyer()">Envoyer le signalement</button></div>
      }
    </div>`,
})
export class SignalerPage {
  svc = inject(SignalementService);
  types = TYPES;
  type = signal(TYPES[0]); description = signal(''); photo = signal('');
  position = signal<{ x: number; y: number } | null>(null);
  erreur = signal(''); code = signal(''); copie = signal(false);

  async copier() {
    try { await navigator.clipboard.writeText(this.code()); this.copie.set(true); } catch { /* copie indisponible */ }
  }

  libellePosition() {
    const p = this.position();
    return p ? 'Position choisie : ' + communeDe(p.x, p.y) : 'Aucune position choisie';
  }

  choisirPhoto(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0];
    this.photo.set('');
    if (!f) return;
    if (!/^image\/(jpeg|png)$/.test(f.type)) { this.erreur.set('Format refusé : JPEG ou PNG uniquement.'); return; }
    if (f.size > 5_000_000) { this.erreur.set('Fichier trop volumineux (5 Mo maximum).'); return; }
    this.erreur.set('');
    const r = new FileReader();
    r.onload = () => this.photo.set(r.result as string);
    r.readAsDataURL(f);
  }

  async envoyer() {
    const p = this.position();
    if (this.description().trim().length < 10) { this.erreur.set('La description doit contenir au moins 10 caractères.'); return; }
    if (!this.photo()) { this.erreur.set('Veuillez ajouter une photo.'); return; }
    if (!p) { this.erreur.set('Veuillez placer la position sur la carte.'); return; }
    try {
      this.code.set(await this.svc.creer({ type: this.type(), description: this.description().trim(), x: p.x, y: p.y, photo: this.photo() }));
    } catch (err) { this.erreur.set((err as Error).message); }
  }
}
