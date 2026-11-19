# Benchmark summary

Generated at 2026-11-19T10:36:49.795Z. Lower is better.
The 100,000-component `max` fixture is an intentionally non-realistic stress limit.


| Framework | Fixture | Modules | Mode | JS median | Native median | Paired speedup | 95% CI |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: |
| astro | max | 100000 | cold | 28044.68 ms | 26948.07 ms | 1.04x | n/a |
| astro | max | 100000 | warm | 26041.12 ms | 25373.68 ms | 1.03x | n/a |
| rsvelte | max | 100000 | cold | 38876.25 ms | 49604.16 ms | 0.78x | n/a |
| rsvelte | max | 100000 | warm | 37054.19 ms | 32602.44 ms | 1.14x | n/a |
| solid | max | 100000 | cold | 28461.21 ms | 24978.93 ms | 1.14x | n/a |
| solid | max | 100000 | warm | 24687.97 ms | 24216.60 ms | 1.02x | n/a |
| vize | max | 100000 | cold | 44762.63 ms | 41101.83 ms | 1.09x | n/a |
| vize | max | 100000 | warm | 42053.95 ms | 40015.48 ms | 1.05x | n/a |

<details>
<summary>Method and environment</summary>

- Cold samples: 1 new Node.js process per path.
- Warm samples: 1 build per path across 1 process. Each process is warmed once; paths are interleaved.
- Paired speedup is the median of adjacent JS/native ratios. With two or more pairs, the interval is a deterministic 10,000-resample paired bootstrap CI.
- Native build time is excluded; plugin package resolution and library loading are included.
- Every JS/native fixture pair was byte-verified before measurement.
- Platform: darwin arm64.
- CPU: Apple M5 Pro (15 logical cores).
- Node.js: v24.22.2.
- Rust: rustc 1.100.0 (0ef1bc386 2026-11-09).

</details>
