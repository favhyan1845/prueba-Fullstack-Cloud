import { AnalyzeRepositoryUseCase } from '../src/domain/use-cases/analyze-repository.use-case';
import { AnalysisResult, RepositoryInfo } from '../src/domain/models';
import {
  IRepositoryFetcher,
  RepositorySource,
} from '../src/domain/ports/repository-fetcher.port';
import { IRepositoryAnalyzer } from '../src/domain/ports/repository-analyzer.port';
import { IAISummaryPort } from '../src/domain/ports/ai-summary.port';
import { ArchitecturePattern, RepositorySourceType, RiskSeverity } from '../src/domain/models/enums';

/**
 * Tests for the pure domain use case.
 * No NestJS, no HTTP, no AI - just orchestration logic over ports.
 */

const dummyInfo: RepositoryInfo = {
  name: 'demo',
  primaryLanguage: 'TypeScript',
  primaryFramework: 'NestJS',
  fileCount: 10,
  rootPath: '/tmp/demo',
  languages: [{ language: 'TypeScript', weight: 1 }],
  keyFilePaths: ['package.json', 'README.md'],
};

const dummyResult: Omit<AnalysisResult, 'analyzedAt' | 'aiProvider'> = {
  repository: {
    name: 'demo',
    primaryLanguage: 'TypeScript',
    primaryFramework: 'NestJS',
    fileCount: 10,
  },
  functionalSummary: '',
  components: [{ type: 'Controller', name: 'FooController', path: 'src/foo.controller.ts' }],
  architecture: {
    pattern: ArchitecturePattern.HEXAGONAL,
    confidence: 0.9,
    evidence: [{ description: 'domain/ application/ infrastructure/' }],
    rationale: 'Hexagonal',
  },
  apisConsumed: [],
  findings: [
    {
      title: 'No tests detected',
      description: '...',
      severity: RiskSeverity.MEDIUM,
      category: 'maintainability',
      recommendation: '...',
    },
  ],
};

function makeFetcher(): jest.Mocked<IRepositoryFetcher> {
  return {
    fetch: jest.fn().mockResolvedValue({ localPath: '/tmp/demo', name: 'demo' }),
    cleanup: jest.fn().mockResolvedValue(undefined),
  };
}

function makeAnalyzer(): jest.Mocked<IRepositoryAnalyzer> {
  return {
    inspect: jest.fn().mockResolvedValue(dummyInfo),
    analyze: jest.fn().mockResolvedValue(dummyResult),
  };
}

function makeAI(): jest.Mocked<IAISummaryPort> {
  return {
    providerName: 'mock',
    generateFunctionalSummary: jest.fn().mockResolvedValue('A NestJS REST API.'),
  };
}

describe('AnalyzeRepositoryUseCase', () => {
  it('orchestrates fetch → inspect → analyze → AI summary → cleanup', async () => {
    const fetcher = makeFetcher();
    const analyzer = makeAnalyzer();
    const ai = makeAI();

    const useCase = new AnalyzeRepositoryUseCase(fetcher, analyzer, ai);
    const source: RepositorySource = { type: RepositorySourceType.ZIP, zipBuffer: Buffer.from('x') };

    const result = await useCase.execute(source);

    expect(fetcher.fetch).toHaveBeenCalledWith(source);
    expect(analyzer.inspect).toHaveBeenCalledWith('/tmp/demo');
    expect(analyzer.analyze).toHaveBeenCalledWith(dummyInfo);
    expect(ai.generateFunctionalSummary).toHaveBeenCalled();
    expect(fetcher.cleanup).toHaveBeenCalledWith('/tmp/demo');

    expect(result.functionalSummary).toBe('A NestJS REST API.');
    expect(result.aiProvider).toBe('mock');
    expect(result.architecture.pattern).toBe(ArchitecturePattern.HEXAGONAL);
    expect(result.components).toHaveLength(1);
    expect(typeof result.analyzedAt).toBe('string');
  });

  it('still cleans up the temp directory even when the analyzer fails', async () => {
    const fetcher = makeFetcher();
    const analyzer = makeAnalyzer();
    analyzer.analyze.mockRejectedValueOnce(new Error('boom'));
    const ai = makeAI();

    const useCase = new AnalyzeRepositoryUseCase(fetcher, analyzer, ai);

    await expect(
      useCase.execute({ type: RepositorySourceType.ZIP, zipBuffer: Buffer.from('x') }),
    ).rejects.toThrow('boom');

    expect(fetcher.cleanup).toHaveBeenCalledWith('/tmp/demo');
  });
});