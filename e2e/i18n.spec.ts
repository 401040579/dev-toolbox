import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TOOL_I18N_KEYS } from '../src/i18n/tool-copy';

const en = JSON.parse(readFileSync(resolve('src/i18n/en/common.json'), 'utf8')) as typeof import('../src/i18n/en/common.json');
const zh = JSON.parse(readFileSync(resolve('src/i18n/zh/common.json'), 'utf8')) as typeof import('../src/i18n/zh/common.json');

const definitions = (readdirSync(resolve('src/tools'), { recursive: true }) as string[])
  .filter((file) => file.endsWith('/index.ts'))
  .map((file) => readFileSync(resolve('src/tools', file), 'utf8'))
  .map((source) => /const tool: ToolDefinition = \{\s*id: '([^']+)'[\s\S]*?category: '([^']+)'/.exec(source))
  .filter((match): match is RegExpExecArray => match !== null)
  .map((match) => ({ id: match[1]!, category: match[2]! }));

for (const language of ['en', 'zh'] as const) {
  test(`${language}: every category translates its heading, description and all tool cards`, async ({ page }) => {
    const resources = language === 'en' ? en : zh;
    await page.addInitScript((lang) => localStorage.setItem('dev-toolbox-lang', lang), language);
    for (const category of Object.keys(resources.categories) as Array<keyof typeof resources.categories>) {
      await page.goto(`/tools/${category}`);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(resources.categories[category]);
      await expect(page.locator('main')).toContainText(resources.categoryDesc[category]);
      for (const tool of definitions.filter((entry) => entry.category === category)) {
        const copy = resources.tools[TOOL_I18N_KEYS[tool.id] as keyof typeof resources.tools];
        const card = page.locator(`main a[href="/tools/${category}/${tool.id}"]`);
        await expect(card).toContainText(copy.title);
        await expect(card).toContainText(copy.description);
      }
    }
  });

  test(`${language}: every existing tool renders translated controls and metadata`, async ({ page }) => {
    test.setTimeout(120_000);
    const resources = language === 'en' ? en : zh;
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript((lang) => localStorage.setItem('dev-toolbox-lang', lang), language);
    expect(definitions.length).toBe(Object.keys(TOOL_I18N_KEYS).length);
    for (const tool of definitions) {
      await page.goto(`/tools/${tool.category}/${tool.id}`);
      const copy = resources.tools[TOOL_I18N_KEYS[tool.id] as keyof typeof resources.tools];
      await expect(page.getByRole('heading', { level: 1, name: copy.title, exact: true })).toBeVisible();
      const text = await page.locator('main').innerText();
      expect(text, tool.id).not.toMatch(/\b(?:tools|common|categories|categoryDesc|pipeline|pipelineTemplates|home|nav|toolLayout|transforms)\.[A-Za-z][\w.-]+/);
      expect(text, tool.id).not.toMatch(/\{\{\w+\}\}/);
    }
    expect(errors).toEqual([]);
  });
}

test('language switch updates navigation, search, Pipeline details and existing errors', async ({ page }) => {
  await page.goto('/tools/text/slugify');
  await expect(page.getByRole('combobox')).toContainText('Underscore');
  await expect(page.getByRole('button', { name: en.common.switchToLightMode, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Switch language' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('combobox')).toContainText('下划线');
  await page.getByRole('button', { name: zh.common.switchToLightMode, exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: zh.common.switchToDarkMode, exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.goto('/tools/text');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(zh.categories.text);
  await expect(page.getByRole('link', { name: /文本统计/ })).toBeVisible();
  await page.getByRole('button', { name: zh.common.search, exact: true }).click();
  await page.getByRole('combobox').fill('短信');
  await expect(page.locator('[cmdk-item]').filter({ hasText: zh.tools.smsSegment.title })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[cmdk-root]')).toHaveCount(0);
  await page.goto('/pipeline');
  await page.getByRole('button', { name: zh.pipeline.templates, exact: true }).click();
  await page.getByRole('button', { name: new RegExp(zh.pipelineTemplates['base64-decode-prettify'].name) }).click();
  await page.getByRole('button', { name: zh.common.expand }).nth(1).click();
  await expect(page.getByLabel('缩进大小')).toContainText('制表符');
  await expect(page.locator('main')).toContainText('JSON 格式化');
  await page.getByRole('button', { name: zh.common.switchLanguage }).click();
  await expect(page.getByLabel('Indent Size')).toContainText('Tab');
  await expect(page.locator('main')).toContainText('JSON Prettify');
  await page.goto('/tools/encoding/jwt-decode');
  await page.locator('textarea').fill('broken');
  await expect(page.locator('main')).toContainText(en.tools.jwt.invalidJwt);
  await page.getByRole('button', { name: en.common.switchLanguage }).click();
  await expect(page.locator('main')).toContainText(zh.tools.jwt.invalidJwt);
  await expect(page.locator('textarea')).toHaveValue('broken');
  await page.goto('/tools/image/svg-optimizer');
  await page.locator('textarea').first().fill('<broken>');
  await page.getByRole('button', { name: zh.tools.svgOptimizer.optimize, exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText(zh.tools.svgOptimizer.invalidSvg);
  await page.getByRole('button', { name: zh.common.switchLanguage }).click();
  await expect(page.getByRole('alert')).toHaveText(en.tools.svgOptimizer.invalidSvg);
});

test('clipboard denial and invalid share links provide actionable feedback', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) } }));
  await page.goto('/tools/encoding/base64');
  await page.locator('textarea').first().fill('copy me');
  await page.getByRole('button', { name: en.common.copyToClipboard }).click();
  await expect(page.getByRole('alert')).toHaveText(en.common.copyError);
  await expect(page.getByRole('button', { name: en.common.copyToClipboard })).toHaveAttribute('title', en.common.copyFailed);
  await page.goto('/pipeline#config=invalid');
  await expect(page.getByRole('alert')).toHaveText(en.pipeline.invalidShare);
});

test('preset descriptions change language and fit a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const presets = [
    { route: '/tools/devtools/docker-compose', en: en.tools.dockerCompose.templates, zh: zh.tools.dockerCompose.templates },
    { route: '/tools/devtools/chmod-calculator', en: en.tools.chmodCalculator.permissions, zh: zh.tools.chmodCalculator.permissions },
    { route: '/tools/math/aspect-ratio', en: en.tools.aspectRatio.ratios, zh: zh.tools.aspectRatio.ratios },
  ];
  for (const preset of presets) {
    await page.goto(preset.route);
    for (const value of Object.values(preset.en)) await expect(page.locator('main')).toContainText(value);
    await page.getByRole('button', { name: en.common.switchLanguage }).click();
    for (const value of Object.values(preset.zh)) await expect(page.locator('main')).toContainText(value);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await page.getByRole('button', { name: zh.common.switchLanguage }).click();
  }
});

test('malformed JWT payloads and extreme expiration values do not crash the tool', async ({ page }) => {
  await page.goto('/tools/encoding/jwt-decode');
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  for (const payload of [null, [], false]) {
    await page.locator('textarea').fill(`${encode({ alg: 'none' })}.${encode(payload)}.`);
    await expect(page.locator('main')).toContainText(en.tools.jwt.invalidPayload);
  }
  await page.locator('textarea').fill(`${encode({ alg: 'none' })}.${encode({ exp: 1e300 })}.`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.tools.jwt.title);
  await expect(page.locator('main')).not.toContainText('Something went wrong');
  await page.locator('textarea').fill(`${encode({ alg: 'none' })}.${encode({ exp: 4e9 })}.`);
  await expect(page.locator('main')).toContainText('Not expired');
  await expect(page.locator('main')).toContainText(en.tools.jwt.verificationNote);
});

test('IP results translate in every mode and reject truncated addresses', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tools/network/ip-converter');
  await page.getByPlaceholder('192.168.1.1').fill('224.0.0.1');
  await expect(page.locator('main')).toContainText(en.tools.ipConverter.classes['D (Multicast)']);
  await page.getByRole('button', { name: en.common.switchLanguage }).click();
  await expect(page.locator('main')).toContainText(zh.tools.ipConverter.classes['D (Multicast)']);
  await expect(page.locator('main')).toContainText(zh.tools.ipConverter.types.Multicast);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByPlaceholder('192.168.1.1').fill('192x.168.1.1');
  await expect(page.locator('main')).toContainText(zh.tools.ipConverter.invalidIp);
  await page.getByRole('button', { name: 'IPv6', exact: true }).click();
  await page.getByPlaceholder('2001:db8::1').fill('2001:db8::1');
  await expect(page.locator('main')).toContainText(zh.tools.ipConverter.types['Global Unicast']);
  await page.getByRole('button', { name: zh.tools.ipConverter.decimalToIp, exact: true }).click();
  await page.getByPlaceholder('3232235777').fill('3232235777');
  await expect(page.locator('main')).toContainText(zh.tools.ipConverter.types.Private);
  await page.getByPlaceholder('3232235777').fill('3232235777oops');
  await expect(page.locator('main')).toContainText(zh.tools.ipConverter.invalidIp);
  await page.getByRole('button', { name: zh.common.switchLanguage }).click();
  await expect(page.locator('main')).toContainText(en.tools.ipConverter.invalidIp);
});

