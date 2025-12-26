/**
 * ng-lin - Construction Site Progress Tracking Management System
 * 
 * Main application entry point for Angular 20 standalone bootstrap.
 * 
 * @module main
 * @description
 * Bootstraps the Angular application using standalone component architecture.
 * This project is built with:
 * - Angular 20+ (Standalone Components, Signals)
 * - ng-alain 20+ (Enterprise UI Framework)
 * - Firebase 20+ (Backend as a Service)
 * - TypeScript 5.9+ (Strict Mode)
 * 
 * Architecture:
 * - Three-layer pattern: UI → Service/Facade → Repository
 * - Signals-based state management
 * - Event-driven cross-module communication via BlueprintEventBus
 * - Blueprint-based multi-tenancy model
 * - Firebase-only constraints (no custom backend servers)
 * 
 * @see {@link ./app/app.config.ts} for application configuration
 * @see {@link ./app/app.component.ts} for root component
 * @see {@link docs/⭐️/INDEX.md} for architecture documentation
 * @see {@link .github/copilot-instructions.md} for development guidelines
 */

import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));
