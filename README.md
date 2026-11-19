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
| Solid | `@solidjs/compiler` Node-API binding | `solidjs-compiler::compile` | in progress |
| Astro | `@astrojs/compiler-rs` Node-API binding | `astro_codegen` with the same parser revision | in progress |
| Vize | `@vizejs/native` Node-API binding | `vize_atelier_sfc` | in progress |
| RSvelte | `@rsvelte/vite-plugin-svelte-native` Node-API binding | `rsvelte` core at the matching release tag | in progress |
| React | `babel-plugin-react-compiler` | official Rust port | blocked upstream: Rust code generation is not implemented yet |

React remains in the repository so the blocker, fixtures, and future integration are reviewable. It is not included in aggregate performance claims until both paths can produce equivalent output.

## Methodology

- Compiler versions and source revisions are pinned.
- Small and large fixtures are generated deterministically and shared by both paths.
- Every pair is verified before it is timed. A mismatch invalidates the result.
- Cold measurements use a new Node process. Warm measurements reuse a process but create a fresh Rolldown build.
- Results report all samples plus median, mean, standard deviation, p95, and `process.resourceUsage().maxRSS`.
- Native library build time is excluded. Plugin discovery and loading are included in cold and warm build wall time.
- No result is described as a framework-wide speedup; the benchmark isolates this compiler-plugin boundary.

Detailed results are written to `benchmarks/results/` with the machine, toolchain, revisions, fixture sizes, and raw samples needed to reproduce them.

## Setup

Nix with flakes enabled is the only host requirement. The development shell
provides the pinned Node.js, pnpm, Rust, C/C++, Go, Zig, CMake, Ninja, and
benchmarking toolchains on macOS and Linux.

```sh
nix develop
pnpm setup
pnpm verify
pnpm benchmark
```

`nix develop` provides the pinned Node.js, pnpm, Rust, C/C++, Go, Zig, CMake, and benchmark tooling. No host toolchain installation is required. The same commands can run non-interactively with `nix develop -c <command>`.

The native plugins are trusted in-process code. This repository only loads libraries built from its pinned source dependencies.
