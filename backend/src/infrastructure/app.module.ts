import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AnalyzeController } from './http/analyze.controller';
import { AnalysisService } from '../application/analysis.service';
import { AnalyzeRepositoryUseCase } from '../domain/use-cases/analyze-repository.use-case';
import { REPOSITORY_FETCHER } from '../domain/ports/repository-fetcher.port';
import { REPOSITORY_ANALYZER } from '../domain/ports/repository-analyzer.port';
import { AI_SUMMARY_PORT } from '../domain/ports/ai-summary.port';
import { FsRepositoryFetcher } from './repositories/fs-repository.fetcher';
import { HeuristicAnalyzerAdapter } from './repositories/heuristic-analyzer.adapter';
import { AiModule } from './ai/ai.module';

/**
 * Infrastructure composition root.
 *
 * Domain knows nothing about NestJS — this module is the ONLY place where
 * adapters are wired to their ports.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AiModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'),
      serveRoot: '/',
    }),
  ],
  controllers: [AnalyzeController],
  providers: [
    AnalysisService,
    AnalyzeRepositoryUseCase,
    { provide: REPOSITORY_FETCHER, useClass: FsRepositoryFetcher },
    { provide: REPOSITORY_ANALYZER, useClass: HeuristicAnalyzerAdapter },
    // AI_SUMMARY_PORT is provided by AiModule
  ],
  exports: [AnalysisService],
})
export class AppModule {}