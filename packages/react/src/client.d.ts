import type { ComponentType, ElementType, ReactNode } from "react";
import type { ActionContract, ComponentContract, ComponentPackage, ComponentRegistry } from "@subjective-c/core";
import type { RuntimeActionDetail, RuntimeCallbacks, RuntimePreferences, RuntimeState, SubjectiveData } from "@subjective-c/runtime/browser";

export type SubjectiveHost = Readonly<{
  authorizeAction?: (detail: RuntimeActionDetail) => boolean | Promise<boolean>;
  confirmAction?: (detail: RuntimeActionDetail) => boolean | Promise<boolean>;
  performAction?: (detail: RuntimeActionDetail) => unknown;
  actionDenied?: (detail: RuntimeActionDetail & { reason: string }) => unknown;
  actionError?: (failure: { detail: RuntimeActionDetail; error: unknown }) => unknown;
}>;

export type SubjectiveReactValue = {
  state: RuntimeState;
  updateState(next: Partial<RuntimeState> | ((current: RuntimeState) => Partial<RuntimeState>)): void;
  setData(data: SubjectiveData): void;
  setPreferences(preferences: RuntimePreferences): Readonly<RuntimePreferences>;
  preferenceStore: { load(): Readonly<RuntimePreferences>; save(preferences: RuntimePreferences): Readonly<RuntimePreferences>; clear(): void };
};

export function createSubjectiveHost(input?: SubjectiveHost): SubjectiveHost;
export type SubjectiveReactComponentProps = {
  slot: string;
  component: Readonly<Omit<ComponentContract, "render">>;
  manifest: RuntimeState["manifest"];
  variant: RuntimeState["variant"];
  plan: NonNullable<RuntimeState["plan"]>;
  data: RuntimeState["data"];
  invokeAction: ReturnType<typeof useSubjectiveAction>;
};
export type ReactComponentContract = Omit<ComponentContract, "render"> & { render: ComponentType<SubjectiveReactComponentProps> };
export type ReactComponentPackage = Omit<ComponentPackage, "registry"> & { registry: ComponentRegistry & { components: ReadonlyArray<Readonly<ReactComponentContract>> } };
export function defineReactComponentPackage(input: { id: string; components: ReactComponentContract[]; actions?: ActionContract[]; themes?: Record<string, Record<string, string | number>> }): ReactComponentPackage;
export function SubjectiveProvider(props: { initialState: RuntimeState; host?: SubjectiveHost; preferenceKey?: string; storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">; children?: ReactNode }): ReactNode;
export function useSubjective(): SubjectiveReactValue;
export function SubjectiveRoot(props: { state?: RuntimeState; className?: string; [key: string]: unknown }): ReactNode;
export function SubjectiveDataBoundary(props: { data: Promise<SubjectiveData>; state: RuntimeState; className?: string; [key: string]: unknown }): ReactNode;
export type SubjectiveActionResult = Readonly<{ ok: true; value: unknown } | { ok: false; reason: "untrusted-action" | "permission-denied" | "confirmation-declined" | "error"; error?: unknown }>;
export function useSubjectiveAction(state?: RuntimeState): (id: string, payload?: unknown) => Promise<SubjectiveActionResult>;
export function SubjectiveComposition(props: { registry: ComponentRegistry | ReactComponentPackage["registry"]; state?: RuntimeState; as?: ElementType; className?: string; renderMissing?(input: { slot: string; selection: { componentId: string; variant: string } }): ReactNode; [key: string]: unknown }): ReactNode;
export type { RuntimeActionDetail, RuntimeCallbacks, RuntimePreferences, RuntimeState, SubjectiveData };
