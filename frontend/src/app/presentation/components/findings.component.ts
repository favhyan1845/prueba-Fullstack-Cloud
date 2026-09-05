import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AnalysisResult, Finding } from '@domain/models/analysis.model';

@Component({
  selector: 'app-findings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-2xl bg-slate-900/70 p-6 ring-1 ring-slate-800 shadow">
      <h2 class="text-lg font-semibold text-slate-50">Findings & Recommendations</h2>

      @if (result().findings.length === 0) {
        <p class="mt-3 text-sm text-slate-300">
          No critical issues detected. 🎉 Your repository follows solid practices.
        </p>
      } @else {
        <ul class="mt-4 space-y-3">
          @for (f of ordered(); track f.title) {
            <li class="rounded-xl bg-slate-800/60 p-4 ring-1 ring-slate-700">
              <div class="flex items-start justify-between gap-3">
                <h3 class="text-sm font-semibold text-slate-100">{{ f.title }}</h3>
                <span class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1"
                  [class]="severityClasses(f.severity)">
                  {{ f.severity }}
                </span>
              </div>
              <p class="mt-1 text-sm text-slate-300">{{ f.description }}</p>
              <p class="mt-2 text-xs text-slate-400">
                <span class="font-semibold text-slate-300">Recommendation:</span> {{ f.recommendation }}
              </p>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class FindingsComponent {
  result = input.required<AnalysisResult>();
  ordered = (): ReadonlyArray<Finding> =>
    [...this.result().findings].sort((a, b) => severityRank(b.severity) - severityRank(a.severity));

  severityClasses(s: Finding['severity']): string {
    return {
      critical: 'bg-red-500/20 text-red-300 ring-red-500/40',
      high:     'bg-orange-500/20 text-orange-300 ring-orange-500/40',
      medium:   'bg-amber-500/20 text-amber-300 ring-amber-500/40',
      low:      'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40',
    }[s];
  }
}

function severityRank(s: Finding['severity']): number {
  return ({ critical: 4, high: 3, medium: 2, low: 1 } as const)[s];
}