import { performance } from "node:perf_hooks";
import { compileSfc } from "@vizejs/native";

export function vizeJsPlugin(metrics) {
  return {
    name: "vize-js-compiler",
    transform(code, id) {
      if (!id.endsWith(".vue")) return null;

      const startedAt = performance.now();
      const result = compileSfc(code, { filename: id });
      metrics?.record(performance.now() - startedAt);

      if (result.errors.length > 0) {
        throw new Error(result.errors.join("\n"));
      }

      return {
        code: result.code,
        map: null,
      };
    },
  };
}
