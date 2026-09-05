import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AnalysisResult } from '@domain/models/analysis.model';

@Component({
  selector: 'app-components-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-2xl bg-slate-900/70 p-6 ring-1 ring-slate-800 shadow">
      <h2 class="text-lg font-semibold text-slate-50">Components identified ({{ result().components.length }})</h2>
      @if (result().components.length === 0) {
        <p class="mt-3 text-sm text-slate-400">No recognizable components found in this project.</p>
      } @else {
        <ul class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          @for (c of result().components; track c.path) {
            <li class="rounded-lg bg-slate-800/60 p-3 ring-1 ring-slate-700">
              <p class="text-xs font-semibold uppercase text-insight-500">{{ c.type }}</p>
              <p class="mt-1 text-sm text-slate-100 truncate">{{ c.name }}</p>
              <p class="mt-1 truncate font-mono text-[11px] text-slate-400">{{ c.path }}</p>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class ComponentsListComponent {
  result = input.required<AnalysisResult>();
}