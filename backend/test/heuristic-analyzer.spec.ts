import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { HeuristicAnalyzerAdapter } from '../src/infrastructure/repositories/heuristic-analyzer.adapter';
import { ArchitecturePattern, RiskSeverity } from '../src/domain/models/enums';

/**
 * Integration-lite test for HeuristicAnalyzerAdapter.
 * Builds a fake repo on disk and inspects/analyses it.
 */

describe('HeuristicAnalyzerAdapter', () => {
  const workdir = join(tmpdir(), `cia-test-${Date.now()}`);

  beforeAll(async () => {
    await fs.mkdir(join(workdir, 'src', 'domain', 'models'), { recursive: true });
    await fs.mkdir(join(workdir, 'src', 'application'), { recursive: true });
    await fs.mkdir(join(workdir, 'src', 'infrastructure'), { recursive: true });
    await fs.writeFile(
      join(workdir, 'package.json'),
      JSON.stringify({
        name: 'demo-hex',
        dependencies: { '@nestjs/core': '^10.0.0' },
      }),
    );
    // Several TS files so the language detector picks TypeScript, not JSON.
    await fs.writeFile(join(workdir, 'src', 'app.ts'), 'export const x = 1; try { foo(); } catch (e) { throw e; }');
    await fs.writeFile(join(workdir, 'src', 'domain', 'models', 'user.ts'), 'export interface User { id: string; }');
    await fs.writeFile(join(workdir, 'src', 'application', 'service.ts'), 'export class S {} try {} catch (e) {}');
    await fs.writeFile(join(workdir, 'src', 'infrastructure', 'repo.ts'), 'export class R {}');
  });

  afterAll(async () => {
    await fs.rm(workdir, { recursive: true, force: true });
  });

  it('detects a NestJS hexagonal project', async () => {
    const adapter = new HeuristicAnalyzerAdapter();
    const info = await adapter.inspect(workdir);
    expect(info.name).toBe('demo-hex');
    expect(info.primaryLanguage.toLowerCase()).toBe('typescript');
    // Framework detection reads from package.json content; we wrote JSON above
    // so detectFramework must parse and find @nestjs/core.
    expect(info.primaryFramework).toMatch(/NestJS|TypeScript/);

    const result = await adapter.analyze(info);
    expect(result.architecture.pattern).toBe(ArchitecturePattern.HEXAGONAL);
    expect(result.architecture.confidence).toBeGreaterThan(0.7);
    expect(result.findings).toEqual(expect.any(Array));
    // No README was created, so a missing-README finding should exist.
    expect(result.findings.some((f) => f.title === 'Falta README')).toBe(true);
    // No tests were created, so a no-tests finding should exist.
    expect(result.findings.some((f) => f.title === 'Sin pruebas detectadas')).toBe(true);
  });

  it('flags CRITICAL when a hardcoded secret pattern is present', async () => {
    const leakDir = join(tmpdir(), `cia-leak-${Date.now()}`);
    await fs.mkdir(leakDir, { recursive: true });
    await fs.writeFile(
      join(leakDir, 'config.ts'),
      'export const API_KEY = "sk-live-1234567890abcdef";\ntry {} catch(e) {}',
    );
    const adapter = new HeuristicAnalyzerAdapter();
    const info = await adapter.inspect(leakDir);
    const result = await adapter.analyze(info);
    expect(result.findings.some((f) => f.severity === RiskSeverity.CRITICAL && /secret/i.test(f.title))).toBe(true);
    await fs.rm(leakDir, { recursive: true, force: true });
  });
});