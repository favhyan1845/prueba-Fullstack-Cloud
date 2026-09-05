/**
 * Port — Generates a natural-language functional summary of the analyzed repository.
 * The domain defines this contract; the infrastructure provides one or more
 * adapters (Mock, Gemini, OpenAI, Ollama, Bedrock, Anthropic, ...).
 */
export interface IAISummaryPort {
  /** Logical provider name, used for transparency in responses. */
  readonly providerName: string;

  /**
   * Produces a concise functional description, e.g.
   * "REST API for customer management that allows creating, querying,
   * updating and deleting records using Spring Boot and PostgreSQL."
   */
  generateFunctionalSummary(input: {
    repositoryName: string;
    primaryLanguage: string;
    primaryFramework: string;
    components: ReadonlyArray<{ type: string; name: string }>;
    apisConsumed: ReadonlyArray<string>;
    architecture: string;
    sampleFiles: ReadonlyArray<string>;
  }): Promise<string>;

  /** (Optional) Suggests risks/recommendations in natural language. */
  suggestFindings?(input: {
    repositoryName: string;
    evidence: ReadonlyArray<string>;
  }): Promise<ReadonlyArray<{ title: string; description: string; recommendation: string }>>;
}

/** Injection token. */
export const AI_SUMMARY_PORT = Symbol('AI_SUMMARY_PORT');