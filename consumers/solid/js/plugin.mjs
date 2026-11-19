import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';

const require = createRequire(import.meta.url);
const { transform } = require('@solidjs/compiler');

export function solidJsPlugin(metrics) {
  return {
    name: 'solid-js-compiler',
    transform(code, id) {
      if (!/\.[jt]sx$/.test(id)) return null;

      const startedAt = performance.now();
      const result = transform(code, {
        filename: id,
        sourceMap: false,
      });
      metrics.record(performance.now() - startedAt);

      return {
        code: result.code,
        map: null,
      };
    },
  };
}
