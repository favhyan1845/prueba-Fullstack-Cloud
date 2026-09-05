import { AnalysisResult, AnalysisSource } from '../models/analysis.model';

/**
 * Port — Application-layer use case exposed to the presentation layer.
 * Implementations live under `infrastructure/api/`.
 *
 * The token is a plain Symbol so the domain remains framework-agnostic.
 * The DI wiring lives in `infrastructure/di/angular-providers.ts` and
 * `app.config.ts`; this file imports neither.
 */
export interface AnalysisServicePort {
  analyze(source: AnalysisSource): Promise<AnalysisResult>;
}

export const ANALYSIS_SERVICE = Symbol('ANALYSIS_SERVICE');
export type AnalysisServiceToken = typeof ANALYSIS_SERVICE;