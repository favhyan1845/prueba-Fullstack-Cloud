/** Supported architectural patterns recognized by the analyzer. */
export enum ArchitecturePattern {
  MONOLITH = 'Monolith',
  MVC = 'MVC',
  CLEAN = 'Clean Architecture',
  HEXAGONAL = 'Hexagonal',
  MICROSERVICES = 'Microservices',
  N_LAYER = 'N-Layer',
  UNKNOWN = 'Unknown',
}

/** Severity levels for findings / risks. */
export enum RiskSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/** Allowed repository input sources. */
export enum RepositorySourceType {
  URL = 'url',
  ZIP = 'zip',
}