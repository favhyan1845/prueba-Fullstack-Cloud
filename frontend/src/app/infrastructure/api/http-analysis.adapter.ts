import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AnalysisResult, AnalysisSource } from '@domain/models/analysis.model';
import { AnalysisServicePort } from '@domain/ports/analysis.port';

/**
 * HTTP adapter for the AnalysisServicePort.
 * Talks to the NestJS API at /api/v1/analysis/{url|zip}.
 */
@Injectable({ providedIn: 'root' })
export class HttpAnalysisAdapter implements AnalysisServicePort {
  constructor(private readonly http: HttpClient) {}

  async analyze(source: AnalysisSource): Promise<AnalysisResult> {
    if (source.kind === 'url') {
      return firstValueFrom(
        this.http.post<AnalysisResult>('/api/v1/analysis/url', { url: source.url }),
      );
    }

    const form = new FormData();
    form.append('file', source.file, source.file.name);
    return firstValueFrom(this.http.post<AnalysisResult>('/api/v1/analysis/zip', form));
  }
}