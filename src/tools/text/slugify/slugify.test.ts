import { expect, it } from 'vitest';
import { slugify } from './index';

it.each([['-', 'hello-world'], ['_', 'hello_world'], ['.', 'hello.world'], ['', 'helloworld']])('uses literal separator %j without crashing or deleting text', (separator, expected) => {
  expect(slugify('  Hello   World!  ', { separator })).toBe(expected);
});
it('keeps custom regular-expression punctuation literal', () => {
  expect(slugify('Hello World', { separator: '+' })).toBe('hello+world');
  expect(slugify('Hello World', { separator: '$' })).toBe('hello$world');
});
