import { promises as fs } from 'fs';
import { join, relative } from 'path';
import ignore from 'ignore';
import { Injectable, Logger } from '@nestjs/common';
import {
  AnalysisResult,
  ApiConsumption,
  ArchitectureEvidence,
  ArchitecturePattern,
  DetectedComponent,
  Finding,
  RepositoryInfo,
  RiskSeverity,
} from '../../domain/models';
import { IRepositoryAnalyzer } from '../../domain/ports/repository-analyzer.port';

interface FileHit { path: string; content?: string; }

const EXT_TO_LANG: Record<string, string> = {
  ts: 'TypeScript', js: 'JavaScript', tsx: 'TypeScript', jsx: 'JavaScript',
  java: 'Java', kt: 'Kotlin', py: 'Python', go: 'Go', rb: 'Ruby',
  php: 'PHP', cs: 'C#', cpp: 'C++', c: 'C', swift: 'Swift', rs: 'Rust',
  html: 'HTML', css: 'CSS', scss: 'SCSS', vue: 'Vue', svelte: 'Svelte',
  json: 'JSON', yml: 'YAML', yaml: 'YAML', md: 'Markdown',
};

/**
 * Adapter - pure heuristics implementation of IRepositoryAnalyzer.
 */
@Injectable()
export class HeuristicAnalyzerAdapter implements IRepositoryAnalyzer {
  private readonly logger = new Logger(HeuristicAnalyzerAdapter.name);
  private readonly maxFilesScanned = 4000;
  private readonly ig = ignore().add([
    'node_modules', 'dist', 'build', 'coverage', '.git', '.idea', '.vscode',
    'out', '.next', '.angular', 'tmp', '.env', '.env.*', '*.log',
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  ]);

  async inspect(localPath: string): Promise<RepositoryInfo> {
    const allFiles = await this.walk(localPath);
    const fileCount = allFiles.length;
    const languages = this.detectLanguages(allFiles);
    const primaryLanguage = languages[0]?.language ?? 'Unknown';
    const keyFilePaths = allFiles
      .filter((f) => this.isKeyFile(f.path))
      .map((f) => relative(localPath, f.path));
    const name = await this.detectName(localPath, allFiles, keyFilePaths);
    const primaryFramework = this.detectFramework(allFiles, keyFilePaths, primaryLanguage);
    return { name, primaryLanguage, primaryFramework, fileCount, rootPath: localPath, languages, keyFilePaths };
  }

  async analyze(info: RepositoryInfo): Promise<Omit<AnalysisResult, 'analyzedAt' | 'aiProvider'>> {
    const localPath = info.rootPath;
    const allFiles = await this.walk(localPath, true);
    const components = this.detectComponents(allFiles, info.primaryLanguage);
    const architecture = this.inferArchitecture(allFiles);
    const apisConsumed = this.detectApis(allFiles);
    const findings = this.detectFindings(allFiles, info);
    return {
      repository: {
        name: info.name,
        primaryLanguage: info.primaryLanguage,
        primaryFramework: info.primaryFramework,
        fileCount: info.fileCount,
      },
      functionalSummary: '',
      components,
      architecture,
      apisConsumed,
      findings,
    };
  }


  private async walk(root: string, withContent = false): Promise<FileHit[]> {
    const out: FileHit[] = [];
    const stack = [root];
    while (stack.length) {
      const dir = stack.pop()!;
      let entries: import('fs').Dirent[] = [];
      try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { continue; }
      for (const entry of entries) {
        const full = join(dir, entry.name);
        const rel = relative(root, full);
        if (this.ig.ignores(rel)) continue;
        if (out.length >= this.maxFilesScanned) return out;
        if (entry.isDirectory()) {
          stack.push(full);
        } else if (entry.isFile()) {
          if (!withContent) { out.push({ path: full }); continue; }
          try {
            const stat = await fs.stat(full);
            if (stat.size > 1024 * 256) { out.push({ path: full }); continue; }
            const content = await fs.readFile(full, 'utf8');
            out.push({ path: full, content });
          } catch { out.push({ path: full }); }
        }
      }
    }
    return out;
  }

