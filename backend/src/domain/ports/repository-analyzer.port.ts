import { AnalysisResult, RepositoryInfo } from '../models';

/**
 * Input port — Static analysis over a checked-out repository.
 * Implementations can be heuristic (rule-based) or hybrid (heuristic + AI).
 */
export interface IRepositoryAnalyzer {
  /**
   * Inspects the repository and returns structural metadata.
   */
  inspect(localPath: string): Promise<RepositoryInfo>;

  /**
   * Produces a complete analysis (heuristics + AI-assisted summary).
   */
  analyze(info: RepositoryInfo): Promise<Omit<AnalysisResult, 'analyzedAt' | 'aiProvider'>>;
}

/** Injection token. */
export const REPOSITORY_ANALYZER = Symbol('REPOSITORY_ANALYZER');