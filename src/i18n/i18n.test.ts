import { describe, expect, it } from 'vitest';
import { createInstance } from 'i18next';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import en from './en/common.json';
import zh from './zh/common.json';
import { TOOL_I18N_KEYS, getToolCopy, getTransformCopy } from './tool-copy';
import { getToolList, getAllTransforms } from '@/tools/registry';
import { TEMPLATES } from '@/tools/devtools/docker-compose';
import { COMMON_PERMISSIONS } from '@/tools/devtools/chmod-calculator';
import { COMMON_RATIOS } from '@/tools/math/aspect-ratio';

function flatten(value: object, prefix = ''): Record<string, string> {
  return Object.fromEntries(Object.entries(value).flatMap(([key, item]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof item === 'string' ? [[path, item]] : Object.entries(flatten(item, path));
  }));
}
const resources = { en: flatten(en), zh: flatten(zh) };

describe('UI language coverage', () => {
  it('keeps both language keys and interpolation variables in agreement', () => {
    expect(Object.keys(resources.en).sort()).toEqual(Object.keys(resources.zh).sort());
    for (const [key, value] of Object.entries(resources.en)) {
      expect([...value.matchAll(/{{(\w+)}}/g)].map((m) => m[1]).sort(), key)
        .toEqual([...resources.zh[key]!.matchAll(/{{(\w+)}}/g)].map((m) => m[1]).sort());
    }
  });

  it('resolves every literal UI translation call in both languages', () => {
    const files = readdirSync(resolve('src'), { recursive: true }) as string[];
    const missing: string[] = [];
    for (const file of files.filter((name) => name.endsWith('.tsx'))) {
      const ast = ts.createSourceFile(file, readFileSync(resolve('src', file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visit = (node: ts.Node) => {
        if (ts.isCallExpression(node) && node.expression.getText(ast) === 't' && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
          const key = node.arguments[0].text;
          for (const [lang, entries] of Object.entries(resources)) if (!(key in entries)) missing.push(`${file}: ${lang}/${key}`);
        }
        ts.forEachChild(node, visit);
      };
      visit(ast);
    }
    expect(missing).toEqual([]);
  });

  it('translates descriptions from registered preset constants in both languages', () => {
    const keys = [
      ...TEMPLATES.map((item) => `tools.dockerCompose.templates.${item.id}`),
      ...COMMON_PERMISSIONS.map((item) => `tools.chmodCalculator.permissions.${item.octal}`),
      ...COMMON_RATIOS.map((item) => `tools.aspectRatio.ratios.${item.w}-${item.h}`),
    ];
    for (const key of keys) {
      expect(resources.en[key], key).toBeTruthy();
      expect(resources.zh[key], key).toBeTruthy();
    }
  });

  it.each(['en', 'zh'] as const)('resolves registered tools, transforms and option choices in %s', async (language) => {
    const i18n = createInstance();
    await i18n.init({ resources: { en: { translation: en }, zh: { translation: zh } }, lng: language, fallbackLng: false });
    const tools = getToolList();
    expect(Object.keys(TOOL_I18N_KEYS).sort()).toEqual(tools.map((tool) => tool.id).sort());
    for (const tool of tools) {
      const key = TOOL_I18N_KEYS[tool.id];
      expect(getToolCopy(tool, i18n.t).name).toBe(resources[language][`tools.${key}.title`]);
      expect(getToolCopy(tool, i18n.t).description).toBe(resources[language][`tools.${key}.description`]);
    }
    for (const transform of getAllTransforms()) {
      expect(getTransformCopy(transform, i18n.t).name).toBe(resources[language][`transforms.${transform.id}.name`]);
      expect(getTransformCopy(transform, i18n.t).description).toBe(resources[language][`transforms.${transform.id}.description`]);
      for (const option of transform.options ?? []) {
        expect(resources[language][`transforms.${transform.id}.options.${option.key}.label`]).toBeTruthy();
        for (const index of (option.choices ?? []).keys()) expect(resources[language][`transforms.${transform.id}.options.${option.key}.choices.${index}`]).toBeTruthy();
      }
    }
  });
});
