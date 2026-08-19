export type SubjectiveContext = {
  experience?: "novice" | "returning" | "expert";
  device?: "mobile" | "tablet" | "desktop";
  attention?: "distracted" | "focused";
  input?: "touch" | "pointer" | "keyboard";
  motion?: "full" | "reduced";
  contrast?: "standard" | "high";
  locale?: string;
};

export type AdaptationIntent = {
  id: string;
  label: string;
  description?: string;
  interpretation?: string;
  keywords?: string[];
  prompts?: string[];
};

export type AdaptationConfig = {
  enabled?: boolean;
  storage?: "session" | "local" | "none";
  defaultIntent?: string;
  intents: AdaptationIntent[];
};

export type VisitorModel = Readonly<{
  schema: "subjective-c/visitor@0.1";
  revision: number;
  intent: string | null;
  label: string;
  interpretation: string | null;
  confidence: number;
  reasons: string[];
  scores: Record<string, number>;
  evidence: ReadonlyArray<{ intent: string; reason: string }>;
}>;

export type SubjectiveManifest = {
  schema: "subjective-c/manifest@0.2";
  name: string;
  slug: string;
  intent: {
    goal: string;
    audience: string[];
    tone: string[];
    must: string[];
    prefer: string[];
    avoid: string[];
    adapt: string[];
  };
  domain: { singular: string; plural: string; icon: string };
  capabilities: Array<{
    id: string;
    label: string;
    kind: string;
    priority: number;
    shortcut?: string;
    reason: string;
    required: boolean;
  }>;
  navigation: Array<{ id: string; label: string; priority: number }>;
  policies: {
    refresh: string;
    novelty: number;
    stability: number;
    anchors: string[];
    accessibility: Record<string, unknown>;
  };
  source: { hash: string; text: string; compiler: string };
};

export type SubjectiveVariant = {
  schema: "subjective-c/variant@0.2";
  id: string;
  seed: string;
  context: Required<SubjectiveContext>;
  novelty: number;
  layout: string;
  density: string;
  navigation: "side" | "top";
  composition: {
    hero: string;
    collection: string;
    metrics: string;
    activity: string;
    sections: string[];
    copyMode: string;
  };
  theme: {
    palette: string;
    hue: number;
    radius: number;
    motion: string;
    surface: string;
    interpretation?: string;
    label?: string;
    location?: string;
    symbol?: string;
  };
  anchors: string[];
  explanation: string[];
};

export type ActionContract = {
  id: string;
  label: string;
  kind?: string;
  permission?: string | null;
  destructive?: boolean;
  confirmation?: {
    title?: string;
    description?: string;
    confirmLabel?: string;
  } | null;
  execute?: (...args: unknown[]) => unknown;
};

export type ComponentContract = {
  id: string;
  slot: string;
  variant?: string;
  capabilities?: string[];
  render?: (...args: any[]) => unknown;
};

export type ComponentRegistry = {
  schema: "subjective-c/registry@0.1";
  components: ReadonlyArray<Readonly<ComponentContract>>;
  actions: ReadonlyArray<Readonly<ActionContract>>;
};

export type ThemeTokens = Readonly<Record<string, string | number>>;

export type ComponentPackage = {
  id: string;
  registry: ComponentRegistry;
  themes: Readonly<Record<string, ThemeTokens>>;
};

export type SubjectiveDiagnostic = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  path: string | null;
};

export type SubjectivePlan = {
  schema: "subjective-c/plan@0.1";
  manifestHash: string;
  variantId: string;
  slots: Record<string, { componentId: string; variant: string }>;
  sectionOrder: string[];
  actions: Array<Omit<ActionContract, "execute">>;
  reachableCapabilities: string[];
  invariants: {
    anchors: string[];
    requiredCapabilities: string[];
    accessibility: Record<string, unknown>;
  };
};

