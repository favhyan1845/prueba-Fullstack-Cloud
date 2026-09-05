import { AnalysisResult } from '../models';
import { IRepositoryFetcher, RepositorySource } from '../ports/repository-fetcher.port';
import { IRepositoryAnalyzer } from '../ports/repository-analyzer.port';
import { IAISummaryPort } from '../ports/ai-summary.port';

/**
 * AnalyzeRepositoryUseCase — orchestrates the complete analysis flow:
 *
 *  1. fetch the repository (git clone or zip extract)
 *  2. inspect the working copy (metadata, languages, key files)
 *  3. run static analysis (components, architecture, APIs, findings)
 *  4. ask the AI port for a functional summary
 *  5. assemble a domain `AnalysisResult`
 *  6. cleanup the temporary working copy
 *
 * The use case only depends on PORTS (interfaces), never on concrete adapters.
 */
export class AnalyzeRepositoryUseCase {
  constructor(
    private readonly fetcher: IRepositoryFetcher,
    private readonly analyzer: IRepositoryAnalyzer,
    private readonly ai: IAISummaryPort,
  ) {}

  async execute(source: RepositorySource): Promise<AnalysisResult> {
    const { localPath, name } = await this.fetcher.fetch(source);

    try {
      const info = await this.analyzer.inspect(localPath);
      const heuristicAnalysis = await this.analyzer.analyze(info);

      const summary = await this.ai.generateFunctionalSummary({
        repositoryName: info.name,
        primaryLanguage: info.primaryLanguage,
        primaryFramework: info.primaryFramework,
        components: heuristicAnalysis.components.map((c) => ({ type: c.type, name: c.name })),
        apisConsumed: heuristicAnalysis.apisConsumed.map((a) => a.name),
        architecture: heuristicAnalysis.architecture.pattern,
        sampleFiles: info.keyFilePaths,
      });

      return {
        ...heuristicAnalysis,
        functionalSummary: summary,
        analyzedAt: new Date().toISOString(),
        aiProvider: this.ai.providerName,
      };
    } finally {
      await this.fetcher.cleanup(localPath);
    }
  }
}