import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { cpus, totalmem } from "node:os";
import { resolve } from "node:path";
import process from "node:process";
import { performance } from "node:perf_hooks";

import { comparableFrameworks, fixtureSizes, selectedFixtureNames } from "./frameworks.mjs";

const coldIterations = positiveInteger("BENCH_COLD_SAMPLES", 15);
const warmIterations = positiveInteger("BENCH_WARM_SAMPLES", 30);
const warmProcesses = Math.min(warmIterations, positiveInteger("BENCH_WARM_PROCESSES", 5));
const bootstrapIterations = 10_000;
const fixtures = selectedFixtureNames(process.env.BENCH_FIXTURES);
const resultName = process.env.BENCH_RESULT_NAME ?? "latest";

if (!/^[a-z0-9][a-z0-9-]*$/u.test(resultName)) {
  throw new Error("BENCH_RESULT_NAME must contain only lowercase letters, digits, and hyphens");
}

function positiveInteger(name, fallback) {
  const value = process.env[name];
  if (value === undefined) return fallback;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function command(commandName, args = [], options = {}) {
  const result = spawnSync(commandName, args, {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`${commandName} ${args.join(" ")} failed:\n${result.stderr || result.stdout}`);
  }
  return options.trim === false ? result.stdout : result.stdout.trim();
}

function repositoryDirty() {
  const status = command("git", ["status", "--porcelain"], { trim: false });
  return status
    .split("\n")
    .filter(Boolean)
    .some((line) => !line.slice(3).startsWith("benchmarks/results/"));
}

function worker(args) {
  const result = spawnSync(process.execPath, ["scripts/benchmark-worker.mjs", ...args], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "benchmark worker failed");
  }

  const marker = result.stdout.split("\n").findLast((line) => line.startsWith("BENCH_RESULT:"));
  if (!marker) throw new Error(`benchmark worker returned no result:\n${result.stdout}`);
  return JSON.parse(marker.slice("BENCH_RESULT:".length));
}

function coldSample(framework, path, size) {
  const startedAt = performance.now();
  const sample = worker(["once", framework, path, size]);
  return {
    ...sample,
    processMs: performance.now() - startedAt,
  };
}

function percentile(sorted, ratio) {
  const index = Math.max(0, Math.ceil(sorted.length * ratio) - 1);
  return sorted[index];
}

function statistics(values) {
  if (values.length === 0) return null;

  const sorted = values.toSorted((left, right) => left - right);
  const mean = sorted.reduce((total, value) => total + value, 0) / sorted.length;
  const variance = sorted.reduce((total, value) => total + (value - mean) ** 2, 0) / sorted.length;
  const middle = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];

  return {
    count: sorted.length,
    max: sorted.at(-1),
    mean,
    median,
    min: sorted[0],
    p95: percentile(sorted, 0.95),
    standardDeviation: Math.sqrt(variance),
  };
}

function randomGenerator(seed) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function pairedSpeedup(javascriptSamples, nativeSamples) {
  if (javascriptSamples.length !== nativeSamples.length) {
    throw new Error("paired benchmark paths returned different sample counts");
  }

  const values = javascriptSamples.map(
    (sample, index) => sample.buildMs / nativeSamples[index].buildMs,
  );
  const summary = statistics(values);
  if (values.length < 2) {
    return { confidence95: null, ...summary };
  }

  const random = randomGenerator(0x726f6c6c ^ values.length);
  const bootstrapMedians = [];

  for (let iteration = 0; iteration < bootstrapIterations; iteration += 1) {
    const resampled = Array.from(
      { length: values.length },
      () => values[Math.floor(random() * values.length)],
    );
    bootstrapMedians.push(statistics(resampled).median);
  }

  bootstrapMedians.sort((left, right) => left - right);
  return {
    confidence95: {
      high: percentile(bootstrapMedians, 0.975),
      low: percentile(bootstrapMedians, 0.025),
    },
    ...summary,
  };
}

function summarizeSamples(samples) {
  return {
    buildMs: statistics(samples.map((sample) => sample.buildMs)),
    maxRssKiB: statistics(samples.map((sample) => sample.maxRssKiB)),
    processMs: samples[0].processMs
      ? statistics(samples.map((sample) => sample.processMs))
      : undefined,
    rssBytes: statistics(samples.map((sample) => sample.rssBytes)),
    transformMs: statistics(
      samples.flatMap((sample) => (sample.transformMs === null ? [] : [sample.transformMs])),
    ),
  };
}

function fixed(value) {
  return value.toFixed(2);
}

function plural(count, singular) {
  return count === 1 ? singular : `${singular}s`;
}

