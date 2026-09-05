import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AnalysisResult } from '@domain/models/analysis.model';

@Component({
  selector: 'app-analysis-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (result(); as r) {
        <article class="rounded-2xl bg-slate-900/70 p-6 ring-1 ring-slate-800 shadow">
          <header class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-2xl font-bold text-slate-50">{{ r.repository.name }}</h2>
              <p class="text-sm text-slate-400 mt-1">
                {{ r.repository.primaryLanguage }} · {{ r.repository.primaryFramework }} ·
                <span class="font-mono">{{ r.repository.fileCount }}</span> archivos
              </p>
            </div>
            <span class="rounded-full bg-insight-600/20 px-3 py-1 text-xs font-semibold text-insight-500 ring-1 ring-insight-600/40">
              IA: {{ r.aiProvider }}
            </span>
          </header>

          <section class="mt-6">
            <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-300">Resumen funcional</h3>
            <p class="mt-2 text-slate-100 leading-relaxed">{{ r.functionalSummary }}</p>
          </section>

          <section class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="rounded-xl bg-slate-800/60 p-4 ring-1 ring-slate-700">
              <p class="text-xs uppercase text-slate-400">Arquitectura</p>
              <p class="mt-1 text-lg font-bold text-insight-500">{{ r.architecture.pattern }}</p>
              <p class="text-xs text-slate-400 mt-1">
                Confianza: {{ (r.architecture.confidence * 100).toFixed(0) }}%
              </p>
              <p class="mt-2 text-xs text-slate-300">{{ r.architecture.rationale }}</p>
            </div>
            <div class="rounded-xl bg-slate-800/60 p-4 ring-1 ring-slate-700">
              <p class="text-xs uppercase text-slate-400">Lenguajes detectados</p>
              <ul class="mt-2 space-y-1 text-sm text-slate-100">
                @for (lang of r.architecture.pattern ? topLanguages(r) : []; track lang.language) {
                  <li class="flex justify-between">
                    <span>{{ lang.language }}</span>
                    <span class="font-mono text-slate-400">{{ (lang.weight * 100).toFixed(0) }}%</span>
                  </li>
                }
                @if (!languagesAvailable(r)) {
                  <li class="text-slate-400 text-xs">Sin información de lenguajes.</li>
                }
              </ul>
            </div>
            <div class="rounded-xl bg-slate-800/60 p-4 ring-1 ring-slate-700">
              <p class="text-xs uppercase text-slate-400">APIs consumidas</p>
              @if (r.apisConsumed.length === 0) {
                <p class="mt-2 text-xs text-slate-400">No se detectaron integraciones externas.</p>
              } @else {
                <ul class="mt-2 flex flex-wrap gap-1.5">
                  @for (api of r.apisConsumed; track api.name) {
                    <li class="rounded-md bg-slate-900 px-2 py-1 text-xs text-slate-200 ring-1 ring-slate-700">
                      {{ api.name }} <span class="text-slate-500">·{{ api.type }}</span>
                    </li>
                  }
                </ul>
              }
            </div>
          </section>
        </article>
      }
  `,
})
export class AnalysisSummaryComponent {
  result = input.required<AnalysisResult>();
  // No tenemos `languages` en la respuesta; exponemos helpers vacíos seguros.
  topLanguages(_r: AnalysisResult): Array<{ language: string; weight: number }> { return []; }
  languagesAvailable(_r: AnalysisResult): boolean { return false; }
}