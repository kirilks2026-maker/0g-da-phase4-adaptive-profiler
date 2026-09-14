# 0G DA Phase 4: Dynamic Adaptive Load Profiler

Automated high-throughput profiling and stream ingestion benchmark suite for the **0G Data Availability (DA)** network. Designed to evaluate indexer slot allocation tolerances, dynamic memory scaling, and rate-limiting failure thresholds.

## Key Features

* **Dynamic Memory Scaling**: Scales ingestion payloads dynamically (50 MB → 500 MB) with anti-compression RAM buffers.
* **Fault-Tolerance Safety (Circuit Breaker)**: Automated execution halt triggers upon discovering peak drop rate limits to prevent RPC rate-limit lockouts.
* **Telemetry Reporting**: Exports comprehensive JSON payload distribution metrics.

## Benchmark Execution Log

### Phase 4 Profiler Initiation


🚀 [Phase 4] Starting Dynamic Adaptive Load Profiler
📊 Configuration: 10 Workers | Dynamic Scaling (50MB ➔ 500MB)

➔ 🧭 Epoch x1 [Step: 50MB/chunk | Load: 20 Chunks (0.98 GB)]
[+00:00.001] ⚡ Allocating dynamic 50MB RAM buffer (Anti-Compression pattern)...
[+00:19.530] [Worker #01 | Tag 1_c0   ] Failed   : INFO[2026-09-14T11:31:23Z] Selecting nodes ...
[+00:19.914] [Worker #03 | Tag 1_c2   ] Failed   : INFO[2026-09-14T11:31:24Z] Selecting nodes ...
[+00:20.826] [Worker #05 | Tag 1_c4   ] Failed   : INFO[2026-09-14T11:31:24Z] Selecting nodes ...
[+00:22.638] [Worker #10 | Tag 1_c9   ] Failed   : INFO[2026-09-14T11:31:27Z] Selecting nodes ...
[+00:22.890] [Worker #09 | Tag 1_c8   ] Failed   : INFO[2026-09-14T11:31:26Z] Selecting nodes ...
[+00:28.983] [Worker #02 | Tag 1_c1   ] Ingested : 50MB in 28.59s
[+00:31.300] [Worker #07 | Tag 1_c6   ] Ingested : 50MB in 29.16s
[+00:31.454] [Worker #08 | Tag 1_c7   ] Ingested : 50MB in 28.88s
[+00:32.830] [Worker #04 | Tag 1_c3   ] Ingested : 50MB in 31.78s
[+00:32.867] [Worker #06 | Tag 1_c5   ] Ingested : 50MB in 31.12s
[+00:53.660] [Worker #05 | Tag 1_c14  ] Failed   : INFO[2026-09-14T11:31:57Z] Selecting nodes ...
[+00:53.765] [Worker #01 | Tag 1_c10  ] Failed   : INFO[2026-09-14T11:31:56Z] Selecting nodes ...
[+00:53.906] [Worker #03 | Tag 1_c12  ] Failed   : INFO[2026-09-14T11:31:56Z] Selecting nodes ...
[+00:55.161] [Worker #10 | Tag 1_c19  ] Failed   : INFO[2026-09-14T11:32:00Z] Selecting nodes ...
[+00:55.284] [Worker #09 | Tag 1_c18  ] Failed   : INFO[2026-09-14T11:31:59Z] Selecting nodes ...
[+01:01.013] [Worker #02 | Tag 1_c11  ] Ingested : 50MB in 27.79s
[+01:04.723] [Worker #04 | Tag 1_c13  ] Ingested : 50MB in 30.84s
[+01:05.314] [Worker #06 | Tag 1_c15  ] Ingested : 50MB in 30.69s
[+01:17.499] [Worker #08 | Tag 1_c17  ] Ingested : 50MB in 42.02s
[+01:18.378] [Worker #07 | Tag 1_c16  ] Ingested : 50MB in 43.31s
📈 Epoch x1 (50MB) Finished: 10 OK / 10 Failed | Duration: 78.38s | Drop Rate: 50%

🛑 [Circuit Breaker] Failure Threshold Discovered at 50MB per chunk! (Drop Rate: 50%)


Requirements & Setup
```
npm install
node uploader_phase4.js
```
