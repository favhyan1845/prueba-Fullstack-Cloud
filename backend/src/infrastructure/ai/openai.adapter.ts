import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { IAISummaryPort } from '../../domain/ports/ai-summary.port';

interface SummaryInput {
  repositoryName: string;
  primaryLanguage: string;
  primaryFramework: string;
  components: ReadonlyArray<{ type: string; name: string }>;
  apisConsumed: ReadonlyArray<string>;
  architecture: string;
  sampleFiles: ReadonlyArray<string>;
}

/**
 * OpenAI adapter.
 *
 * Activated when:
 *   AI_PROVIDER=openai
 *   OPENAI_API_KEY=sk-...
 *
 * Falls back to a deterministic message (NOT to MockAIAdapter) if the API call
 * fails, so the API surface never crashes. Never logs or echoes the key.
 */
@Injectable()
export class OpenAIAdapter implements IAISummaryPort {
  private readonly logger = new Logger(OpenAIAdapter.name);
  readonly providerName = 'openai';
  private readonly client: OpenAI | null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey && apiKey.length > 8) {
      this.client = new OpenAI({ apiKey });
    } else {
      this.client = null;
      this.logger.warn('OPENAI_API_KEY missing - generateFunctionalSummary will return a placeholder.');
    }
  }

  async generateFunctionalSummary(input: SummaryInput): Promise<string> {
    if (!this.client) {
      return `(OpenAI disabled: missing API key) Project "${input.repositoryName}" appears to be a ${input.primaryFramework} app following ${input.architecture}.`;
    }

    const model = this.config.get<string>('AI_MODEL', 'gpt-4o-mini');
    const prompt = [
      'You are a senior software engineer. Write a one-sentence functional description of a repository.',
      'Use the example style: "REST API for customer management that allows creating, querying, updating and deleting records using Spring Boot and PostgreSQL."',
      '',
      `Project name: ${input.repositoryName}`,
      `Primary language: ${input.primaryLanguage}`,
      `Primary framework: ${input.primaryFramework}`,
      `Architecture pattern: ${input.architecture}`,
      `Components (first 20): ${input.components.slice(0, 20).map((c) => c.type + ':' + c.name).join(', ') || 'none'}`,
      `APIs consumed: ${input.apisConsumed.join(', ') || 'none detected'}`,
      `Key files: ${input.sampleFiles.slice(0, 10).join(', ') || 'none'}`,
    ].join('\n');

    try {
      const completion = await this.client.chat.completions.create({
        model,
        temperature: 0.2,
        max_tokens: 120,
        messages: [
          { role: 'system', content: 'You write concise, factual repository summaries.' },
          { role: 'user', content: prompt },
        ],
      });
      const text = completion.choices[0]?.message?.content?.trim();
      if (text) return text;
      this.logger.warn('OpenAI returned an empty completion; falling back.');
      return `(OpenAI: empty response) ${input.repositoryName} - ${input.primaryFramework} / ${input.architecture}.`;
    } catch (err) {
      this.logger.error(`OpenAI call failed: ${(err as Error).message}`);
      return `(OpenAI: error) ${input.repositoryName} - ${input.primaryFramework} / ${input.architecture}.`;
    }
  }
}