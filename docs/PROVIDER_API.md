# Provider API

A provider converts source text into a valid Subjective C manifest.

## Contract

```ts
interface SubjectiveProvider {
  name: string;
  compile(source: string, options: CompileOptions): Promise<SubjectiveManifest>;
}
```

## Config example

```js
export default {
  provider: {
    name: "company-intent-compiler",
    async compile(source, options) {
      const response = await fetch(process.env.COMPILER_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${process.env.COMPILER_TOKEN}`
        },
        body: JSON.stringify({ source, options })
      });

      if (!response.ok) throw new Error(`Compiler failed: ${response.status}`);
      return response.json();
    }
  },
  providerFallback: true
};
```

## `JsonHttpProvider`

The core package includes a small generic HTTP adapter:

```js
import { JsonHttpProvider } from "@subjective-c/core";

export default {
  provider: new JsonHttpProvider({
    name: "remote-compiler",
    endpoint: process.env.COMPILER_URL,
    headers: { authorization: `Bearer ${process.env.COMPILER_TOKEN}` }
  })
};
```

The endpoint receives `{ source, context }` by default and may return either a manifest directly or `{ manifest }`.

## Validation and fallback

Provider output must include the required manifest name, goal, constraint arrays, capability array, and domain. Invalid output is treated as a provider failure.

When `providerFallback` is not `false`, the build falls back to the local compiler. The build metadata records the provider and whether fallback occurred.

## Security

Do not place provider secrets in browser code. Providers run during the Node build. The compiled manifest is serialized into the static application, so it must not contain secrets or private prompts.
