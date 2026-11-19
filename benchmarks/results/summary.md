# Benchmark summary

Generated at 2026-11-19T09:49:28.870Z. Lower is better.

| Framework | Fixture | Mode | JS median | Native median | Native change | Speedup |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| astro | large | cold | 275.90 ms | 209.31 ms | -24.14% | 1.32x |
| astro | large | warm | 85.78 ms | 89.63 ms | 4.49% | 0.96x |
| astro | small | cold | 30.30 ms | 24.89 ms | -17.86% | 1.22x |
| astro | small | warm | 12.72 ms | 13.51 ms | 6.24% | 0.94x |
| rsvelte | large | cold | 220.61 ms | 198.94 ms | -9.82% | 1.11x |
| rsvelte | large | warm | 253.07 ms | 231.28 ms | -8.61% | 1.09x |
| rsvelte | small | cold | 35.66 ms | 30.34 ms | -14.92% | 1.18x |
| rsvelte | small | warm | 12.72 ms | 12.36 ms | -2.83% | 1.03x |
| solid | large | cold | 142.86 ms | 135.59 ms | -5.08% | 1.05x |
| solid | large | warm | 95.15 ms | 92.53 ms | -2.76% | 1.03x |
| solid | small | cold | 30.48 ms | 27.27 ms | -10.51% | 1.12x |
| solid | small | warm | 9.98 ms | 9.74 ms | -2.34% | 1.02x |
| vize | large | cold | 209.79 ms | 179.94 ms | -14.23% | 1.17x |
| vize | large | warm | 148.93 ms | 134.52 ms | -9.67% | 1.11x |
| vize | small | cold | 43.46 ms | 29.84 ms | -31.33% | 1.46x |
| vize | small | warm | 14.90 ms | 15.21 ms | 2.10% | 0.98x |

<details>
<summary>Method and environment</summary>

- Cold samples: 15 new Node.js processes per path.
- Warm samples: 30 builds per path in one reused process, interleaved by path.
- Native build time is excluded; plugin package resolution and library loading are included.
- Every JS/native fixture pair was byte-verified before measurement.
- Platform: darwin arm64.
- CPU: Apple M5 Pro (15 logical cores).
- Node.js: v24.22.2.
- Rust: rustc 1.100.0 (0ef1bc386 2026-11-09).

</details>
