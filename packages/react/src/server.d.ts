import type { ReactNode } from "react";
import type { RuntimeState } from "@subjective-c/runtime/browser";

export function SubjectiveStatic(props: { state: RuntimeState; className?: string; [key: string]: unknown }): ReactNode;
