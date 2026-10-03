import { expect, test } from '@playwright/test';

test('input and options survive tool switches and immediate reload, and clearing does not resurrect them', async ({ page }) => {
  await page.goto('/tools/encoding/base64');
  await page.getByRole('button', { name: 'Decode', exact: true }).click();
  await page.locator('textarea').fill('aGVsbG8=');
  await page.getByRole('link', { name: 'JSON / Data', exact: true }).click();
  await page.goto('/tools/encoding/base64');
  await expect(page.locator('textarea')).toHaveValue('aGVsbG8=');
  await expect(page.locator('main pre')).toHaveText('hello');
  await page.locator('textarea').fill('d29ybGQ=');
  await page.reload();
  await expect(page.locator('textarea')).toHaveValue('d29ybGQ=');
  await expect(page.locator('main pre')).toHaveText('world');
  await page.getByRole('button', { name: 'Clear current', exact: true }).click();
  await expect(page.locator('textarea')).toHaveValue('');
  await page.reload();
  await expect(page.locator('textarea')).toHaveValue('');
  await page.locator('textarea').fill('fresh input');
  await expect(page.locator('main pre')).toHaveText('ZnJlc2ggaW5wdXQ=');
});

test('two-input and structured option drafts restore and a global clear resets the active tool', async ({ page }) => {
  await page.goto('/tools/text/diff-viewer');
  await page.locator('textarea').nth(0).fill('before');
  await page.locator('textarea').nth(1).fill('after');
  await page.goto('/tools/text/slugify');
  await page.locator('main input[type=text]').fill('Hello World');
  await page.getByRole('combobox').selectOption('.');
  await page.reload();
  await expect(page.locator('main')).toContainText('hello.world');
  await page.goto('/tools/text/diff-viewer');
  await expect(page.locator('textarea').nth(0)).toHaveValue('before');
  await expect(page.locator('textarea').nth(1)).toHaveValue('after');
  await page.getByRole('button', { name: 'Clear all drafts', exact: true }).click();
  await expect(page.locator('textarea').nth(0)).toHaveValue('');
  await expect(page.locator('textarea').nth(1)).toHaveValue('');
  await page.goto('/tools/text/slugify');
  await expect(page.locator('main input[type=text]')).toHaveValue('');
  await expect(page.getByRole('combobox')).toHaveValue('-');
});

test('restoration can be disabled without losing current edits or saving later changes', async ({ page }) => {
  await page.goto('/tools/json/json-formatter');
  await page.locator('textarea').fill('{"first":true}');
  await page.getByRole('checkbox', { name: 'Restore drafts', exact: true }).uncheck();
  await expect(page.locator('textarea')).toHaveValue('{"first":true}');
  await page.locator('textarea').fill('{"later":true}');
  await page.reload();
  await expect(page.locator('textarea')).toHaveValue('');
  await expect(page.getByRole('checkbox', { name: 'Restore drafts', exact: true })).not.toBeChecked();
});

test('storage failure is visible and corrupted option drafts fall back safely', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('dev-toolbox-draft-v1:unit-converter', JSON.stringify({ version: 1, fields: { category: 'bogus', fromUnit: null, value: '2' } }));
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('dev-toolbox-draft-v1:')) throw new Error('quota');
      return original.call(this, key, value);
    };
  });
  await page.goto('/tools/math/unit-converter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Unit Converter');
  await expect(page.getByRole('combobox').first()).toHaveValue('m');
  await page.getByRole('spinbutton').fill('3');
  await expect(page.getByRole('status')).toContainText('Could not save locally');
});

test('finite but invalid numeric option drafts recover safely', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('dev-toolbox-draft-v1:docker-compose', JSON.stringify({ version: 1, fields: { selected: 999 } }));
    localStorage.setItem('dev-toolbox-draft-v1:bcrypt', JSON.stringify({ version: 1, fields: { iterations: 1e12 } }));
    localStorage.setItem('dev-toolbox-draft-v1:password-generator', JSON.stringify({ version: 1, fields: { length: 1e12 } }));
  });
  await page.goto('/tools/devtools/docker-compose');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Docker Compose Templates');
  await expect(page.locator('main')).not.toContainText('Something went wrong');
  await page.goto('/tools/crypto/bcrypt');
  await expect(page.getByRole('combobox')).toHaveValue('100000');
  await page.goto('/tools/generators/password-generator');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Password Generator');
});

test('an old file read cannot revive a cleared draft', async ({ page }) => {
  await page.addInitScript(() => {
    const read = FileReader.prototype.readAsDataURL;
    FileReader.prototype.readAsDataURL = function (blob) {
      setTimeout(() => read.call(this, blob), 300);
    };
  });
  await page.goto('/tools/network/data-url');
  await page.getByRole('button', { name: 'Parse', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles({ name: 'late.txt', mimeType: 'text/plain', buffer: Buffer.from('obsolete file input') });
  await page.getByRole('button', { name: 'Clear current', exact: true }).click();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'Parse', exact: true }).click();
  await expect(page.locator('textarea').first()).toHaveValue('');
  await page.reload();
  await expect(page.locator('textarea').first()).toHaveValue('');
});

test('restored color input and derived color agree, and draft controls fit mobile Chinese', async ({ page }) => {
  await page.goto('/tools/image/color-picker');
  await page.locator('main input[type=text]').fill('#FF0000');
  await page.reload();
  await expect(page.locator('main input[type=text]')).toHaveValue('#FF0000');
  await expect(page.locator('main')).toContainText('rgb(255, 0, 0)');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Switch language' }).click();
  await expect(page.getByRole('checkbox', { name: '恢复草稿' })).toBeVisible();
  await expect(page.getByRole('button', { name: '清空当前', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test('credential inputs and generated Basic Auth headers are not stored in drafts', async ({ page }) => {
  await page.goto('/tools/devtools/basic-auth');
  await page.locator('input[type=text]').first().fill('demo-user');
  await page.locator('main input[type=text]').nth(1).fill('demo-secret');
  await page.getByRole('button', { name: 'Generate Header', exact: true }).click();
  await expect(page.locator('main input[readonly]')).toHaveValue(/^Basic /);
  await expect(page.getByRole('status')).toContainText('Draft saved');
  const raw = await page.evaluate(() => localStorage.getItem('dev-toolbox-draft-v1:basic-auth'));
  expect(raw).not.toContain('demo-secret');
  expect(raw).not.toContain(Buffer.from('demo-user:demo-secret').toString('base64'));
  await page.reload();
  await expect(page.locator('main input[type=text]').nth(1)).toHaveValue('');
});

test('clearing sample-backed input remains empty after a refresh', async ({ page }) => {
  await page.goto('/tools/json/sql-formatter');
  await expect(page.locator('textarea').first()).not.toHaveValue('');
  await page.getByRole('button', { name: 'Clear current', exact: true }).click();
  await expect(page.locator('textarea').first()).toHaveValue('');
  await page.reload();
  await expect(page.locator('textarea').first()).toHaveValue('');
});
