# Dev Toolbox

Practical browser tools for **messaging, API payloads and POS troubleshooting**. Inspect an SMS segment jump, unwrap a Base64 order event, or turn a repeated debugging routine into a Pipeline.

[Try the app](https://app.aiuos.com) · [中文](README.zh-CN.md) · [Download v1.0.1](https://github.com/401040579/dev-toolbox/releases/tag/v1.0.1) · [Contribute](CONTRIBUTING.md)

![SMS encoding and segment inspection with synthetic order data](docs/screenshots/sms-segment.png)

## Three useful jobs

| Task | Start here | What you get |
| --- | --- | --- |
| A pickup message suddenly uses more SMS segments | [SMS Segment Calculator](https://app.aiuos.com/tools/text/sms-segment) | GSM-7 / UCS-2 estimate, highlighted non-GSM characters, Smart Encoding comparison and segment boundaries |
| A webhook/log field contains Base64 JSON | [Pipeline](https://app.aiuos.com/pipeline) → Templates → Base64 → JSON Pretty | Readable event payload; reusable steps and a shareable synthetic example |
| A demo order event is difficult to inspect | [JSON Formatter](https://app.aiuos.com/tools/json/json-formatter), Diff, Epoch, Hash | Formatted fields, differences, timestamps and fingerprints for a debugging note |

The catalog also includes local QR generation, Markdown preview, static SVG cleanup, encoding and small developer utilities. The focus is practical inspection, with no backend or account required.

## Five minutes to a useful result

1. Open the [SMS calculator](https://app.aiuos.com/tools/text/sms-segment). Paste this **fictional** message:
   ```text
   Order DEMO-1042 is “ready”—collect at the demo desk. Reply “YES” to confirm your pickup time. Thank you!
   ```
   Compare encoding and segments with Smart Encoding off/on. Curly quotes and the em dash change the encoding; normalization may reduce the estimate.
2. Open [Pipeline](https://app.aiuos.com/pipeline), select **Templates → Base64 → JSON Pretty**. The included order event uses `DEMO-1042` and `DEMO-STORE`. Change a field, add a transform, and inspect each step.
3. Try **Templates → SMS → Smart Encoding**. Copy the result into the SMS calculator to inspect the normalized text.
4. Save a Pipeline locally or share a synthetic example. **The share URL contains its entire input and settings; everyone with the link can read them.** Do not use customer, payment, credential or production data in shared examples.

![A local Pipeline decoding a synthetic POS event](docs/screenshots/pipeline.png)

## Run locally

Use **Node.js 22** and npm 10 or newer. The lockfile is committed.

```bash
git clone https://github.com/401040579/dev-toolbox.git
cd dev-toolbox
# With nvm: nvm use
npm ci
npm run dev
```

Open the URL printed by Vite. For a production build:

```bash
npm run build
npm run preview
```

The [release](https://github.com/401040579/dev-toolbox/releases/tag/v1.0.1) also provides a static site ZIP, SHA-256 checksum and GitHub source archives. Extract the site ZIP, run `python3 serve.py`, and open `http://localhost:4173`. Use a local HTTP server; opening `index.html` as a file is insufficient for module loading and Web Crypto. To rebuild the archive from a clean tagged checkout: `npm ci`, `npm run build`, `npm run release:package` (Python 3 required).

## Privacy, offline use and boundaries

- **Tool inputs are processed in your browser without uploads.** QR preview and SVG downloads are generated locally. The host still receives ordinary site requests. There is no app analytics or tracking-cookie service.
- Preferences, favorites and explicitly saved Pipelines use browser local storage. Share links put configuration in the URL fragment, which is not an ordinary HTTP request payload, but can be read by link recipients and retained in browser history. External links open on explicit click and leave the app.
- Markdown supports common GFM structures (lists, tables, code and links). Raw HTML displays as text and images display as alt text, preventing automatic resource requests.
- SVG cleanup supports **static artwork**. Scripts, event handlers, CSS, animation, embedded images and external references are removed from preview **and export**. Local gradients, masks, clips and fragment references are supported. It is a lightweight cleanup tool, not a full SVGO replacement.
- The service worker precaches the production app after a successful online load. First load and updates require a connection; browser storage eviction/private browsing can affect offline availability. New versions show a reload prompt; copy unsaved input first. If an older cached build has no prompt, close all site tabs and installed app windows, then reopen online.
- SMS results are estimates, not carrier billing guarantees. Provider encoding, concatenation headers and billing rules vary. “Password Hash” uses PBKDF2-SHA256, not bcrypt. JWT/OAuth decoding does not authenticate a token; “Not expired” describes its timestamp only. MD5 and CRC are for legacy compatibility/checksums.
- JSON/YAML conversion uses YAML 1.2 core types. TOML requires an object root and does not represent null; unquoted date/time values are rejected, so quote them to preserve text. Both converters reject unsupported types, non-finite numbers and integers outside JavaScript's safe range rather than silently changing data. Limits: 1 MiB input, 4 MiB output, 64 levels, 50,000 values and 100 expanded YAML aliases.
- Cron tools support five numeric fields with lists, ranges and steps, including Sunday `0`/`7`. Named fields and dialect extensions are rejected. Upcoming runs use your browser's local time zone and search at most 366 days; they do not simulate a particular server's DST handling.
- Share configurations allow up to 32 steps, 250,000 JSON characters and 8,000 URL characters. The app reports links that exceed those limits. Chromium is the automated browser target; Firefox, Safari and mobile PWA installation are not independently certified.

## Verify and contribute

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm audit
```

CI runs a clean install, lint, unit tests, dependency audit, production build and Chromium E2E before deploying `main` through GitHub Pages. The existing custom domain remains `app.aiuos.com`. Build metadata is available at [`version.json`](https://app.aiuos.com/version.json). See [contributing](CONTRIBUTING.md), [security reporting](SECURITY.md), [changelog](CHANGELOG.md) and the [release validation record](docs/releases/v1.0.1-validation.md).

## License and credits

Original project code is [MIT](LICENSE). Twilio's SMS character/Smart Encoding tables and segmentation approach retain Twilio's MIT attribution. Lucide, DOMPurify, Marked, node-qrcode and other dependencies retain their own licenses. [Third-party attribution](THIRD_PARTY_NOTICES.md) links the source revisions and complete notices, which are included with the static site. Screenshots use synthetic data; no Twilio logo or customer records are included.
