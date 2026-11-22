import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IcoComponent } from './ico.component';

@Component({
  selector: 'app-logo',
  imports: [RouterLink, IcoComponent],
  template: `
    <a routerLink="/" class="logo" [class.clair]="clair()" aria-label="SenAlert, accueil">
      <span class="logo-ico"><app-ico n="shield-alert"/></span>
      <span><b>Sen<i>Alert</i></b><small>Veille citoyenne • Sénégal</small></span>
    </a>`,
})
export class LogoComponent {
  clair = input(false);
}