  private isKeyFile(path: string): boolean {
    const f = path.replace(/\\/g, '/').toLowerCase();
    return /(readme|package\.json|tsconfig\.json|angular\.json|nest-cli\.json|pom\.xml|build\.gradle|requirements\.txt|go\.mod|cargo\.toml|composer\.json|gemfile)$/.test(f);
  }

  private detectLanguages(files: FileHit[]): Array<{ language: string; weight: number }> {
    const counts: Record<string, number> = {};
    for (const f of files) {
      const ext = f.path.split('.').pop()!.toLowerCase();
      const lang = EXT_TO_LANG[ext];
      if (lang) counts[lang] = (counts[lang] ?? 0) + 1;
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts)
      .map(([language, c]) => ({ language, weight: +(c / total).toFixed(3) }))
      .sort((a, b) => b.weight - a.weight);
  }

  private async detectName(root: string, files: FileHit[], keyPaths: string[]): Promise<string> {
    for (const k of keyPaths) {
      if (k.endsWith('package.json')) {
        try {
          const content = await fs.readFile(join(root, k), 'utf8');
          const json = JSON.parse(content);
          if (json.name) return String(json.name);
        } catch {/* noop */}
      }
    }
    return root.split(/[\\/]/).pop() ?? 'unknown';
  }

  private detectFramework(files: FileHit[], keyPaths: string[], lang: string): string {
    const pkg = keyPaths.find((p) => p.endsWith('package.json'));
    if (pkg) {
      try {
        const json = JSON.parse(files.find((f) => f.path.endsWith(pkg))?.content ?? '{}');
        const deps = { ...json.dependencies, ...json.devDependencies };
        if (deps['@nestjs/core']) return 'NestJS';
        if (deps['@angular/core']) return 'Angular';
        if (deps['next']) return 'Next.js';
        if (deps['react']) return 'React';
        if (deps['vue']) return 'Vue';
        if (deps['express']) return 'Express';
        if (deps['fastify']) return 'Fastify';
      } catch {/* noop */}
    }
    if (keyPaths.some((p) => p.endsWith('pom.xml'))) return 'Spring Boot';
    if (keyPaths.some((p) => p.endsWith('build.gradle'))) return 'Spring / Gradle';
    if (keyPaths.some((p) => p.endsWith('requirements.txt'))) return 'Python';
    if (keyPaths.some((p) => p.endsWith('go.mod'))) return 'Go module';
    return lang;
  }


  private detectComponents(files: FileHit[], lang: string): DetectedComponent[] {
    const out: DetectedComponent[] = [];
    for (const f of files) {
      const p = f.path.replace(/\\/g, '/');
      const base = p.split('/').pop()!;
      if (lang === 'TypeScript' && /\.component\.ts$/.test(base)) {
        out.push({ type: 'Angular Component', name: base.replace(/\.ts$/, ''), path: p }); continue;
      }
      if (lang === 'TypeScript' && /\.service\.ts$/.test(base)) {
        out.push({ type: 'Angular Service', name: base.replace(/\.ts$/, ''), path: p }); continue;
      }
      if (lang === 'TypeScript' && /\.module\.ts$/.test(base)) {
        out.push({ type: 'Angular Module', name: base.replace(/\.ts$/, ''), path: p }); continue;
      }
      if (/\.controller\.(ts|js)$/.test(base)) {
        out.push({ type: 'Controller', name: base.replace(/\.(ts|js)$/, ''), path: p }); continue;
      }
      if (/\.service\.(ts|js)$/.test(base)) {
        out.push({ type: 'Service', name: base.replace(/\.(ts|js)$/, ''), path: p }); continue;
      }
      if (/\.repository\.(ts|js)$/.test(base)) {
        out.push({ type: 'Repository', name: base.replace(/\.(ts|js)$/, ''), path: p }); continue;
      }
      if (/\.entity\.(ts|js)$/.test(base)) {
        out.push({ type: 'Entity', name: base.replace(/\.(ts|js)$/, ''), path: p }); continue;
      }
      if (/\.dto\.(ts|js)$/.test(base)) {
        out.push({ type: 'DTO', name: base.replace(/\.(ts|js)$/, ''), path: p }); continue;
      }
      if (lang === 'Java' && /Controller\.java$/.test(base)) {
        out.push({ type: 'Controller', name: base.replace(/\.java$/, ''), path: p });
      } else if (lang === 'Java' && /Service(Impl)?\.java$/.test(base)) {
        out.push({ type: 'Service', name: base.replace(/\.java$/, ''), path: p });
      } else if (lang === 'Java' && /Repository\.java$/.test(base)) {
        out.push({ type: 'Repository', name: base.replace(/\.java$/, ''), path: p });
      } else if (lang === 'Java' && /[Mm]odel\.java$/.test(base)) {
        out.push({ type: 'Model', name: base.replace(/\.java$/, ''), path: p });
      }
    }
    return out.slice(0, 200);
  }


