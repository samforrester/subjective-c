"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { defineAction } from "@subjective-c/core";
import { useSubjective } from "./client.js";

const ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const FIELD_TYPES = new Set(["text", "textarea", "email", "number", "date", "checkbox", "select", "hidden"]);

function invariant(condition, message) {
  if (!condition) throw new TypeError(message);
}

export class SubjectivePolicyError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "SubjectivePolicyError";
    this.code = code;
  }
}

export function defineSubjectiveMutation(input) {
  invariant(typeof input?.mutate === "function", "A Subjective C mutation requires a mutate function.");
  invariant(input.validate == null || typeof input.validate === "function", `Mutation ${input.id} validate must be a function.`);
  const action = defineAction(input);
  return Object.freeze({ ...action, execute: undefined, validate: input.validate, mutate: input.mutate });
}

export function defineSubjectiveForm(input) {
  invariant(input && typeof input === "object", "defineSubjectiveForm requires a form contract.");
  invariant(typeof input.id === "string" && ID_PATTERN.test(input.id), "Form id must be a kebab-case identifier.");
  invariant(typeof input.mutationId === "string" && ID_PATTERN.test(input.mutationId), `Form ${input.id} requires a mutationId.`);
  const names = new Set();
  const fields = (input.fields || []).map((field) => {
    invariant(field && typeof field === "object", `Form ${input.id} fields must be objects.`);
    invariant(typeof field.name === "string" && ID_PATTERN.test(field.name), `Form ${input.id} field name must be a kebab-case identifier.`);
    invariant(!names.has(field.name), `Duplicate field ${field.name} in form ${input.id}.`);
    names.add(field.name);
    invariant(typeof field.label === "string" && field.label.trim(), `Form ${input.id} field ${field.name} requires a label.`);
    const type = field.type || "text";
    invariant(FIELD_TYPES.has(type), `Form ${input.id} field ${field.name} has unsupported type ${type}.`);
    const options = Object.freeze((field.options || []).map((option) => Object.freeze({ value: String(option.value), label: String(option.label) })));
    invariant(type === "select" || options.length === 0, `Only select fields may declare options.`);
    return Object.freeze({ name: field.name, label: field.label.trim(), type, required: field.required === true, options });
  });
  invariant(fields.length > 0, `Form ${input.id} requires at least one field.`);
  return Object.freeze({ id: input.id, mutationId: input.mutationId, fields: Object.freeze(fields) });
}

export function defineMutationRegistry(input = []) {
  const mutations = input.map(defineSubjectiveMutation);
  const byId = new Map();
  for (const mutation of mutations) {
    invariant(!byId.has(mutation.id), `Duplicate mutation id: ${mutation.id}.`);
    byId.set(mutation.id, mutation);
  }
  return Object.freeze({ mutations: Object.freeze(mutations), get: (id) => byId.get(id) });
}

export function useSubjectiveMutation(mutation, options = {}) {
  invariant(mutation?.mutate, "useSubjectiveMutation requires a mutation contract.");
  const { state: runtimeState } = useSubjective();
  const callbacksRef = useRef(runtimeState.callbacks || {});
  const runtimeRef = useRef(runtimeState);
  const optionsRef = useRef(options);
  const controllerRef = useRef(null);
  const [state, setState] = useState(() => ({ status: "idle", data: undefined, error: null }));
  useEffect(() => { callbacksRef.current = runtimeState.callbacks || {}; }, [runtimeState.callbacks]);
  useEffect(() => { runtimeRef.current = runtimeState; }, [runtimeState]);
  useEffect(() => { optionsRef.current = options; }, [options]);
  useEffect(() => () => controllerRef.current?.abort(), []);

  const run = useCallback(async (values) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ status: "pending", data: undefined, error: null });
    const detail = {
      id: mutation.id,
      kind: mutation.kind,
      variant: runtimeRef.current.variant.id,
      permission: mutation.permission,
      destructive: mutation.destructive,
      confirmation: mutation.confirmation
    };
    try {
      const validated = mutation.validate ? await mutation.validate(values) : values;
      if (mutation.permission && await callbacksRef.current.authorizeAction?.(detail) !== true) {
        callbacksRef.current.onActionDenied?.({ ...detail, reason: "permission-denied" });
        throw new SubjectivePolicyError("permission-denied", `Permission ${mutation.permission} was denied.`);
      }
      if (mutation.destructive && await callbacksRef.current.confirmAction?.(detail) !== true) {
        callbacksRef.current.onActionDenied?.({ ...detail, reason: "confirmation-declined" });
        throw new SubjectivePolicyError("confirmation-declined", `Mutation ${mutation.id} was not confirmed.`);
      }
      const data = await mutation.mutate(validated, { runtimeState: runtimeRef.current, signal: controller.signal });
      if (controller.signal.aborted) return undefined;
      setState({ status: "success", data, error: null });
      optionsRef.current.onSuccess?.(data);
      return data;
    } catch (error) {
      if (controller.signal.aborted) return undefined;
      setState({ status: "error", data: undefined, error });
      optionsRef.current.onError?.(error);
      throw error;
    }
  }, [mutation]);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setState({ status: "idle", data: undefined, error: null });
  }, []);
  return Object.freeze({ ...state, run, reset });
}
