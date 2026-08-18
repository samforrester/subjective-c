import type { ComponentType, ReactNode } from "react";

export type SubjectiveRouteLoaderContext = {
  path: string;
  params: Readonly<Record<string, string>>;
  signal: AbortSignal;
  router: SubjectiveRouter;
};

export type SubjectiveRoute = Readonly<{
  id: string;
  path: string;
  parentId: string | null;
  component?: ComponentType<{ route: SubjectiveRoute; params: Readonly<Record<string, string>>; data: unknown; navigate(path: string): Promise<SubjectiveRouterState>; children?: ReactNode }>;
  load?: (context: SubjectiveRouteLoaderContext) => unknown | Promise<unknown>;
}>;

export type SubjectiveRouteMatch = Readonly<{ route: SubjectiveRoute; params: Readonly<Record<string, string>> }>;
export type SubjectiveRouterState = Readonly<{
  path: string;
  matches: ReadonlyArray<SubjectiveRouteMatch>;
  data: Readonly<Record<string, unknown>>;
  status: "idle" | "loading" | "ready" | "error";
  error: unknown;
}>;
export type SubjectiveRouter = Readonly<{
  routes: ReadonlyArray<SubjectiveRoute>;
  getSnapshot(): SubjectiveRouterState;
  subscribe(listener: () => void): () => void;
  navigate(path: string): Promise<SubjectiveRouterState>;
  load(): Promise<SubjectiveRouterState>;
  match(path: string): ReadonlyArray<SubjectiveRouteMatch>;
}>;

export function defineSubjectiveRoute(route: Omit<SubjectiveRoute, "parentId"> & { parentId?: string | null }): SubjectiveRoute;
export function createSubjectiveRouter(input: { routes: Array<Omit<SubjectiveRoute, "parentId"> & { parentId?: string | null }>; initialPath?: string }): SubjectiveRouter;
export function useSubjectiveRouter(router: SubjectiveRouter): SubjectiveRouterState;
export function SubjectiveRouterOutlet(props: { router: SubjectiveRouter; fallback?: ReactNode; notFound?: ReactNode }): ReactNode;
