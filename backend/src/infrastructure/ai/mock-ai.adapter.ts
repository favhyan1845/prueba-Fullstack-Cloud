import { Injectable } from '@nestjs/common';
import { IAISummaryPort } from '../../domain/ports/ai-summary.port';

/**
 * Deterministic mock AI adapter.
 * Generates a coherent functional summary without calling any external API.
 * Perfect for offline demos, tests and CI.
 *
 * Swap by implementing another adapter (OpenAI / Gemini / Ollama / Bedrock) and
 * binding the right token in the DI module.
 */
@Injectable()
export class MockAIAdapter implements IAISummaryPort {
  readonly providerName = 'mock';

  async generateFunctionalSummary(input: {
    repositoryName: string;
    primaryLanguage: string;
    primaryFramework: string;
    components: ReadonlyArray<{ type: string; name: string }>;
    apisConsumed: ReadonlyArray<string>;
    architecture: string;
    sampleFiles: ReadonlyArray<string>;
  }): Promise<string> {
    const compTypes = Array.from(new Set(input.components.map((c) => c.type)));
    const apis = input.apisConsumed.length ? input.apisConsumed.join(', ') : 'no external integrations detected';
    const componentsPhrase = compTypes.length
      ? `with ${compTypes.slice(0, 5).join(', ')} components`
      : 'with a minimal component footprint';

    return (
      `This project ("${input.repositoryName}") is a ${input.primaryLanguage} application built with ${input.primaryFramework}, ` +
      `following a ${input.architecture} pattern ${componentsPhrase}. ` +
      `It integrates with ${apis}. ` +
      `Based on ${input.sampleFiles.length} key file(s) inspected, the analyzer infers the responsibility above without making external API calls.`
    );
  }
}