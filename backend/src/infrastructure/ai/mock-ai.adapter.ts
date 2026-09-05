import { Injectable } from '@nestjs/common';
import { IAISummaryPort } from '../../domain/ports/ai-summary.port';

/**
 * Adaptador determinista de IA (modo simulado).
 * Genera un resumen funcional coherente en español sin llamar a ninguna API externa.
 * Ideal para demostraciones offline, tests y CI.
 *
 * Para reemplazarlo, implementa otro adaptador (OpenAI / Gemini / Ollama / Bedrock)
 * y registra el token correspondiente en el módulo de DI.
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
    const apis = input.apisConsumed.length ? input.apisConsumed.join(', ') : 'sin integraciones externas detectadas';
    const componentsPhrase = compTypes.length
      ? `con componentes de tipo ${compTypes.slice(0, 5).join(', ')}`
      : 'con una huella mínima de componentes';

    return (
      `El proyecto "${input.repositoryName}" es una aplicación en ${input.primaryLanguage} ` +
      `construida con ${input.primaryFramework}, que sigue un patrón de arquitectura ${input.architecture} ` +
      `${componentsPhrase}. Se integra con ${apis}. ` +
      `Con base en ${input.sampleFiles.length} archivo(s) clave inspeccionado(s), el analizador infiere ` +
      `la responsabilidad anterior sin realizar llamadas a APIs externas.`
    );
  }
}