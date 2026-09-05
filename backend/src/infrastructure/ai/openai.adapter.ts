import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAISummaryPort } from '../../domain/ports/ai-summary.port';

/**
 * OpenAI adapter (skeleton — to be enabled with a real API key).
 *
 * To activate:
 *  1. Set `AI_PROVIDER=openai` and `OPENAI_API_KEY=sk-...` in .env
 *  2. `npm install openai` (or `npm install openai@^4`)
 *  3. Implement the `client.chat.completions.create` call below
 */
@Injectable()
export class OpenAIAdapter implements IAISummaryPort {
  private readonly logger = new Logger(OpenAIAdapter.name);
  readonly providerName = 'openai';

  constructor(private readonly config: ConfigService) {}

  async generateFunctionalSummary(_input: {
    repositoryName: string;
    primaryLanguage: string;
    primaryFramework: string;
    components: ReadonlyArray<{ type: string; name: string }>;
    apisConsumed: ReadonlyArray<string>;
    architecture: string;
    sampleFiles: ReadonlyArray<string>;
  }): Promise<string> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    const model = this.config.get<string>('AI_MODEL', 'gpt-4o-mini');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not set — falling back to a basic deterministic summary.');
    }
    // TODO: integrate OpenAI SDK (e.g. `import OpenAI from 'openai'`)
    // const client = new OpenAI({ apiKey });
    // const completion = await client.chat.completions.create({ model, messages: [...] });
    return `[OpenAI:${model}] (placeholder) Functional summary disabled until the SDK call is wired.`;
  }
}