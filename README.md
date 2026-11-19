# Rolldown native plugin benchmarks

This repository measures Rolldown JavaScript plugins against the experimental native plugin ABI using real framework compilers.

The comparison is intentionally narrow: both paths must call the same compiler revision with equivalent options and produce equivalent output. The JavaScript path calls the compiler through its Node-API package; the native path links the Rust compiler core into a Rolldown native plugin. This isolates the cost of returning to JavaScript and Node-API inside a transform hook.

## Layout

```text
rolldown/                  pinned fork containing the experimental ABI
consumers/<framework>/js/  regular Rolldown JavaScript plugin
consumers/<framework>/native/
                           C ABI plugin linked to the same compiler core
consumers/<framework>/fixtures/
                           deterministic small and large projects
benchmarks/                machine-readable and rendered results
scripts/                   fixture, verification, and benchmark harnesses
```

## Status

| Consumer | JavaScript path | Native path | Comparable |
| --- | --- | --- | --- |
| Solid | `@solidjs/compiler` Node-API binding | `solidjs-compiler::compile` | byte-identical |
| Astro | `@astrojs/compiler-rs` Node-API binding | `astro_codegen` with the same parser revision | byte-identical |
| Vize | `@vizejs/native` Node-API binding | `vize_atelier_sfc` | byte-identical |
| RSvelte | `@rsvelte/vite-plugin-svelte-native` Node-API binding | `rsvelte` core at the matching release tag | byte-identical |
| React | `babel-plugin-react-compiler` | official Rust port | blocked upstream: Rust code generation is not implemented yet |

React remains in the repository so the blocker, fixtures, and future integration are reviewable. It is not included in aggregate performance claims until both paths can produce equivalent output.

## Methodology

- Compiler versions and source revisions are pinned.
- Small (8 components), medium (500), and large (2,000) fixtures are generated deterministically and shared by both paths.
- Every pair is verified before it is timed. A mismatch invalidates the result.
- Cold measurements use a new Node process. Warm measurements are split across five processes; each is warmed once and creates a fresh Rolldown build per sample.
- JavaScript and native samples are adjacent pairs with alternating order. Results report a paired median speedup with a 95% bootstrap confidence interval, plus the raw samples and descriptive statistics.
- Native library build time is excluded. Plugin discovery and loading are included in cold and warm build wall time.
- No result is described as a framework-wide speedup; the benchmark isolates this compiler-plugin boundary.

Detailed results are written to `benchmarks/results/` with the machine, toolchain, revisions, fixture sizes, and raw samples needed to reproduce them.

## Setup

Nix with flakes enabled is the only host requirement. The development shell
provides the pinned Node.js, pnpm, Rust, C/C++, Go, Zig, CMake, Ninja, and
benchmarking toolchains on macOS and Linux.

Bootstrap the complete repository with one command:

```sh
nix develop --command pnpm run bootstrap
```

This initializes the pinned Rolldown submodule, installs both dependency trees,
builds Rolldown and every native plugin, and generates the benchmark fixtures.
Toolchain and package-manager caches stay under `.cache/`; no user-level Node,
pnpm, Rust, C/C++, Go, or Zig installation is required.

For interactive work, enter the same pinned environment and run verification or
benchmarks directly:

```sh
nix develop
pnpm verify
pnpm benchmark
```

An intentionally non-realistic 100,000-component workload is opt-in so normal
bootstrap and verification do not create half a million fixture files:

```sh
FIXTURE_SIZES=max pnpm fixtures
BENCH_FIXTURES=max \
  BENCH_RESULT_NAME=max \
  BENCH_COLD_SAMPLES=1 \
  BENCH_WARM_SAMPLES=1 \
  pnpm benchmark
```

The `max` result is a stress limit, not evidence for a representative web
application and is never included in aggregate claims. It is written separately
to `benchmarks/results/max.json` and `max-summary.md`; React is omitted because
its Rust compiler port does not yet provide code generation.

The native plugins are trusted in-process code. This repository only loads libraries built from its pinned source dependencies.