  private inferArchitecture(files: FileHit[]) {
    const ev: ArchitectureEvidence[] = [];
    const has = (re: RegExp) => files.some((f) => re.test(f.path.replace(/\\/g, '/')));
    const dockerfiles = files.filter((f) => /Dockerfile$/i.test(f.path)).length;
    const hasK8s = has(/\/(k8s|helm|deploy)\//);
    if (dockerfiles >= 2 || hasK8s) {
      ev.push({ description: dockerfiles + ' Dockerfiles detected', path: 'Dockerfile' });
      if (hasK8s) ev.push({ description: 'Kubernetes/Helm manifests detected', path: 'k8s/' });
      return {
        pattern: ArchitecturePattern.MICROSERVICES, confidence: 0.8, evidence: ev,
        rationale: 'Multiple container manifests and/or orchestration files suggest a microservices topology.',
      };
    }
    const hexHits = [
      has(/\/(domain|domain\/models|domain\/entities)\//),
      has(/\/(application|application\/use-cases|application\/services)\//),
      has(/\/(infrastructure|infrastructure\/adapters)\//),
      has(/\/(ports|adapters)\//),
    ].filter(Boolean).length;
    if (hexHits >= 3) {
      ev.push({ description: 'Folders named domain/, application/, infrastructure/ present' });
      ev.push({ description: 'Ports & adapters pattern detected' });
      return {
        pattern: ArchitecturePattern.HEXAGONAL, confidence: 0.85, evidence: ev,
        rationale: 'Project layout matches the Hexagonal (Ports & Adapters) architecture.',
      };
    }
    const cleanHits = [
      has(/\/entities\//), has(/\/(useCases|use_cases|application)\//),
      has(/\/(interfaceAdapters|interface_adapters|adapters)\//),
      has(/\/(frameworks|infra|infrastructure)\//),
    ].filter(Boolean).length;
    if (cleanHits >= 3) {
      ev.push({ description: 'Clean Architecture folders detected (entities/useCases/interfaceAdapters/frameworks)' });
      return {
        pattern: ArchitecturePattern.CLEAN, confidence: 0.8, evidence: ev,
        rationale: 'Project layout aligns with Clean Architecture (Uncle Bob).',
      };
    }
    const mvcHits = [has(/\/controllers\//), has(/\/models\//), has(/\/(views|templates)\//)].filter(Boolean).length;
    if (mvcHits >= 2) {
      ev.push({ description: 'controllers/ + models/ + views/ detected' });
      return {
        pattern: ArchitecturePattern.MVC, confidence: 0.7, evidence: ev,
        rationale: 'Classic MVC folder structure detected.',
      };
    }
    const nLayerHits = [has(/\/repository\//), has(/\/service\//), has(/\/controller\//)].filter(Boolean).length;
    if (nLayerHits >= 2) {
      ev.push({ description: 'N-Layer folders repository/, service/, controller/ detected' });
      return {
        pattern: ArchitecturePattern.N_LAYER, confidence: 0.65, evidence: ev,
        rationale: 'Layered architecture (N-Layer) detected by typical folder names.',
      };
    }
    ev.push({ description: 'No clear separation into multiple services or hexagonal/clean boundaries' });
    return {
      pattern: ArchitecturePattern.MONOLITH, confidence: 0.55, evidence: ev,
      rationale: 'No clear separation - treated as a Monolith.',
    };
  }


  private detectApis(files: FileHit[]): ApiConsumption[] {
    const out: ApiConsumption[] = [];
    const text = files.map((f) => f.content ?? '').join('\n');
    if (/(mongoose|createConnection|mongodb)/i.test(text)) out.push({ name: 'MongoDB', type: 'database' });
    if (/(typeorm|prisma|sequelize|knex|@nestjs\/typeorm)/i.test(text)) out.push({ name: 'SQL ORM (TypeORM/Prisma/Sequelize)', type: 'database' });
    if (/(\bpg\b|postgres|mysql|sqlite)/i.test(text)) out.push({ name: 'PostgreSQL/MySQL/SQLite', type: 'database' });
    if (/(axios|HttpClient|fetch\(|got\()/i.test(text)) out.push({ name: 'HTTP REST client', type: 'rest' });
    if (/(@apollo\/apollo-angular|apollo-client|graphql-request|@nestjs\/graphql)/i.test(text)) out.push({ name: 'GraphQL', type: 'graphql' });
    if (/(amqplib|rabbitmq|kafkajs|sqs|sns)/i.test(text)) out.push({ name: 'Message Queue', type: 'queue' });
    const matches = [...text.matchAll(/(stripe|@aws-sdk\/client-\w+|firebase|@google-cloud\/[a-z0-9-]+)/gi)].map((m) => m[1]);
    for (const m of new Set(matches)) out.push({ name: m, type: 'sdk' });
    return Array.from(new Map(out.map((i) => [i.name, i])).values());
  }

  private detectFindings(files: FileHit[], info: RepositoryInfo): Finding[] {
    const out: Finding[] = [];
    const text = files.map((f) => f.content ?? '').join('\n');
    const hasReadme = info.keyFilePaths.some((p) => /readme/i.test(p));
    const hasTests = files.some((f) => /\.(spec|test)\.(ts|js|java|py)$/i.test(f.path));
    const hasErrorHandling = /(try\s*{|catch\s*\(|HttpException|@ExceptionHandler|Result<|Either<)/i.test(text);
    if (!hasReadme) {
      out.push({ title: 'Missing README', description: 'No README file was detected at the project root.', severity: RiskSeverity.MEDIUM, category: 'documentation', recommendation: 'Add a README.md describing purpose, stack, setup and run instructions.' });
    }
    if (!hasTests) {
      out.push({ title: 'No tests detected', description: 'No .spec/.test files were found in the analyzed codebase.', severity: RiskSeverity.MEDIUM, category: 'maintainability', recommendation: 'Adopt unit/integration tests (Jest, JUnit, pytest, etc.) and run them in CI.' });
    }
    if (!hasErrorHandling) {
      out.push({ title: 'No error handling detected', description: 'No try/catch, HttpException or Result/Either usage was detected.', severity: RiskSeverity.HIGH, category: 'maintainability', recommendation: 'Centralize error handling (filter/interceptor, Result<T,E>, or middleware).' });
    }
    if (/(TODO|FIXME|XXX)/i.test(text)) {
      out.push({ title: 'Outstanding TODOs/FIXMEs', description: 'Source contains TODO/FIXME/XXX markers.', severity: RiskSeverity.LOW, category: 'maintainability', recommendation: 'Track and resolve TODOs in your issue tracker.' });
    }
    if (/(password|secret|api[_-]?key)\s*[:=]\s*["\'`][^"\'`]+["\'`]/i.test(text)) {
      out.push({ title: 'Hardcoded secrets', description: 'Hardcoded credentials or API keys detected in source.', severity: RiskSeverity.CRITICAL, category: 'security', recommendation: 'Move secrets to environment variables or a secret manager (AWS SM, Vault).' });
    }
    return out;
  }
}
