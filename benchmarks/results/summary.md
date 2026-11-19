# Benchmark summary

Generated at 2026-11-19T10:15:06.021Z. Lower is better.

| Framework | Fixture | Modules | Mode | JS median | Native median | Paired speedup | 95% CI |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: |
| astro | small | 8 | cold | 28.03 ms | 21.91 ms | 1.27x | 1.20–1.37x |
| astro | small | 8 | warm | 10.24 ms | 10.91 ms | 1.02x | 0.94–1.05x |
| astro | medium | 500 | cold | 200.91 ms | 188.22 ms | 1.06x | 1.03–1.10x |
| astro | medium | 500 | warm | 151.87 ms | 141.41 ms | 1.07x | 1.03–1.11x |
| astro | large | 2000 | cold | 625.11 ms | 591.83 ms | 1.03x | 1.03–1.13x |
| astro | large | 2000 | warm | 549.36 ms | 519.85 ms | 1.04x | 1.02–1.05x |
| rsvelte | small | 8 | cold | 32.47 ms | 25.29 ms | 1.29x | 1.22–1.38x |
| rsvelte | small | 8 | warm | 12.31 ms | 12.18 ms | 1.05x | 0.97–1.13x |
| rsvelte | medium | 500 | cold | 269.67 ms | 233.07 ms | 1.14x | 1.08–1.21x |
| rsvelte | medium | 500 | warm | 220.13 ms | 199.78 ms | 1.10x | 1.05–1.14x |
| rsvelte | large | 2000 | cold | 819.86 ms | 768.52 ms | 1.08x | 1.03–1.13x |
| rsvelte | large | 2000 | warm | 733.39 ms | 688.88 ms | 1.08x | 1.04–1.10x |
| solid | small | 8 | cold | 45.48 ms | 39.92 ms | 1.25x | 0.76–1.33x |
| solid | small | 8 | warm | 16.00 ms | 16.63 ms | 0.94x | 0.88–1.08x |
| solid | medium | 500 | cold | 279.19 ms | 272.48 ms | 1.02x | 0.98–1.13x |
| solid | medium | 500 | warm | 216.68 ms | 220.77 ms | 0.96x | 0.92–1.04x |
| solid | large | 2000 | cold | 878.21 ms | 813.96 ms | 1.07x | 0.96–1.10x |
| solid | large | 2000 | warm | 641.25 ms | 601.00 ms | 1.08x | 1.06–1.11x |
| vize | small | 8 | cold | 29.35 ms | 20.93 ms | 1.41x | 1.38–1.44x |
| vize | small | 8 | warm | 8.86 ms | 8.67 ms | 1.04x | 0.96–1.15x |
| vize | medium | 500 | cold | 240.52 ms | 214.28 ms | 1.11x | 1.07–1.15x |
| vize | medium | 500 | warm | 195.89 ms | 183.74 ms | 1.03x | 0.99–1.08x |
| vize | large | 2000 | cold | 1388.52 ms | 1304.45 ms | 1.23x | 0.92–1.36x |
| vize | large | 2000 | warm | 773.71 ms | 707.39 ms | 1.09x | 1.04–1.12x |

<details>
<summary>Method and environment</summary>

- Cold samples: 15 new Node.js processes per path.
- Warm samples: 30 builds per path across 5 processes. Each process is warmed once; paths are interleaved.
- Paired speedup is the median of adjacent JS/native ratios. The interval is a deterministic 10,000-resample paired bootstrap CI.
- Native build time is excluded; plugin package resolution and library loading are included.
- Every JS/native fixture pair was byte-verified before measurement.
- Platform: darwin arm64.
- CPU: Apple M5 Pro (15 logical cores).
- Node.js: v24.22.2.
- Rust: rustc 1.100.0 (0ef1bc386 2026-11-09).

</details>
