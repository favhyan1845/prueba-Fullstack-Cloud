import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AnalysisStore } from '@application/analysis.store';
import { AnalysisSource } from '@domain/models/analysis.model';
import { RepoUrlFormComponent } from '../components/repo-url-form.component';
import { RepoZipUploaderComponent } from '../components/repo-zip-uploader.component';
import { AnalysisSummaryComponent } from '../components/analysis-summary.component';
import { FindingsComponent } from '../components/findings.component';
import { ComponentsListComponent } from '../components/components-list.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    RepoUrlFormComponent,
    RepoZipUploaderComponent,
    AnalysisSummaryComponent,
    FindingsComponent,
    ComponentsListComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-5xl px-4 py-10 space-y-8">
      <header class="space-y-2">
        <h1 class="text-4xl font-extrabold text-slate-50">Code Insight AI</h1>
        <p class="text-slate-300">
          Ingeniería inversa automatizada de repositorios. Pega una URL pública de Git
          o sube un archivo ZIP para obtener un resumen funcional, la arquitectura
          inferida y hallazgos accionables sobre tu proyecto.
        </p>
      </header>

      <!-- Sección 1: Entrada -->
      <section class="rounded-2xl bg-slate-900/70 p-6 ring-1 ring-slate-800 shadow space-y-4">
        <h2 class="text-lg font-semibold text-slate-50">1. Cargar un repositorio</h2>
        <app-repo-url-form (submitUrl)="onUrl($event)" />
        <div class="border-t border-slate-800 pt-4">
          <app-repo-zip-uploader (fileSelected)="onZip($event)" />
        </div>
      </section>

      <!-- Cargando / Error -->
      @if (store.loading()) {
        <p class="text-slate-300 animate-pulse">Analizando el repositorio… esto puede tardar unos segundos.</p>
      }
      @if (store.error(); as e) {
        <p class="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/40">
          {{ e }}
        </p>
      }

      <!-- Sección 2: Resultado -->
      @if (store.result(); as r) {
        <h2 class="text-lg font-semibold text-slate-50">2. Resultado del análisis</h2>
        <app-analysis-summary [result]="r" />

        <!-- Sección 3: Componentes y Recomendaciones -->
        <h2 class="text-lg font-semibold text-slate-50">3. Hallazgos</h2>
        <app-findings [result]="r" />
        <app-components-list [result]="r" />
      }
    </main>
  `,
})
export class HomePageComponent {
  readonly store = inject(AnalysisStore);

  onUrl(url: string): void {
    const source: AnalysisSource = { kind: 'url', url };
    void this.store.analyze(source);
  }

  onZip(file: File): void {
    const source: AnalysisSource = { kind: 'zip', file };
    void this.store.analyze(source);
  }
}