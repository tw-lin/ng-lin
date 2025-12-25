import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Account layout component.
 * Accessible skip link + simple layout that hosts child routes.
 */
@Component({
  selector: 'app-account-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a class="sr-only skip-link" href="#account-main">Skip to main</a>
    <div class="account-layout">
      <header class="account-header" role="banner">
        <h1 class="visually-hidden">Account</h1>
        <!-- Add header content (logo, breadcrumbs, nav) here -->
      </header>

      <main id="account-main" role="main">
        <router-outlet></router-outlet>
      </main>

      <footer class="account-footer" role="contentinfo">
        <!-- Footer content -->
      </footer>
    </div>
  `,
  styles: [
    `
      .sr-only:not(:focus):not(:active) {
        clip: rect(0 0 0 0);
        clip-path: inset(50%);
        height: 1px;
        overflow: hidden;
        position: absolute;
        white-space: nowrap;
        width: 1px;
      }
      .skip-link:focus {
        position: static;
        width: auto;
        height: auto;
        clip: auto;
        clip-path: none;
        margin: 8px;
        padding: 8px 12px;
        background: #005fcc;
        color: white;
        border-radius: 4px;
        text-decoration: none;
      }
    `
  ]
})
export class AccountLayoutComponent {}
