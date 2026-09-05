import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuid } from 'uuid';
import AdmZip from 'adm-zip';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { IRepositoryFetcher, RepositorySource } from '../../domain/ports/repository-fetcher.port';
import { RepositorySourceType } from '../../domain/models/enums';

const execAsync = promisify(exec);

/**
 * Filesystem-based adapter for IRepositoryFetcher.
 * - URL  -> shallow `git clone` using `git` CLI (no credentials assumed, public repos only).
 * - ZIP -> extract in-memory into a temp directory.
 *
 * Windows note: repos with very long file names (e.g. Drupal test fixtures
 * like `invalid_module_name_over_the_maximum_allowed_character_length`)
 * may fail the initial `git checkout` with "Filename too long". We detect
 * this and retry with `core.longpaths=true` enabled, which lets Git create
 * paths longer than 260 chars on Windows.
 */
@Injectable()
export class FsRepositoryFetcher implements IRepositoryFetcher {
  private readonly logger = new Logger(FsRepositoryFetcher.name);
  private readonly workDir: string;

  constructor(private readonly config: ConfigService) {
    this.workDir = this.config.get<string>('WORK_DIR', './tmp/work');
  }

  async fetch(source: RepositorySource): Promise<{ localPath: string; name: string }> {
    await fs.mkdir(this.workDir, { recursive: true });

    if (source.type === RepositorySourceType.URL) {
      return this.cloneGit(source.url!);
    }

    if (source.type === RepositorySourceType.ZIP) {
      return this.extractZip(source.zipBuffer!, source.zipName);
    }

    throw new Error(`Unsupported repository source type: ${source.type}`);
  }

  async cleanup(localPath: string): Promise<void> {
    try {
      await fs.rm(localPath, { recursive: true, force: true });
    } catch (err) {
      this.logger.warn(`Cleanup failed for ${localPath}: ${(err as Error).message}`);
    }
  }

  // ─────────────────────────────────────────── helpers

  private async cloneGit(url: string): Promise<{ localPath: string; name: string }> {
    if (!/^https:\/\/(github\.com|gitlab\.com|bitbucket\.org)\/[\w.-]+\/[\w.-]+(\.git)?$/i.test(url)) {
      throw new Error('Only public GitHub / GitLab / Bitbucket HTTPS URLs are supported in the MVP.');
    }
    const id = uuid();
    const localPath = join(this.workDir, id);
    const name = url.split('/').pop()!.replace(/\.git$/i, '') || `repo-${id}`;
    const cmd = `git clone --depth 1 "${url}" "${localPath}"`;
    this.logger.log(`Cloning ${url} -> ${localPath}`);
    try {
      await execAsync(cmd, { maxBuffer: 1024 * 1024 * 10 });
    } catch (err) {
      const msg = (err as Error).message || String(err);
      // "Clone succeeded, but checkout failed" with "Filename too long" errors
      // means the repo downloaded OK but Windows refused to create long paths.
      // Enable core.longpaths=true and finish the checkout ourselves.
      if (msg.includes('Filename too long') || msg.includes('unable to checkout')) {
        this.logger.warn('Detected long-path checkout failure. Enabling core.longpaths=true and retrying checkout.');
        await this.enableLongPathsAndCheckout(localPath);
      } else {
        await this.cleanup(localPath);
        throw err;
      }
    }
    return { localPath, name };
  }

  /**
   * Enables core.longpaths=true in the freshly cloned repo and finishes the
   * checkout so that files with names > 260 chars can be created on Windows.
   */
  private async enableLongPathsAndCheckout(localPath: string): Promise<void> {
    try {
      await execAsync(`git -C "${localPath}" config core.longpaths true`);
      await execAsync(`git -C "${localPath}" checkout -- .`, { maxBuffer: 1024 * 1024 * 10 });
      this.logger.log('Long-path checkout succeeded.');
    } catch (err) {
      await this.cleanup(localPath);
      throw new Error(
        'Repository contains files with names longer than 260 chars. ' +
        'Enable core.longpaths=true globally with: git config --global core.longpaths true ' +
        'and retry. Original error: ' + (err as Error).message,
      );
    }
  }

  private async extractZip(
    buf: Buffer,
    fileName?: string,
  ): Promise<{ localPath: string; name: string }> {
    const id = uuid();
    const localPath = join(this.workDir, id);
    await fs.mkdir(localPath, { recursive: true });
    this.logger.log(`Extracting ZIP -> ${localPath}`);
    const zip = new AdmZip(buf);
    zip.extractAllTo(localPath, /*overwrite*/ true);
    const name = (fileName ?? `repo-${id}`).replace(/\.zip$/i, '');
    return { localPath, name };
  }
}