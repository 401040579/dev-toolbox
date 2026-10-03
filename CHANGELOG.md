# Changelog

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
