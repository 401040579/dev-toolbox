# Launch drafts / 发布文案草稿

Status: **drafts only, nothing has been posted.** Each file is one post for one channel. Numbers below come from the repository at the time of writing; re-check them before posting (run `npm run sitemap` and read the count it prints).

| File | Channel | Language |
| --- | --- | --- |
| [show-hn.md](show-hn.md) | Hacker News, "Show HN" | English |
| [product-hunt.md](product-hunt.md) | Product Hunt listing | English |
| [v2ex.md](v2ex.md) | V2EX「分享创造」 | 中文 |
| [sspai.md](sspai.md) | 少数派（投稿 / Matrix） | 中文 |

## Fact sheet (keep posts inside these lines)

- 90 registered tools, 58 Pipeline transforms, 11 categories (`src/tools/registry.ts`; `npm run sitemap` prints the current count).
- No backend, no account, no uploads: tool inputs are processed in the browser. The host still receives ordinary page requests. Analytics is off by default; if enabled it records the route path and referring site only (README → Analytics).
- Installable PWA; after one successful online load the production app is precached and works offline. First load and updates need a connection.
- MIT licensed. Twilio's SMS character tables and segmentation approach are used under Twilio's MIT notice; ZXing-C++ and RaptorQ are used through WASM wrappers with their notices preserved.
- Live at `https://app.aiuos.com`, source at `https://github.com/401040579/dev-toolbox`, v1.3.0 release ZIP with SHA-256 checksum.

### SMS Segment Calculator (`/tools/text/sms-segment`)

- Detects GSM-7 vs UCS-2, counts segments, shows the 160/153 and 70/67 per-segment limits, the 6-octet UDH for concatenation, remaining characters and "N characters until the next segment".
- Highlights every non-GSM-7 character (curly quotes, em dashes, fullwidth punctuation, emoji) and explains that one of them forces the whole message to UCS-2.
- Smart Encoding (Twilio's mapping) replaces non-GSM Unicode with GSM-7 equivalents and shows the cleaned message; also available as a Pipeline transform.
- Per-segment breakdown, grapheme/scalar/UTF-8 byte counts, LF vs CRLF warnings, forced-encoding mode.
- Boundary to state every time: **results are estimates; carrier encoding, concatenation headers and billing rules vary.**

### QR File Transfer (`/tools/image/qr-file-transfer`) and QR Text Transfer (`/tools/text/qr-text-transfer`)

- Sender shows the file as animated QR codes; receiver scans with its camera; everything stays on the two devices, no network between them and no server.
- RaptorQ fountain coding: missed or out-of-order frames are recovered from repair frames; stop/restart the camera and pending files resume.
- Profiles: Compatibility (384-byte symbols, M error correction, works with the v1.2 receiver), High speed (V30-L, default: 4 parallel codes, 30 FPS) and Extreme (V40-L for large screens). 1/2/4 parallel codes, 3–30 FPS, full-screen playback.
- Integrity: length and SHA-256 are verified before preview or save; previews only for PNG/JPEG/WebP/GIF/AVIF/BMP, everything else is download-only; HTML/SVG/video are never previewed.
- Limits: 5 MiB per file, 8 files / 10 MiB per batch, 3 incomplete receive sessions. Camera needs HTTPS or localhost and an explicit click.
- Measured: a 1 MiB incompressible random file completed in about 3.9 s (~263 KiB/s) in the **synthetic Extreme stream** (real QR pixels → simulated camera video → scanning Worker, in Chromium CI). **Physical phone-to-laptop throughput has not been measured**; say so whenever the number appears.
- Both ends must run this app; system camera apps and other QR tools are not compatible receivers.

### Other things worth one line each

- Pipeline: chain transforms (Base64 → JSON Pretty → Hash…), templates with synthetic POS events, save locally, share by link (the link carries the whole input in the URL fragment; say so).
- JSON structural diff, log analyzer (10 MiB, Worker), Smart Paste, draft restoration across reloads, bilingual UI (English / 简体中文).
- Deep links work and each tool page has its own title, description and share image.

## Things not to claim

- No user numbers, stars, downloads or "trusted by" lines: there are none yet.
- No "faster than X" comparisons for QR transfer beyond the synthetic measurement above.
- No security certification; say "processed in your browser" and point to the README boundaries, not "100% secure".
- Do not paste real customer messages, phone numbers or order IDs in screenshots or examples; use the `DEMO-1042` samples.
