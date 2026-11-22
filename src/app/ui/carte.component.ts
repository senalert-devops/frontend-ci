import { Component, input, output } from '@angular/core';
import { COULEURS, Signalement, ZONES } from '../signalement.service';

@Component({
  selector: 'app-carte',
  template: `
    <div class="bloc">
      <svg class="plan" viewBox="0 0 600 380" role="img" aria-label="Carte schématique de la banlieue de Dakar" (click)="clic($event)">
        <rect width="600" height="380" fill="#bfe0e8"/>
        <text transform="translate(52 215) rotate(-90)" text-anchor="middle" font-size="12" font-style="italic" fill="#5d93a1">Océan Atlantique</text>
        <path d="M130 0H600V380H200Q150 300 170 220Q125 140 130 0Z" fill="#f5f2ea"/>
        <path d="M150 130H600M240 0Q260 190 330 380M420 0Q430 200 470 380M170 250H600" stroke="#e3ddcd" stroke-width="10" fill="none"/>
        <path d="M150 130H600M240 0Q260 190 330 380M420 0Q430 200 470 380M170 250H600" stroke="#fff" stroke-width="6" fill="none"/>
        <path d="M190 340Q300 270 410 300T600 255" stroke="#bfe0e8" stroke-width="6" stroke-dasharray="2 0" fill="none"/>
        @for (z of zones; track z.n) {
          <text [attr.x]="z.x" [attr.y]="z.y - 18" text-anchor="middle" font-size="12" font-weight="600" fill="#5d7580"
                stroke="#f5f2ea" stroke-width="3" paint-order="stroke">{{ z.n }}</text>
        }
        @for (r of signalements(); track r.id) {
          <g class="pt" tabindex="0" role="button" [attr.aria-label]="r.id + ', ' + r.statut"
             (click)="$event.stopPropagation(); choisirSignalement.emit(r.id)" (keydown.enter)="choisirSignalement.emit(r.id)">
            @if (r.statut === 'Signalé') { <circle class="pulse" [attr.cx]="r.x" [attr.cy]="r.y" r="14" [attr.fill]="couleurs[r.statut]"/> }
            <circle class="c" [attr.cx]="r.x" [attr.cy]="r.y" [attr.r]="selection() === r.id ? 13 : 9" [attr.fill]="couleurs[r.statut]"/>
          </g>
        }
        @if (repere(); as p) {
          <circle [attr.cx]="p.x" [attr.cy]="p.y" r="12" fill="#0b2a35" stroke="#fff" stroke-width="3.5"/>
          <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4" fill="#fff"/>
        }
      </svg>
      <ng-content />
    </div>`,
})
export class CarteComponent {
  signalements = input<Signalement[]>([]);
  selection = input<string | null>(null);
  repere = input<{ x: number; y: number } | null>(null);
  choisirSignalement = output<string>();
  choisirPosition = output<{ x: number; y: number }>();
  zones = ZONES;
  couleurs = COULEURS;

  clic(ev: MouseEvent) {
    const b = (ev.currentTarget as SVGSVGElement).getBoundingClientRect();
    this.choisirPosition.emit({
      x: Math.round(((ev.clientX - b.left) / b.width) * 600),
      y: Math.round(((ev.clientY - b.top) / b.height) * 380),
    });
  }
}
