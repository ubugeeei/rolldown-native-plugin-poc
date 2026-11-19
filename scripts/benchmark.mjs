import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { cpus, totalmem } from "node:os";
import { resolve } from "node:path";
import process from "node:process";
import { performance } from "node:perf_hooks";

import { comparableFrameworks, fixtureSizes } from "./frameworks.mjs";

const coldIterations = positiveInteger("BENCH_COLD_SAMPLES", 15);
const warmIterations = positiveInteger("BENCH_WARM_SAMPLES", 30);

function positiveInteger(name, fallback) {
  const value = process.env[name];
  if (value === undefined) return fallback;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function command(commandName, args = []) {
  const result = spawnSync(commandName, args, {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`${commandName} ${args.join(" ")} failed:\n${result.stderr || result.stdout}`);
  }
  return result.stdout.trim();
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

function summarizeSamples(samples) {
  return {
    buildMs: statistics(samples.map((sample) => sample.buildMs)),
    maxRssKiB: statistics(samples.map((sample) => sample.maxRssKiB)),
    processMs: samples[0].processMs
      ? statistics(samples.map((sample) => sample.processMs))
      : undefined,
    rssBytes: statistics(samples.map((sample) => sample.rssBytes)),
    transformMs: statistics(samples.flatMap((sample) => sample.transformMs)),
  };
}

function ratio(javascript, native) {
  return {
    nativeChangePercent: (native / javascript - 1) * 100,
    speedup: javascript / native,
  };
}

function fixed(value) {
  return value.toFixed(2);
}

function markdown(results) {
  const lines = [
    "# Benchmark summary",
    "",
    `Generated at ${results.metadata.timestamp}. Lower is better.`,
    "",
    "| Framework | Fixture | Mode | JS median | Native median | Native change | Speedup |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: |",
  ];

  for (const result of results.cases) {
    for (const mode of ["cold", "warm"]) {
      const javascript = result[mode].summary.js.buildMs.median;
      const native = result[mode].summary.native.buildMs.median;
      const comparison = ratio(javascript, native);
      lines.push(
        `| ${result.framework} | ${result.size} | ${mode} | ` +
          `${fixed(javascript)} ms | ${fixed(native)} ms | ` +
          `${fixed(comparison.nativeChangePercent)}% | ${fixed(comparison.speedup)}x |`,
      );
    }
  }

  lines.push(
    "",
    "<details>",
    "<summary>Method and environment</summary>",
    "",
    `- Cold samples: ${results.metadata.iterations.cold} new Node.js processes per path.`,
    `- Warm samples: ${results.metadata.iterations.warm} builds per path in one reused process, interleaved by path.`,
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
  for (const size of Object.keys(fixtureSizes)) {
    const cold = { js: [], native: [] };
    for (let index = 0; index < coldIterations; index += 1) {
      const order = index % 2 === 0 ? ["js", "native"] : ["native", "js"];
      for (const path of order) {
        cold[path].push(coldSample(framework.name, path, size));
      }
    }

    const warm = worker(["warm-pair", framework.name, size, String(warmIterations)]);
    const result = {
      cold: {
        samples: cold,
        summary: {
          js: summarizeSamples(cold.js),
          native: summarizeSamples(cold.native),
        },
      },
      framework: framework.name,
      size,
      warm: {
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
    },
    memoryBytes: totalmem(),
    platform: process.platform,
    revisions: {
      dirty: command("git", ["status", "--porcelain"]).length > 0,
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
await mkdir(outputDirectory, { recursive: true });
await writeFile(resolve(outputDirectory, "latest.json"), `${JSON.stringify(results, null, 2)}\n`);
await writeFile(resolve(outputDirectory, "summary.md"), markdown(results));
