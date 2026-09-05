import { ChangeDetectionStrategy, Component, EventEmitter, Output, signal } from '@angular/core';

/**
 * Section 1 — ZIP uploader (multipart/form-data).
 */
@Component({
  selector: 'app-repo-zip-uploader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="block text-sm font-medium text-slate-200 mb-2">
      Or upload a ZIP archive of the project
    </label>
    <input
      type="file"
      accept=".zip"
      (change)="onFile($event)"
      class="block w-full text-sm text-slate-100 file:mr-3 file:rounded-lg file:border-0 file:bg-insight-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-insight-700"
    />
    @if (file(); as f) {
      <p class="mt-2 text-xs text-slate-400">
        Selected: <span class="font-mono">{{ f.name }}</span> · {{ (f.size / 1024).toFixed(1) }} KB
      </p>
    }
  `,
})
export class RepoZipUploaderComponent {
  file = signal<File | null>(null);
  @Output() fileSelected = new EventEmitter<File>();

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    this.file.set(f);
    if (f) this.fileSelected.emit(f);
  }
}