export function compileSubjective(source: string, options?: Record<string, unknown>): SubjectiveManifest;
export function parseSubjectiveSource(source: string): Record<string, unknown>;
export function validateManifest(manifest: unknown): { valid: boolean; errors: string[] };
export function createVariant(manifest: SubjectiveManifest, options?: { seed?: string | number; context?: SubjectiveContext; novelty?: number; interpretation?: string }): SubjectiveVariant;
export function createVariants(manifest: SubjectiveManifest, options?: { count?: number; seed?: string | number; context?: SubjectiveContext; novelty?: number; interpretation?: string }): SubjectiveVariant[];
export function normalizeContext(context?: SubjectiveContext): Required<SubjectiveContext>;
export function normalizeAdaptationConfig(config?: AdaptationConfig): Readonly<AdaptationConfig & { enabled: boolean; storage: string; defaultIntent: string | null }>;
export function createVisitorModel(config?: AdaptationConfig, initial?: Partial<VisitorModel>): VisitorModel;
export function observeVisitorSignal(model: VisitorModel, signal: { kind?: "search" | "select" | "view" | "engage"; text?: string; tags?: string[]; intent?: string }, config?: AdaptationConfig): VisitorModel;
export function resolveAdaptiveData(data: Record<string, unknown>, model: VisitorModel, config?: AdaptationConfig): Record<string, unknown>;
export function variantDistance(left: SubjectiveVariant, right: SubjectiveVariant): number;
export class LocalProvider { name: string; compile(source: string, options?: Record<string, unknown>): Promise<SubjectiveManifest>; }
export class JsonHttpProvider { constructor(options: Record<string, unknown>); compile(source: string, options?: Record<string, unknown>): Promise<SubjectiveManifest>; }
export function compileWithProvider(source: string, options?: Record<string, unknown>): Promise<{ manifest: SubjectiveManifest; provider: string; fallback: boolean; warning?: string }>;
export function defineAction(contract: ActionContract): Readonly<ActionContract>;
export function defineComponent(contract: ComponentContract): Readonly<ComponentContract>;
export function defineComponentRegistry(input?: { components?: ComponentContract[]; actions?: ActionContract[] }): ComponentRegistry;
export function defineThemeTokens(tokens?: Record<string, string | number>): ThemeTokens;
export function defineComponentPackage(input: { id: string; components?: ComponentContract[]; actions?: ActionContract[]; themes?: Record<string, Record<string, string | number>> }): ComponentPackage;
export function createDefaultComponentRegistry(manifest: SubjectiveManifest): ComponentRegistry;
export function createSubjectivePlan(manifest: SubjectiveManifest, variant: SubjectiveVariant, options?: { registry?: ComponentRegistry }): SubjectivePlan;
export function validatePlan(plan: unknown, manifest: SubjectiveManifest, registry: ComponentRegistry): { valid: boolean; errors: string[] };
export function diagnoseSubjective(input: { manifest: SubjectiveManifest; registry?: ComponentRegistry; plan?: SubjectivePlan; authorizeAction?: (...args: unknown[]) => unknown }): ReadonlyArray<Readonly<SubjectiveDiagnostic>>;
export function formatDiagnostics(diagnostics?: SubjectiveDiagnostic[]): string;
export const SUBJECTIVE_C_VERSION: string;
export const MANIFEST_SCHEMA: string;
export const VARIANT_SCHEMA: string;
export const REGISTRY_SCHEMA: string;
export const PLAN_SCHEMA: string;
export const CAPABILITY_KINDS: readonly string[];
export type SubjectiveInterpretation = Readonly<{
  id: string;
  label: string;
  location: string;
  symbol: string;
  surface: string;
  layouts: readonly string[];
  collections: readonly string[];
  metrics: readonly string[];
  activity: readonly string[];
}>;
export const SUBJECTIVE_INTERPRETATIONS: ReadonlyArray<SubjectiveInterpretation>;
