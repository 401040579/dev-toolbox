# Changelog

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
