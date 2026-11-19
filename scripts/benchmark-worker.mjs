import process from "node:process";
import { performance } from "node:perf_hooks";

import { buildFixture } from "./build.mjs";

function createMetrics() {
  let transformCount = 0;
  let transformMs = 0;

  return {
    record(duration) {
      transformCount += 1;
      transformMs += duration;
    },
    snapshot() {
      return {
        transformCount,
        transformMs: transformCount === 0 ? null : transformMs,
      };
    },
  };
}

async function measure(framework, path, size) {
  const metrics = createMetrics();
  const startedAt = performance.now();
  await buildFixture({ framework, metrics, path, size });

  return {
    buildMs: performance.now() - startedAt,
    maxRssKiB: process.resourceUsage().maxRSS,
    rssBytes: process.memoryUsage.rss(),
    ...metrics.snapshot(),
  };
}

async function runOnce() {
  const [, , , framework, path, size] = process.argv;
  return measure(framework, path, size);
}

async function runWarmPair() {
  const [, , , framework, size, iterationsText] = process.argv;
  const iterations = Number.parseInt(iterationsText, 10);
  const samples = { js: [], native: [] };

  await measure(framework, "js", size);
  await measure(framework, "native", size);

  for (let index = 0; index < iterations; index += 1) {
    const order = index % 2 === 0 ? ["js", "native"] : ["native", "js"];
    for (const path of order) {
      samples[path].push(await measure(framework, path, size));
    }
  }

  return samples;
}

const mode = process.argv[2];
const result = mode === "once" ? await runOnce() : await runWarmPair();
process.stdout.write(`BENCH_RESULT:${JSON.stringify(result)}\n`);
