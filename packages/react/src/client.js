"use client";

import {
  createContext,
  createElement,
  Fragment,
  use,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { createPreferenceStore, hydrateSubjective, mountSubjective, normalizePreferences, renderSubjectiveMarkup } from "@subjective-c/runtime/browser";
import { defineComponentPackage } from "@subjective-c/core";

const SubjectiveReactContext = createContext(null);
const useClientLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function invariant(condition, message) {
  if (!condition) throw new TypeError(message);
}

function optionalFunction(value, label) {
  invariant(value == null || typeof value === "function", `${label} must be a function when provided.`);
  return value;
}

export function createSubjectiveHost(input = {}) {
  invariant(input && typeof input === "object", "createSubjectiveHost requires a host contract.");
  return Object.freeze({
    authorizeAction: optionalFunction(input.authorizeAction, "authorizeAction"),
    confirmAction: optionalFunction(input.confirmAction, "confirmAction"),
    performAction: optionalFunction(input.performAction, "performAction"),
    actionDenied: optionalFunction(input.actionDenied, "actionDenied"),
    actionError: optionalFunction(input.actionError, "actionError")
  });
}

export function defineReactComponentPackage(input = {}) {
  invariant(Array.isArray(input.components) && input.components.length > 0, "defineReactComponentPackage requires React components.");
  for (const component of input.components) {
    invariant(typeof component.render === "function", `React component ${component.id || "unknown"} requires a render function.`);
  }
  return defineComponentPackage(input);
}

export function SubjectiveProvider({ initialState, host = createSubjectiveHost(), preferenceKey = "subjective-c:react-preferences@1", storage, children }) {
  invariant(initialState?.manifest && initialState?.variant, "SubjectiveProvider requires initial manifest and variant state.");
  const preferenceStore = useMemo(() => createPreferenceStore({ key: preferenceKey, storage }), [preferenceKey, storage]);
  const [runtimeState, setRuntimeState] = useState(() => ({
    ...initialState,
    preferences: normalizePreferences(initialState.preferences)
  }));
  const callbacksRef = useRef(initialState.callbacks || {});
  const hostRef = useRef(host);

  useEffect(() => { callbacksRef.current = runtimeState.callbacks || {}; }, [runtimeState.callbacks]);
  useEffect(() => { hostRef.current = host; }, [host]);

  const updateState = useCallback((next) => {
    setRuntimeState((current) => ({ ...current, ...(typeof next === "function" ? next(current) : next) }));
  }, []);
  const setData = useCallback((data) => updateState({ data }), [updateState]);
  const setPreferences = useCallback((preferences) => {
    const saved = preferenceStore.save(preferences);
    updateState({ preferences: saved });
    callbacksRef.current.onPreferenceChange?.(saved);
    return saved;
  }, [preferenceStore, updateState]);
  useClientLayoutEffect(() => {
    const stored = preferenceStore.load();
    if (Object.keys(stored).length) {
      setRuntimeState((current) => ({ ...current, preferences: normalizePreferences({ ...current.preferences, ...stored }) }));
    }
  }, [preferenceStore]);

  const callbacks = useMemo(() => {
    const nextCallbacks = {
      ...runtimeState.callbacks,
      authorizeAction: (detail) => hostRef.current.authorizeAction?.(detail) ?? callbacksRef.current.authorizeAction?.(detail) ?? false,
      onAction: (detail) => {
        try {
          callbacksRef.current.onAction?.(detail);
          const result = hostRef.current.performAction?.(detail);
          if (result && typeof result.then === "function") result.catch((error) => hostRef.current.actionError?.({ detail, error }));
          return result;
        } catch (error) {
          return hostRef.current.actionError?.({ detail, error });
        }
      },
      onActionDenied: (detail) => {
        callbacksRef.current.onActionDenied?.(detail);
        return hostRef.current.actionDenied?.(detail);
      },
      onActionError: (failure) => {
        callbacksRef.current.onActionError?.(failure);
        return hostRef.current.actionError?.(failure);
      },
      onDataChange: (data) => {
        setData(data);
        callbacksRef.current.onDataChange?.(data);
      },
      onPreferenceChange: setPreferences
    };
    if (host.confirmAction || runtimeState.callbacks?.confirmAction) {
      nextCallbacks.confirmAction = (detail) => hostRef.current.confirmAction?.(detail) ?? callbacksRef.current.confirmAction?.(detail);
    } else {
      delete nextCallbacks.confirmAction;
    }
    return nextCallbacks;
  }, [host, runtimeState.callbacks, setData, setPreferences]);

  const state = useMemo(() => ({ ...runtimeState, callbacks }), [runtimeState, callbacks]);
  const value = useMemo(() => ({ state, updateState, setData, setPreferences, preferenceStore }), [state, updateState, setData, setPreferences, preferenceStore]);
  return createElement(SubjectiveReactContext.Provider, { value }, children);
}

export function useSubjective() {
  const value = useContext(SubjectiveReactContext);
  invariant(value, "useSubjective must be used inside SubjectiveProvider.");
  return value;
}

export function SubjectiveRoot({ state: explicitState, className, ...props }) {
  const context = useContext(SubjectiveReactContext);
  const state = explicitState || context?.state;
  invariant(state?.manifest && state?.variant, "SubjectiveRoot requires state or a SubjectiveProvider parent.");
  const targetRef = useRef(null);
  const controllerRef = useRef(null);

  useClientLayoutEffect(() => {
    if (!targetRef.current) return;
    controllerRef.current = controllerRef.current
      ? controllerRef.current.update(state)
      : mountSubjective(targetRef.current, state);
  }, [state]);
  useEffect(() => () => {
    controllerRef.current?.destroy();
    controllerRef.current = null;
  }, []);

  return createElement("div", { ...props, className, ref: targetRef, "data-subjective-react": "root" });
}

export function SubjectiveDataBoundary({ data, state, ...props }) {
  const resolvedData = use(data);
  return createElement(SubjectiveRoot, { ...props, state: { ...state, data: resolvedData } });
}

export function SubjectiveHydratedRoot({ state: explicitState, className, ...props }) {
  const context = useContext(SubjectiveReactContext);
  const state = explicitState || context?.state;
  invariant(state?.manifest && state?.variant, "SubjectiveHydratedRoot requires state or a SubjectiveProvider parent.");
  const targetRef = useRef(null);
  const markup = useMemo(() => renderSubjectiveMarkup(state), [state]);
  useClientLayoutEffect(() => {
    if (!targetRef.current) return undefined;
    const controller = hydrateSubjective(targetRef.current, state, { fallback: true });
    return () => controller.destroy();
  }, [state]);
  return createElement("div", {
    ...props,
    className,
    ref: targetRef,
    "data-subjective-react": "hydrated-root",
    dangerouslySetInnerHTML: { __html: markup }
  });
}

export function useSubjectiveAction(explicitState) {
  const context = useContext(SubjectiveReactContext);
  const state = explicitState || context?.state;
  invariant(state?.variant, "useSubjectiveAction requires state or a SubjectiveProvider parent.");
  const callbacksRef = useRef(state.callbacks || {});
  useEffect(() => { callbacksRef.current = state.callbacks || {}; }, [state.callbacks]);
  const actions = useMemo(() => new Map((state.plan?.actions || []).map((action) => [action.id, action])), [state.plan?.actions]);
  return useCallback(async (id, payload) => {
    const contract = actions.get(id);
    if (!contract) return Object.freeze({ ok: false, reason: "untrusted-action" });
    const detail = {
      id: contract.id,
      kind: contract.kind || "custom",
      variant: state.variant.id,
      permission: contract.permission ?? null,
      destructive: contract.destructive === true,
      confirmation: contract.confirmation ?? null,
      payload
    };
    try {
      if (detail.permission && await callbacksRef.current.authorizeAction?.(detail) !== true) {
        callbacksRef.current.onActionDenied?.({ ...detail, reason: "permission-denied" });
        return Object.freeze({ ok: false, reason: "permission-denied" });
      }
      if (detail.destructive && await callbacksRef.current.confirmAction?.(detail) !== true) {
        callbacksRef.current.onActionDenied?.({ ...detail, reason: "confirmation-declined" });
        return Object.freeze({ ok: false, reason: "confirmation-declined" });
      }
      const value = await callbacksRef.current.onAction?.(detail);
      return Object.freeze({ ok: true, value });
    } catch (error) {
      callbacksRef.current.onActionError?.({ detail, error });
      return Object.freeze({ ok: false, reason: "error", error });
    }
  }, [actions, state.variant.id]);
}

export function SubjectiveComposition({ registry, state: explicitState, as = "div", className, renderMissing, ...props }) {
  const context = useContext(SubjectiveReactContext);
  const state = explicitState || context?.state;
  invariant(state?.plan, "SubjectiveComposition requires a verified plan.");
  invariant(registry?.components, "SubjectiveComposition requires an application-owned component registry.");
  const invokeAction = useSubjectiveAction(state);
  const components = useMemo(() => new Map(registry.components.map((component) => [component.id, component])), [registry]);
  const order = ["navigation", ...(state.plan.sectionOrder || [])];
  const children = order.flatMap((slot) => {
    const selection = state.plan.slots[slot];
    if (!selection) return [];
    const component = components.get(selection.componentId);
    if (!component?.render) {
      return renderMissing ? [renderMissing({ slot, selection })] : [];
    }
    return [createElement(component.render, {
      key: `${slot}:${component.id}`,
      slot,
      component,
      manifest: state.manifest,
      variant: state.variant,
      plan: state.plan,
      data: state.data,
      invokeAction
    })];
  });
  if (as === Fragment) return createElement(Fragment, null, children);
  return createElement(as, { ...props, className, "data-subjective-react": "composition" }, children);
}
