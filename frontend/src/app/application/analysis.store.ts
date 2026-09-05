import { Inject, Injectable, computed, signal } from '@angular/core';
import { ANALYSIS_SERVICE, AnalysisServicePort } from '@domain/ports/analysis.port';
import { AnalysisResult, AnalysisSource } from '@domain/models/analysis.model';

/**
 * Application service — Signal-based store that drives the UI.
 * It only depends on the AnalysisServicePort (never on HttpClient directly).
 */
@Injectable({ providedIn: 'root' })
export class AnalysisStore {
  constructor(@Inject(ANALYSIS_SERVICE) private readonly service: AnalysisServicePort) {}

  // ─── State
  private readonly _result = signal<AnalysisResult | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // ─── Selectors
  readonly result = this._result.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly hasResult = computed(() => this._result() !== null);
  readonly criticalFindings = computed(
    () => this._result()?.findings.filter((f) => f.severity === 'critical' || f.severity === 'high') ?? [],
  );

  async analyze(source: AnalysisSource): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._result.set(null);
    try {
      const r = await this.service.analyze(source);
      this._result.set(r);
    } catch (err) {
      this._error.set(this.toMessage(err));
    } finally {
      this._loading.set(false);
    }
  }

  reset(): void {
    this._result.set(null);
    this._error.set(null);
  }

  private toMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && err && 'message' in err) return String((err as { message: unknown }).message);
    return 'Unexpected error while analyzing the repository.';
  }
}