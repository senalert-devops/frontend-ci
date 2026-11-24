import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IcoComponent } from './ui/ico.component';
import { LogoComponent } from './ui/logo.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IcoComponent, LogoComponent],
  template: `
    @if (!admin()) {
      <header class="top">
        <div class="top-in">
          <app-logo/>
          <nav class="nav" aria-label="Navigation principale">
            @for (l of liens; track l[0]) {
              <a [routerLink]="l[0]" routerLinkActive="actif" [routerLinkActiveOptions]="{ exact: true }">{{ l[1] }}</a>
            }
          </nav>
          <div class="droite">
            <a routerLink="/admin" class="btn btn-admin"><app-ico n="lock"/> Administration</a>
            <button class="burger" aria-label="Menu" (click)="ouvert.set(!ouvert())"><app-ico [n]="ouvert() ? 'x' : 'menu'"/></button>
          </div>
        </div>
        @if (ouvert()) {
          <div class="menu-m" (click)="ouvert.set(false)">
            @for (l of liens; track l[0]) {
              <a [routerLink]="l[0]" routerLinkActive="actif" [routerLinkActiveOptions]="{ exact: true }">{{ l[1] }}</a>
            }
            <a routerLink="/admin">Connexion Administrateur</a>
          </div>
        }
      </header>
    }
    <router-outlet />
    @if (!admin()) {
      <footer class="pied">
        <div class="pied-in">
          <div>
            <app-logo [clair]="true"/>
            <p>SenAlert est une plateforme citoyenne dédiée au signalement et au suivi des rues, canaux et caniveaux obstrués au Sénégal afin de prévenir les risques d’inondation.</p>
          </div>
          <div>
            <h4>Espace citoyen</h4>
            <ul>@for (l of liens; track l[0]) { <li><a [routerLink]="l[0]">{{ l[1] }}</a></li> }</ul>
          </div>
          <div>
            <h4>Administration et informations</h4>
            <ul>
              <li><a routerLink="/admin">Espace administrateur</a></li>
              <li>Zone couverte : Dakar et périphérie</li>
            </ul>
          </div>
        </div>
        <div class="bas">© 2026 SenAlert — Service public citoyen (Sénégal).</div>
      </footer>
    }`,
})
export class App {
  liens = [
    ['/', 'Accueil'],
    ['/carte', 'Carte des signalements'],
    ['/signaler', 'Signaler un problème'],
    ['/suivre', 'Suivre un signalement'],
  ];
  ouvert = signal(false);
  admin = signal(false);
  constructor() {
    const r = inject(Router);
    this.admin.set(r.url.startsWith('/admin'));
    r.events.subscribe(e => { if (e instanceof NavigationEnd) this.admin.set(e.urlAfterRedirects.startsWith('/admin')); });
  }
}
