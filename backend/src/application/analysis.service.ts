import { Inject, Injectable } from '@nestjs/common';
import {
  AI_SUMMARY_PORT,
  AnalyzeRepositoryUseCase,
  IRepositoryAnalyzer,
  IRepositoryFetcher,
  RepositorySource,
} from '../domain';
import { REPOSITORY_ANALYZER } from '../domain/ports/repository-analyzer.port';
import { REPOSITORY_FETCHER } from '../domain/ports/repository-fetcher.port';
import { AI_SUMMARY_PORT as AI_SUMMARY_TOKEN } from '../domain/ports/ai-summary.port';
import { AnalysisResult } from '../domain/models';

/**
 * Application service — exposes the use case to the outside world (HTTP, CLI, etc.).
 * It binds ports to Nest DI tokens and reuses the pure domain use case.
 */
@Injectable()
export class AnalysisService {
  private readonly useCase: AnalyzeRepositoryUseCase;

  constructor(
    @Inject(REPOSITORY_FETCHER) fetcher: IRepositoryFetcher,
    @Inject(REPOSITORY_ANALYZER) analyzer: IRepositoryAnalyzer,
    @Inject(AI_SUMMARY_TOKEN) ai: import('../domain/ports/ai-summary.port').IAISummaryPort,
  ) {
    this.useCase = new AnalyzeRepositoryUseCase(fetcher, analyzer, ai);
  }

  analyze(source: RepositorySource): Promise<AnalysisResult> {
    return this.useCase.execute(source);
  }
}