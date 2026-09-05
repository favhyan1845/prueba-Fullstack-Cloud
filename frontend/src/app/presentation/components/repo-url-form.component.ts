import { ChangeDetectionStrategy, Component, EventEmitter, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * Section 1 — Input form (public Git URL).
 * Emits an `AnalysisSource` to the parent page.
 */
@Component({
  selector: 'app-repo-url-form',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form (ngSubmit)="onSubmit()" class="space-y-3">
      <label class="block text-sm font-medium text-slate-200">
        URL pública de un repositorio Git
      </label>
      <div class="flex gap-2">
        <input
          type="url"
          name="repoUrl"
          required
          placeholder="https://github.com/usuario/proyecto-demo"
          [(ngModel)]="urlModel"
          class="flex-1 rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-100 ring-1 ring-slate-700 focus:outline-none focus:ring-2 focus:ring-insight-500"
        />
        <button
          type="submit"
          [disabled]="!isValid()"
          class="rounded-lg bg-insight-600 px-4 py-2 text-sm font-semibold text-white hover:bg-insight-700 disabled:opacity-50"
        >
          Analizar
        </button>
      </div>
      <p class="text-xs text-slate-400">
        Solo se admiten URLs HTTPS públicas de GitHub en este MVP. Para repositorios
        privados, usa el cargador de ZIP (únicamente con datos ficticios).
      </p>
    </form>
  `,
})
export class RepoUrlFormComponent {
  urlModel = signal('');
  @Output() submitUrl = new EventEmitter<string>();

  isValid(): boolean {
    return /^https:\/\/(github\.com|gitlab\.com|bitbucket\.org)\/[\w.-]+\/[\w.-]+/.test(this.urlModel().trim());
  }

  onSubmit(): void {
    const v = this.urlModel().trim();
    if (this.isValid()) this.submitUrl.emit(v);
  }
}