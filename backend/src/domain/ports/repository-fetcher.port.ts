import { RepositorySourceType } from '../models/enums';

/**
 * Input for fetching a repository.
 */
export interface RepositorySource {
  readonly type: RepositorySourceType;
  /** Git URL when type === 'url' */
  readonly url?: string;
  /** ZIP Buffer (uploaded file) when type === 'zip' */
  readonly zipBuffer?: Buffer;
  /** ZIP file name when type === 'zip' (optional) */
  readonly zipName?: string;
}

/**
 * Port — Fetches a remote/local repository and materializes it on disk.
 * The framework (NestJS, Express, ...) is irrelevant here.
 */
export interface IRepositoryFetcher {
  /**
   * Downloads (or extracts) the repository and returns its local path.
   * Caller is responsible for cleaning up using `cleanup`.
   */
  fetch(source: RepositorySource): Promise<{ localPath: string; name: string }>;

  /** Cleans up the temporary work directory. */
  cleanup(localPath: string): Promise<void>;
}

/** Injection token for Nest DI. */
export const REPOSITORY_FETCHER = Symbol('REPOSITORY_FETCHER');