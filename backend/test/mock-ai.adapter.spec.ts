import { MockAIAdapter } from '../src/infrastructure/ai/mock-ai.adapter';

/**
 * Tests for the MockAIAdapter (deterministic, offline summary generator).
 * Verifies the adapter implements IAISummaryPort correctly.
 */

describe('MockAIAdapter', () => {
  const adapter = new MockAIAdapter();

  it('exposes a stable provider name', () => {
    expect(adapter.providerName).toBe('mock');
  });

  it('returns a non-empty summary mentioning the framework and architecture', async () => {
    const summary = await adapter.generateFunctionalSummary({
      repositoryName: 'acme',
      primaryLanguage: 'TypeScript',
      primaryFramework: 'NestJS',
      components: [{ type: 'Controller', name: 'Foo' }],
      apisConsumed: ['MongoDB'],
      architecture: 'Hexagonal',
      sampleFiles: ['package.json', 'src/main.ts'],
    });
    expect(summary.length).toBeGreaterThan(10);
    expect(summary).toContain('acme');
    expect(summary).toContain('NestJS');
    expect(summary).toContain('Hexagonal');
    expect(summary).toContain('MongoDB');
  });

  it('handles an empty API integration list gracefully', async () => {
    const summary = await adapter.generateFunctionalSummary({
      repositoryName: 'no-apis',
      primaryLanguage: 'Python',
      primaryFramework: 'Python',
      components: [],
      apisConsumed: [],
      architecture: 'Monolith',
      sampleFiles: [],
    });
    expect(summary).toContain('sin integraciones externas detectadas');
  });
});