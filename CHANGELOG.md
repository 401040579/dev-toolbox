# Changelog

## 1.3.0 — 2026-10-03

- Add V30-L High speed and V40-L Extreme profiles, 1/2/4 parallel codes and playback up to 30 FPS. Preserve the old DTF1/M compatibility profile.
- Reserve UTF-8 filename/MIME overhead before selecting bounded DTF2 RaptorQ geometry; retain CRC, length/SHA-256 verification and file/session limits.
- Pre-render a bounded board window in the Worker, scale one bitmap per display frame and play on RAF without adding codec time to dwell.
- Scan up to four codes with one camera job in flight; observe new video frames during decoding, process the latest one immediately and offer enhanced rotation/inversion scanning.
- Show actual display/scan rates, labeled payload throughput and verified whole-file duration/speed; fit boards within the viewport and warn when modules are too small.
- Preserve bilingual controls, old-frame reception, offline cold startup, camera lifecycle cleanup and byte-identical downloads; retain successful synthetic throughput reports in CI.

极限档模拟视频流测试约 3.9 秒传完 1 MiB 随机文件，约 263 KiB/s；超过旧配置的百倍，但真机速率仍受摄像头、屏幕、光照及对焦影响。见 [v1.3 验证记录](docs/releases/v1.3.0-validation.md)。

## 1.2.0 — 2026-10-02

- Add local animated QR file transfer: bounded multi-file queues, RaptorQ recovery frames, pause/resume, 3/6/10 FPS, sizing and full screen.
- Receive through explicit camera access and a Worker using raw-byte ZXing WASM; deduplicate, resume and verify length/SHA-256 before preview/download.
- Release camera tracks on stop, hidden pages, mode changes, navigation, late permission grants and failures; bound incomplete/completed state and reject malformed protocol input before decoder allocation.
- Send compressed images directly through a one-time memory handoff; correct stale image results, output-format labeling, object URL cleanup and visible failure feedback.
- Cache bundled scanning/FEC engines for offline cold visits; preserve wrapper and underlying WASM licenses.
- Restore shared action-button styles, distinguish selected/disabled controls and localize the QR file picker without browser-native English text.

新增二维码传文件，完整支持发送、连续接收、图片压缩入口和离线扫码。单个文件最多 5 MiB，每批 8 个 / 10 MiB；手机真机及硬件速度尚未验收。见 [v1.2 验证记录](docs/releases/v1.2.0-validation.md)。

## 1.1.0 — 2026-10-02

Add four practical workflows with complete English/Chinese copy.

- Restore text inputs and options across tool switches and refreshes; add disable/clear controls, session-only failure feedback and protection against stale async writes. Exclude password/key fields and generated credentials.
- Add JSON structural diff with safe field paths, type/array-order distinctions, filtering and complete report export; reject lossy numeric input and bounded-resource failures instead of showing misleading equality or partial reports.
- Add local log analysis with text/JSONL, multiline stacks, exact request traces, time/severity/keyword filters, Worker processing, pagination and lossless export.
- Add Smart Paste recommendations with explicit clipboard access and one-time in-memory input handoff, including same-tool navigation.
- Correct exact timestamp precision boundaries, validate restored option values and localize theme controls; test every category/card in both languages and cached-version upgrades.

新增草稿恢复、JSON 结构对比、日志分析和智能粘贴；详情与验收证据见 [v1.1 验证记录](docs/releases/v1.1.0-validation.md)。

## 1.0.1 — 2026-10-02

Polish the existing tools before expanding the catalog.

- Complete English/Chinese tool cards, categories, search, Pipeline transforms/options and missing controls; language changes update existing error messages and document language.
- Replace lossy YAML/TOML implementations with maintained, bounded parsers; preserve object arrays, empty collections and special keys, and prevent TOML prototype pollution.
- Correct large-number unit conversion, literal/empty slug separators, numeric Cron validation, upcoming-run calculation and strict IP parsing/IPv6 compression.
- Report clipboard/storage failures accurately; preserve saved Pipelines when persistence fails, and save on ordinary HTTP origins without requiring `randomUUID`.
- Reject malformed JWT payloads without crashing; describe expiration separately from authentication.
- Clear six hook warnings, load structured parsers on demand and add bilingual coverage plus browser regressions. See [validation evidence](docs/releases/v1.0.1-validation.md).

完善现有工具的中英文覆盖与失败反馈，修复转换结果、Cron、Slug、Pipeline 保存及 JWT 异常输入问题；本版本不新增工具。

## 1.0.0 — 2026-10-02

First formal open-source release, focused on messaging, API payloads and POS troubleshooting.

- Local QR SVG previews/downloads replace the external QR API.
- Markdown uses Marked and DOMPurify; raw HTML and images have explicit safe display boundaries.
- SVG preview and export use parsed, sanitized static artwork; external resources and active content are removed.
- Gradient colors cannot inject remote background layers.
- Pipeline share configurations are validated; hash changes load correctly, auto-run no longer follows result-state changes, and stale async results are discarded.
- Accurate bilingual privacy, offline and crypto boundaries; repaired persisted language, counters and template names.
- Synthetic POS/SMS Pipeline examples, task-oriented entry points and bilingual five-minute guide.
- MIT project license, retained Twilio/third-party notices, real screenshots, checksummed static ZIP and build metadata.
- Patched dependencies and verification-gated GitHub Pages deployment. See [validation evidence](docs/releases/v1.0.0-validation.md).

首个正式开源版本：本地二维码、安全预览与导出、分享配置校验、虚构排障样例、双语文档和保留第三方归属的静态发行制品。
