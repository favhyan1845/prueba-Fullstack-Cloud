import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AI_SUMMARY_PORT } from '../../domain/ports/ai-summary.port';
import { MockAIAdapter } from './mock-ai.adapter';
import { OpenAIAdapter } from './openai.adapter';

export const AI_PROVIDER_TOKEN = 'AI_PROVIDER';

/**
 * Wires the IAISummaryPort token to the concrete adapter chosen via env.
 * Adding a new provider (Gemini, Anthropic, Ollama, Bedrock) only requires:
 *   1. A new adapter implementing `IAISummaryPort`
 *   2. A new branch in the factory below
 * The domain never changes.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    MockAIAdapter,
    OpenAIAdapter,
    {
      provide: AI_PROVIDER_TOKEN,
      inject: [ConfigService, MockAIAdapter, OpenAIAdapter],
      useFactory: (cfg: ConfigService, mock: MockAIAdapter, openai: OpenAIAdapter) => {
        const provider = (cfg.get<string>('AI_PROVIDER') ?? 'mock').toLowerCase();
        switch (provider) {
          case 'openai':
            return openai;
          case 'mock':
          default:
            return mock;
        }
      },
    },
    {
      provide: AI_SUMMARY_PORT,
      useExisting: AI_PROVIDER_TOKEN,
    },
  ],
  exports: [AI_SUMMARY_PORT],
})
export class AiModule {}