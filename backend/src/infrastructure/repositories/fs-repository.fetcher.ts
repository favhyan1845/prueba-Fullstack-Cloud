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
    if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?$/i.test(url)) {
      throw new Error('Only public GitHub HTTPS URLs are supported in the MVP.');
    }
    const id = uuid();
    const localPath = join(this.workDir, id);
    const name = url.split('/').pop()!.replace(/\.git$/i, '') || `repo-${id}`;
    const cmd = `git clone --depth 1 "${url}" "${localPath}"`;
    this.logger.log(`Cloning ${url} -> ${localPath}`);
    await execAsync(cmd, { maxBuffer: 1024 * 1024 * 10 });
    return { localPath, name };
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