function markdown(results) {
  const lines = [
    "# Benchmark summary",
    "",
    `Generated at ${results.metadata.timestamp}. Lower is better.`,
    "",
    "| Framework | Fixture | Modules | Mode | JS median | Native median | Paired speedup | 95% CI |",
    "| --- | --- | ---: | --- | ---: | ---: | ---: | ---: |",
  ];

  if (results.metadata.fixtures.max !== undefined) {
    lines.splice(
      3,
      0,
      "The 100,000-component `max` fixture is an intentionally non-realistic stress limit.",
      "",
    );
  }

  for (const result of results.cases) {
    for (const mode of ["cold", "warm"]) {
      const javascript = result[mode].summary.js.buildMs.median;
      const native = result[mode].summary.native.buildMs.median;
      const speedup = result[mode].pairedBuildSpeedup;
      const confidence =
        speedup.confidence95 === null
          ? "n/a"
          : `${fixed(speedup.confidence95.low)}–${fixed(speedup.confidence95.high)}x`;
      lines.push(
        `| ${result.framework} | ${result.size} | ${fixtureSizes[result.size]} | ${mode} | ` +
          `${fixed(javascript)} ms | ${fixed(native)} ms | ` +
          `${fixed(speedup.median)}x | ${confidence} |`,
      );
    }
  }

  lines.push(
    "",
    "<details>",
    "<summary>Method and environment</summary>",
    "",
    `- Cold samples: ${results.metadata.iterations.cold} new Node.js ${plural(results.metadata.iterations.cold, "process")} per path.`,
    `- Warm samples: ${results.metadata.iterations.warm} ${plural(results.metadata.iterations.warm, "build")} per path across ${results.metadata.iterations.warmProcesses} ${plural(results.metadata.iterations.warmProcesses, "process")}. Each process is warmed once; paths are interleaved.`,
    `- Paired speedup is the median of adjacent JS/native ratios. With two or more pairs, the interval is a deterministic ${bootstrapIterations.toLocaleString("en-US")}-resample paired bootstrap CI.`,
    "- Native build time is excluded; plugin package resolution and library loading are included.",
    "- Every JS/native fixture pair was byte-verified before measurement.",
    `- Platform: ${results.metadata.platform} ${results.metadata.arch}.`,
    `- CPU: ${results.metadata.cpu.model} (${results.metadata.cpu.count} logical cores).`,
    `- Node.js: ${results.metadata.versions.node}.`,
    `- Rust: ${results.metadata.versions.rustc}.`,
    "",
    "</details>",
    "",
  );
  return lines.join("\n");
}

if (process.env.BENCH_SKIP_VERIFY !== "1") {
  command(process.execPath, ["scripts/verify.mjs"]);
}

const cases = [];
for (const framework of comparableFrameworks) {
  for (const size of fixtures) {
    const cold = { js: [], native: [] };
    for (let index = 0; index < coldIterations; index += 1) {
      const order = index % 2 === 0 ? ["js", "native"] : ["native", "js"];
      for (const path of order) {
        cold[path].push(coldSample(framework.name, path, size));
      }
    }

    const warm = { js: [], native: [] };
    for (let processIndex = 0; processIndex < warmProcesses; processIndex += 1) {
      const processIterations =
        Math.floor(warmIterations / warmProcesses) +
        (processIndex < warmIterations % warmProcesses ? 1 : 0);
      const processSamples = worker(["warm-pair", framework.name, size, String(processIterations)]);

      for (const path of ["js", "native"]) {
        warm[path].push(
          ...processSamples[path].map((sample, pairIndex) => ({
            ...sample,
            pairIndex,
            processIndex,
          })),
        );
      }
    }

    const result = {
      cold: {
        pairedBuildSpeedup: pairedSpeedup(cold.js, cold.native),
        samples: cold,
        summary: {
          js: summarizeSamples(cold.js),
          native: summarizeSamples(cold.native),
        },
      },
      framework: framework.name,
      size,
      warm: {
        pairedBuildSpeedup: pairedSpeedup(warm.js, warm.native),
        samples: warm,
        summary: {
          js: summarizeSamples(warm.js),
          native: summarizeSamples(warm.native),
        },
      },
    };
    cases.push(result);
    console.log(
      `${framework.name}/${size}: ` +
        `cold ${fixed(result.cold.summary.js.buildMs.median)} -> ` +
        `${fixed(result.cold.summary.native.buildMs.median)} ms, ` +
        `warm ${fixed(result.warm.summary.js.buildMs.median)} -> ` +
        `${fixed(result.warm.summary.native.buildMs.median)} ms`,
    );
  }
}

const cpu = cpus();
const results = {
  cases,
  metadata: {
    arch: process.arch,
    cpu: {
      count: cpu.length,
      model: cpu[0]?.model ?? "unknown",
    },
    iterations: {
      cold: coldIterations,
      warm: warmIterations,
      warmProcesses,
    },
    fixtures: Object.fromEntries(fixtures.map((name) => [name, fixtureSizes[name]])),
    memoryBytes: totalmem(),
    platform: process.platform,
    revisions: {
      dirty: repositoryDirty(),
      repository: command("git", ["rev-parse", "HEAD"]),
      rolldown: command("git", ["-C", "rolldown", "rev-parse", "HEAD"]),
    },
    timestamp: new Date().toISOString(),
    versions: {
      node: process.version,
      pnpm: command("pnpm", ["--version"]),
      rustc: command("rustc", ["--version"]),
    },
  },
};
const outputDirectory = resolve("benchmarks", "results");
const summaryName = resultName === "latest" ? "summary.md" : `${resultName}-summary.md`;

await mkdir(outputDirectory, { recursive: true });
await writeFile(
  resolve(outputDirectory, `${resultName}.json`),
  `${JSON.stringify(results, null, 2)}\n`,
);
await writeFile(resolve(outputDirectory, summaryName), markdown(results));
