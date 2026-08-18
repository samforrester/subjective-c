import type { ActionContract, SubjectiveManifest, SubjectivePlan, SubjectiveVariant } from "@subjective-c/core";

export type SubjectiveData = {
  metrics?: Array<{ label: string; value: string; delta?: string }>;
  items?: Array<{
    name: string;
    status?: string;
    owner?: string;
    progress?: number;
    due?: string;
    description?: string;
    tags?: string[];
    icon?: string;
  }>;
  activity?: Array<{ actor?: string; text?: string; time?: string; tag?: string }>;
  [key: string]: unknown;
};

export type RuntimeCallbacks = {
  onRegenerate?(): void;
  onToggleLock?(): void;
  onCompile?(source: string): void;
  onInspectorChange?(open: boolean): void;
  onContextChange?(patch: Record<string, unknown>): void;
  onNoveltyChange?(value: number): void;
  onDataChange?(data: SubjectiveData): void;
  onPreferenceChange?(preferences: Readonly<RuntimePreferences>): void;
  authorizeAction?(detail: RuntimeActionDetail): boolean | Promise<boolean>;
  confirmAction?(detail: RuntimeActionDetail): boolean | Promise<boolean>;
  onAction?(detail: RuntimeActionDetail): unknown;
  onActionDenied?(detail: RuntimeActionDetail & { reason: "permission-denied" | "confirmation-declined" }): void;
  onActionError?(failure: { detail: RuntimeActionDetail; error: unknown }): void;
};

export type RuntimeActionDetail = {
  id: string;
  kind: string;
  variant: string;
  permission: string | null;
  destructive: boolean;
  confirmation: ActionContract["confirmation"];
  payload?: unknown;
};

export type RuntimePreferences = {
  density?: "comfortable" | "balanced" | "compact";
  motion?: "subtle" | "expressive" | "reduced";
  contrast?: "standard" | "high";
  palette?: string;
};

export type RuntimeState = {
  manifest: SubjectiveManifest;
  variant: SubjectiveVariant;
  plan?: SubjectivePlan;
  data?: SubjectiveData;
  source?: string;
  devtools?: boolean;
  locked?: boolean;
  inspectorOpen?: boolean;
  callbacks?: RuntimeCallbacks;
  preferences?: RuntimePreferences;
  themeTokens?: Record<string, string | number>;
};

export function escapeHtml(value: unknown): string;
export function normalizePreferences(input?: RuntimePreferences): Readonly<RuntimePreferences>;
export function createPreferenceStore(options?: { key?: string; legacyKey?: string | false; storage?: Pick<Storage, "getItem" | "setItem" | "removeItem"> }): { load(): Readonly<RuntimePreferences>; save(preferences: RuntimePreferences): Readonly<RuntimePreferences>; clear(): void };
export function renderSubjectiveMarkup(state: RuntimeState): string;
export function mountSubjective(target: Element, state: RuntimeState): {
  update(nextState: RuntimeState): unknown;
  destroy(): void;
};
