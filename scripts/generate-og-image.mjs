// Renders public/og.png (1200×630 share card) with the bundled Playwright Chromium.
// Same palette as public/favicon.svg; system monospace only, no font downloads.
// Run `npm run og:image` after changing the copy below; the PNG is committed.
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; background: #0f1117; color: #e6e8ef; overflow: hidden; }
  body { font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace; padding: 68px 80px 60px; display: flex; flex-direction: column; justify-content: space-between; position: relative; }
  .glow { position: absolute; right: -180px; top: -220px; width: 620px; height: 620px; border-radius: 50%; background: radial-gradient(closest-side, rgba(0, 255, 150, 0.16), rgba(0, 255, 150, 0)); }
  .grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px); background-size: 40px 40px; }
  .brand { display: flex; align-items: center; gap: 28px; position: relative; }
  .badge { width: 112px; height: 112px; border-radius: 22px; background: #161a24; border: 3px solid #2a3140; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 54px; color: #00ff96; letter-spacing: -2px; }
  .name { font-size: 64px; font-weight: 700; letter-spacing: -1px; line-height: 1; }
  .name .prompt { color: #00ff96; margin-right: 10px; }
  .url { margin-top: 14px; font-size: 26px; color: #8b93a7; }
  .tagline { position: relative; font-size: 40px; line-height: 1.3; font-weight: 600; max-width: 1000px; color: #f3f4f8; }
  .tagline em { font-style: normal; color: #00ff96; }
  .pills { position: relative; display: flex; gap: 16px; }
  .pill { white-space: nowrap; flex: 0 0 auto; padding: 14px 22px; border-radius: 999px; border: 2px solid #2a3140; background: #141822; font-size: 24px; color: #c9d1de; }
  .pill b { color: #00ff96; font-weight: 700; margin-right: 10px; }
</style></head><body>
  <div class="grid"></div><div class="glow"></div>
  <div class="brand">
    <div class="badge">DT</div>
    <div><div class="name"><span class="prompt">&gt;</span>Dev Toolbox</div><div class="url">app.aiuos.com · installable PWA, works offline</div></div>
  </div>
  <div class="tagline">Practical browser tools for <em>SMS segments</em>, <em>API payloads</em> and <em>POS troubleshooting</em>.</div>
  <div class="pills">
    <div class="pill"><b>✓</b>No backend</div>
    <div class="pill"><b>✓</b>No account</div>
    <div class="pill"><b>✓</b>Data stays in your browser</div>
  </div>
</body></html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  writeFileSync('public/og.png', await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } }));
  console.log('Wrote public/og.png (1200×630).');
} finally {
  await browser.close();
}