test('large unit conversions and Cron invalid input keep correct results', async ({ page }) => {
  await page.goto('/tools/math/unit-converter');
  await page.getByRole('combobox').nth(1).selectOption('m');
  for (const value of ['1000000000', '-1000000000', '1e20', '0']) {
    await page.getByRole('spinbutton').fill(value);
    const result = await page.locator('p.text-3xl').innerText();
    expect(Number(result)).toBe(Number(value));
  }
  await page.goto('/tools/time/cron-parser');
  await page.locator('main').getByRole('textbox').fill('*/0 * * * *');
  await expect(page.locator('main')).toContainText(en.tools.cron.invalidExpression);
  await page.locator('main').getByRole('textbox').fill('0 0 * * 7');
  await expect(page.locator('main')).toContainText('Sun');
});


test('separator choices work and storage failure never claims a successful save', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'dev-toolbox-pipelines') throw new DOMException('full', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.goto('/tools/text/slugify');
  await page.locator('main input[type=text]').fill('Hello World');
  await page.getByRole('combobox').selectOption('.');
  await expect(page.locator('main')).toContainText('hello.world');
  await page.getByRole('combobox').selectOption('');
  await expect(page.locator('main')).toContainText('helloworld');
  await page.goto('/pipeline');
  await page.getByRole('button', { name: 'Templates', exact: true }).click();
  await page.getByRole('button', { name: /Text → SHA-256/ }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByPlaceholder('Pipeline name...').fill('demo');
  await page.getByRole('button', { name: 'Save', exact: true }).last().click();
  await expect(page.getByRole('alert')).toHaveText(en.pipeline.saveFailed);
  await expect(page.getByPlaceholder('Pipeline name...')).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Saved', exact: true }).click();
  await expect(page.locator('main')).toContainText('No saved pipelines yet');
});

test('Pipeline saving works on an ordinary HTTP origin without randomUUID', async ({ page, baseURL }) => {
  await page.route('http://toolbox-http.test/**', async (route) => {
    const url = new URL(route.request().url());
    const response = await route.fetch({ url: new URL(url.pathname + url.search, baseURL!).href });
    await route.fulfill({ response });
  });
  await page.goto('http://toolbox-http.test/pipeline');
  expect(await page.evaluate(() => ({ secure: isSecureContext, uuid: typeof crypto.randomUUID }))).toEqual({ secure: false, uuid: 'undefined' });
  await page.getByRole('button', { name: 'Templates', exact: true }).click();
  await page.getByRole('button', { name: /Base64 → JSON Pretty/ }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByPlaceholder('Pipeline name...').fill('local demo');
  await page.getByRole('button', { name: 'Save', exact: true }).last().click();
  await expect(page.getByPlaceholder('Pipeline name...')).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: /^Saved/ }).click();
  await expect(page.getByRole('button', { name: /^local demo/ })).toBeVisible();
});
