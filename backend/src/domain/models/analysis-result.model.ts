import { ArchitecturePattern, RiskSeverity } from './enums';

/**
 * Identified component (e.g. a controller, service, repository, Angular component).
 */
export interface DetectedComponent {
  readonly type: string;       // "Controller" | "Service" | "Angular Component" | "DTO" | ...
  readonly name: string;
  readonly path: string;
}

/**
 * Concrete evidence (file path or pattern) supporting an architectural inference.
 */
export interface ArchitectureEvidence {
  readonly description: string;
  readonly path?: string;
}

/**
 * Inference of the project's architecture.
 */
export interface ArchitectureInference {
  readonly pattern: ArchitecturePattern;
  readonly confidence: number; // 0..1
  readonly evidence: ReadonlyArray<ArchitectureEvidence>;
  readonly rationale: string;
}

/**
 * Detected external API or integration (HTTP, DB, queue, etc.)
 */
export interface ApiConsumption {
  readonly name: string;       // "Stripe", "PostgreSQL", "AWS S3", ...
  readonly type: 'rest' | 'graphql' | 'database' | 'queue' | 'sdk' | 'other';
  readonly evidence?: string;
}

/**
 * Risk or recommendation raised by the analyzer.
 */
export interface Finding {
  readonly title: string;
  readonly description: string;
  readonly severity: RiskSeverity;
  readonly category: 'security' | 'maintainability' | 'documentation' | 'dependency' | 'performance';
  readonly recommendation: string;
}

/**
 * Aggregated analysis output — pure domain model, framework-free.
 */
export interface AnalysisResult {
  readonly repository: {
    readonly name: string;
    readonly primaryLanguage: string;
    readonly primaryFramework: string;
    readonly fileCount: number;
  };
  readonly functionalSummary: string;
  readonly components: ReadonlyArray<DetectedComponent>;
  readonly architecture: ArchitectureInference;
  readonly apisConsumed: ReadonlyArray<ApiConsumption>;
  readonly findings: ReadonlyArray<Finding>;
  readonly analyzedAt: string; // ISO date
  readonly aiProvider: string; // provider used for the summary ("mock", "openai", ...)
}