import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const sourceDirty = Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim());
writeFileSync('dist/version.json', JSON.stringify({ version: pkg.version, sourceCommit, sourceDirty }, null, 2) + '\n');
copyFileSync('LICENSE', 'dist/LICENSE.txt');
