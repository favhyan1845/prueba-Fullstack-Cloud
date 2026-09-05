import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ANALYSIS_SERVICE } from '@domain/ports/analysis.port';
import { HttpAnalysisAdapter } from '@infrastructure/api/http-analysis.adapter';
import { routes } from './app.routes';

/**
 * Root application config (Angular standalone bootstrap).
 * Wires the AnalysisServicePort token to its HTTP adapter implementation.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptorsFromDi()),
    HttpAnalysisAdapter,
    { provide: ANALYSIS_SERVICE, useExisting: HttpAnalysisAdapter },
  ],
};