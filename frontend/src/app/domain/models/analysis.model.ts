/**
 * Pure domain models (framework-agnostic).
 * Mirrored from the backend response.
 */

export type ArchitecturePattern =
  | 'Monolith'
  | 'MVC'
  | 'Clean Architecture'
  | 'Hexagonal'
  | 'Microservices'
  | 'N-Layer'
  | 'Unknown';

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FindingCategory = 'security' | 'maintainability' | 'documentation' | 'dependency' | 'performance';
export type ApiType = 'rest' | 'graphql' | 'database' | 'queue' | 'sdk' | 'other';

export interface DetectedComponent {
  type: string;
  name: string;
  path: string;
}

export interface ArchitectureEvidence {
  description: string;
  path?: string;
}

export interface ArchitectureInference {
  pattern: ArchitecturePattern;
  confidence: number;
  evidence: ReadonlyArray<ArchitectureEvidence>;
  rationale: string;
}

export interface ApiConsumption {
  name: string;
  type: ApiType;
  evidence?: string;
}

export interface Finding {
  title: string;
  description: string;
  severity: RiskSeverity;
  category: FindingCategory;
  recommendation: string;
}

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
  readonly analyzedAt: string;
  readonly aiProvider: string;
}

export type AnalysisSource =
  | { readonly kind: 'url'; readonly url: string }
  | { readonly kind: 'zip'; readonly file: File };