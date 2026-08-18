import { compileSubjective, validateManifest } from "./compiler.js";

export class LocalProvider {
  name = "local";

  async compile(source, options = {}) {
    return compileSubjective(source, options);
  }
}

export class JsonHttpProvider {
  constructor(options) {
    if (!options?.endpoint) throw new Error("JsonHttpProvider requires an endpoint.");
    this.name = options.name || "json-http";
    this.endpoint = options.endpoint;
    this.headers = options.headers || {};
    this.mapRequest = options.mapRequest || ((source, context) => ({ source, context }));
    this.mapResponse = options.mapResponse || ((body) => body.manifest ?? body);
  }

  async compile(source, options = {}) {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...this.headers
      },
      body: JSON.stringify(this.mapRequest(source, options))
    });
    if (!response.ok) {
      throw new Error(`${this.name} provider failed with ${response.status}.`);
    }
    return this.mapResponse(await response.json());
  }
}

export async function compileWithProvider(source, options = {}) {
  const provider = options.provider || new LocalProvider();
  try {
    const manifest = await provider.compile(source, options);
    const validation = validateManifest(manifest);
    if (!validation.valid) {
      throw new Error(`Provider returned an invalid manifest: ${validation.errors.join(" ")}`);
    }
    return { manifest, provider: provider.name || "custom", fallback: false };
  } catch (error) {
    if (options.fallback === false || provider instanceof LocalProvider) throw error;
    return {
      manifest: compileSubjective(source, options),
      provider: "local",
      fallback: true,
      warning: error instanceof Error ? error.message : String(error)
    };
  }
}
