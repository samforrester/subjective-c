import type { SubjectiveManifest, SubjectivePlan, SubjectiveVariant } from "@subjective-c/core";

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
  onAction?(detail: { id: string; kind: string; variant: string; permission: string | null; destructive: boolean }): void;
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
};

export function escapeHtml(value: unknown): string;
export function renderSubjectiveMarkup(state: RuntimeState): string;
export function mountSubjective(target: Element, state: RuntimeState): {
  update(nextState: RuntimeState): unknown;
  destroy(): void;
};
