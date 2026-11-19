import { performance } from "node:perf_hooks";
import { transform } from "@astrojs/compiler-rs";

export function astroJsPlugin(metrics) {
  return {
    name: "astro-js-compiler",
    transform(code, id) {
      if (!id.endsWith(".astro")) return null;

      const startedAt = performance.now();
      const result = transform(code, {
        compact: false,
        filename: id,
      });
      metrics?.record(performance.now() - startedAt);

      return {
        code: result.code,
        map: null,
      };
    },
  };
}
