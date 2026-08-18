import type { ComponentPackage, ComponentRegistry, SubjectiveManifest } from "@subjective-c/core";
import type { RuntimePreferences, SubjectiveData } from "@subjective-c/runtime/browser";


export type SubjectiveConfig = {
  spec?: string;
  outDir?: string;
  allowExternalOutDir?: boolean;
  novelty?: number;
  devtools?: boolean;
  inspectorOpen?: boolean;
  componentPackage?: ComponentPackage;
  registry?: ComponentRegistry;
  theme?: string;
  themeTokens?: Record<string, string | number>;
  preferences?: RuntimePreferences;
  provider?: { name?: string; compile(source: string, options?: Record<string, unknown>): Promise<SubjectiveManifest> };
  providerFallback?: boolean;
  compiler?: Record<string, unknown>;
  context?: {
    experience?: "novice" | "returning" | "expert";
    device?: "auto" | "mobile" | "tablet" | "desktop";
    attention?: "distracted" | "focused";
    input?: "auto" | "touch" | "pointer" | "keyboard";
    motion?: "auto" | "full" | "reduced";
    contrast?: "auto" | "standard" | "high";
    locale?: string;
  };
  data?: SubjectiveData;
};

export function defineConfig<T extends SubjectiveConfig>(config: T): T;

export type BuildOptions = {
  outDir?: string;
  spec?: string;
  config?: string;
  dev?: boolean;
  quiet?: boolean;
  allowExternalOutDir?: boolean;
};

export type BuildResult = {
  project: string;
  outDirectory: string;
  specPath: string;
  configPath: string | null;
  source: string;
  manifest: SubjectiveManifest;
  data: SubjectiveData;
  providerResult: Record<string, unknown>;
};

export function buildProject(projectDirectory: string, options?: BuildOptions): Promise<BuildResult>;
export function devProject(projectDirectory: string, options?: BuildOptions & { port?: number; host?: string }): Promise<Record<string, unknown>>;
export function doctorProject(projectDirectory?: string): Promise<Array<Record<string, unknown>>>;
export function initProject(targetDirectory?: string, options?: { force?: boolean }): Promise<string>;
export function inspectSource(path?: string, options?: Record<string, unknown>): Promise<Record<string, unknown>>;
export function runCli(args: string[]): Promise<void>;
