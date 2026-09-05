/**
 * RepositoryInfo — Pure domain entity.
 * Describes the metadata extracted from a repository BEFORE any analysis.
 */
export interface RepositoryInfo {
  /** Project name (from package.json, pom.xml, manifest, folder name, etc.) */
  readonly name: string;
  /** Detected primary programming language */
  readonly primaryLanguage: string;
  /** Detected primary framework (NestJS, Spring Boot, Angular, ...) */
  readonly primaryFramework: string;
  /** Approximate file count (excluding ignored folders) */
  readonly fileCount: number;
  /** Absolute (or relative) path of the working copy in disk */
  readonly rootPath: string;
  /** All detected languages and their approximate weight */
  readonly languages: ReadonlyArray<{ language: string; weight: number }>;
  /** Files relevant to the analysis (readmes, manifests, configs) */
  readonly keyFilePaths: ReadonlyArray<string>;
}