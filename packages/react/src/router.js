"use client";

import { createElement, useSyncExternalStore } from "react";

const ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

function invariant(condition, message) {
  if (!condition) throw new TypeError(message);
}

function normalizePath(path) {
  const pathname = new URL(String(path || "/"), "https://subjective-c.invalid").pathname;
  return pathname !== "/" ? pathname.replace(/\/+$/, "") : pathname;
}

function matchPattern(pattern, pathname) {
  const expected = normalizePath(pattern).split("/").filter(Boolean);
  const actual = normalizePath(pathname).split("/").filter(Boolean);
  const params = {};
  let score = 0;
  for (let index = 0; index < expected.length; index += 1) {
    const segment = expected[index];
    if (segment === "*") {
      params["*"] = actual.slice(index).map(decodeURIComponent).join("/");
      return { params, score: score + 1 };
    }
    if (actual[index] == null) return null;
    if (segment.startsWith(":")) {
      params[segment.slice(1)] = decodeURIComponent(actual[index]);
      score += 2;
    } else if (segment === actual[index]) {
      score += 4;
    } else {
      return null;
    }
  }
  return actual.length === expected.length ? { params, score: score + expected.length } : null;
}

export function defineSubjectiveRoute(route) {
  invariant(route && typeof route === "object", "defineSubjectiveRoute requires a route contract.");
  invariant(typeof route.id === "string" && ID_PATTERN.test(route.id), "Route id must be a kebab-case identifier.");
  invariant(typeof route.path === "string" && route.path.startsWith("/"), `Route ${route.id} path must start with /.`);
  invariant(route.parentId == null || (typeof route.parentId === "string" && ID_PATTERN.test(route.parentId)), `Route ${route.id} parentId must be a route identifier or null.`);
  invariant(route.component == null || typeof route.component === "function", `Route ${route.id} component must be a React component.`);
  invariant(route.load == null || typeof route.load === "function", `Route ${route.id} load must be a function.`);
  return Object.freeze({
    id: route.id,
    path: normalizePath(route.path),
    parentId: route.parentId ?? null,
    component: route.component,
    load: route.load
  });
}

export function createSubjectiveRouter(input = {}) {
  const routes = (input.routes || []).map(defineSubjectiveRoute);
  invariant(routes.length > 0, "createSubjectiveRouter requires at least one route.");
  const byId = new Map();
  for (const route of routes) {
    invariant(!byId.has(route.id), `Duplicate route id: ${route.id}.`);
    byId.set(route.id, route);
  }
  for (const route of routes) {
    invariant(!route.parentId || byId.has(route.parentId), `Route ${route.id} references unknown parent ${route.parentId}.`);
    const ancestors = new Set([route.id]);
    let parentId = route.parentId;
    while (parentId) {
      invariant(!ancestors.has(parentId), `Route cycle detected at ${route.id}.`);
      ancestors.add(parentId);
      parentId = byId.get(parentId)?.parentId;
    }
  }

  function resolveMatches(path) {
    const candidates = routes.flatMap((route) => {
      const match = matchPattern(route.path, path);
      return match ? [{ route, ...match }] : [];
    }).sort((left, right) => right.score - left.score);
    const leaf = candidates[0];
    if (!leaf) return [];
    const chain = [];
    let route = leaf.route;
    while (route) {
      chain.unshift(Object.freeze({ route, params: leaf.params }));
      route = route.parentId ? byId.get(route.parentId) : null;
    }
    return Object.freeze(chain);
  }

  const listeners = new Set();
  let controller = null;
  let snapshot = Object.freeze({
    path: normalizePath(input.initialPath || "/"),
    matches: resolveMatches(input.initialPath || "/"),
    data: Object.freeze({}),
    status: "idle",
    error: null
  });
  const publish = (next) => {
    snapshot = Object.freeze(next);
    listeners.forEach((listener) => listener());
    return snapshot;
  };

  const router = {
    routes: Object.freeze(routes),
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async navigate(path) {
      controller?.abort();
      const navigation = new AbortController();
      controller = navigation;
      const nextPath = normalizePath(path);
      const matches = resolveMatches(nextPath);
      const loading = matches.some(({ route }) => route.load);
      publish({ path: nextPath, matches, data: Object.freeze({}), status: loading ? "loading" : "ready", error: null });
      if (!loading) return snapshot;
      try {
        const entries = await Promise.all(matches.map(async ({ route, params }) => [
          route.id,
          route.load ? await route.load({ path: nextPath, params, signal: navigation.signal, router }) : undefined
        ]));
        if (navigation.signal.aborted || controller !== navigation) return snapshot;
        return publish({ path: nextPath, matches, data: Object.freeze(Object.fromEntries(entries)), status: "ready", error: null });
      } catch (error) {
        if (navigation.signal.aborted || controller !== navigation) return snapshot;
        return publish({ path: nextPath, matches, data: Object.freeze({}), status: "error", error });
      }
    },
    load() { return router.navigate(snapshot.path); },
    match(path) { return resolveMatches(path); }
  };
  return Object.freeze(router);
}

export function useSubjectiveRouter(router) {
  invariant(router?.subscribe && router?.getSnapshot, "useSubjectiveRouter requires a Subjective C router.");
  return useSyncExternalStore(router.subscribe, router.getSnapshot, router.getSnapshot);
}

export function SubjectiveRouterOutlet({ router, fallback = null, notFound = null }) {
  const state = useSubjectiveRouter(router);
  if (state.status === "loading") return fallback;
  if (state.status === "error") throw state.error;
  if (!state.matches.length) return notFound;
  let outlet = null;
  for (let index = state.matches.length - 1; index >= 0; index -= 1) {
    const { route, params } = state.matches[index];
    outlet = route.component
      ? createElement(route.component, { route, params, data: state.data[route.id], navigate: router.navigate }, outlet)
      : outlet;
  }
  return outlet;
}
