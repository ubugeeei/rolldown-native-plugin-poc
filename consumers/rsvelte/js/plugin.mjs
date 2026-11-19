import { performance } from "node:perf_hooks";
import { compile } from "@rsvelte/vite-plugin-svelte-native";

export function rsvelteJsPlugin(metrics) {
  return {
    name: "rsvelte-js-compiler",
    transform(code, id) {
      if (!id.endsWith(".svelte")) return null;

      const startedAt = performance.now();
      const result = compile(code, { filename: id });
      metrics?.record(performance.now() - startedAt);

      return {
        code: result.js.code,
        map: null,
      };
    },
  };
}
