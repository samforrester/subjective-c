import type { ActionContract } from "@subjective-c/core";
import type { RuntimeState } from "@subjective-c/runtime/browser";

export type SubjectiveMutation<TInput = unknown, TOutput = unknown> = Readonly<Omit<ActionContract, "execute"> & {
  validate?: (input: unknown) => TInput | Promise<TInput>;
  mutate(input: TInput, context: { runtimeState: RuntimeState; signal: AbortSignal }): TOutput | Promise<TOutput>;
}>;
export type SubjectiveFormField = Readonly<{
  name: string;
  label: string;
  type: "text" | "textarea" | "email" | "number" | "date" | "checkbox" | "select" | "hidden";
  required: boolean;
  options: ReadonlyArray<Readonly<{ value: string; label: string }>>;
}>;
export type SubjectiveForm = Readonly<{ id: string; mutationId: string; fields: ReadonlyArray<SubjectiveFormField> }>;

export class SubjectivePolicyError extends Error { code: string; constructor(code: string, message: string); }
export function defineSubjectiveMutation<TInput = unknown, TOutput = unknown>(input: ActionContract & { validate?: (input: unknown) => TInput | Promise<TInput>; mutate(input: TInput, context: { runtimeState: RuntimeState; signal: AbortSignal }): TOutput | Promise<TOutput> }): SubjectiveMutation<TInput, TOutput>;
export function defineSubjectiveForm(input: { id: string; mutationId: string; fields: Array<{ name: string; label: string; type?: SubjectiveFormField["type"]; required?: boolean; options?: Array<{ value: unknown; label: unknown }> }> }): SubjectiveForm;
export function defineMutationRegistry(mutations?: SubjectiveMutation[]): Readonly<{ mutations: ReadonlyArray<SubjectiveMutation>; get(id: string): SubjectiveMutation | undefined }>;
export function useSubjectiveMutation<TInput = unknown, TOutput = unknown>(mutation: SubjectiveMutation<TInput, TOutput>, options?: { onSuccess?(data: TOutput): void; onError?(error: unknown): void }): Readonly<{ status: "idle" | "pending" | "success" | "error"; data: TOutput | undefined; error: unknown; run(input: unknown): Promise<TOutput | undefined>; reset(): void }>;
