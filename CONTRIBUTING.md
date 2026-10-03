# Contributing / 贡献

Useful contributions improve a concrete messaging, API or POS debugging task. Prefer a clear bug fix, protocol boundary or reusable Pipeline example over adding tools for their own sake. 中文 issue / PR 欢迎。

1. Search [issues](https://github.com/401040579/dev-toolbox/issues) before opening one. Describe the task, expected/actual result and a **synthetic** reproducer. Include browser and version; omit customer records, credentials and production logs.
2. Use Node.js 22 (`.nvmrc`), `npm ci`, then `npm run dev`. Tools are registered in `src/tools/registry.ts`; optional string transforms join Pipeline. UI strings live in `src/i18n/en/common.json` and `src/i18n/zh/common.json`.
3. Keep processing in the browser. Treat pasted text, files and shared configurations as untrusted. Preserve preview/export safety policy and show any supported boundary in both languages. New dependencies need source and license review plus regenerated `npm run notices`.
4. Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npx playwright install chromium`, `npm run test:e2e` and `npm audit`. Add a meaningful regression for behavioral changes. For security work, check actual DOM execution and network requests in a browser as well as normal rendering/export.
5. Submit a [pull request](https://github.com/401040579/dev-toolbox/pulls) with the problem, resulting behavior, validation and limits. Keep commits reviewable; avoid unrelated formatting or generated build files. CI verifies PRs; only verified `main` deploys to GitHub Pages.

Contributions are under the project's MIT license; preserve third-party copyright/license notices. Existing legacy hook-dependency warnings are documented in the release validation record and do not justify disabling lint checks for new code.
