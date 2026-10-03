import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const meta = JSON.parse(readFileSync('dist/version.json', 'utf8'));
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()) throw new Error('Package from a clean checkout.');
if (meta.sourceCommit !== head || meta.version !== pkg.version || meta.sourceDirty) throw new Error('Rebuild the clean release commit before packaging.');
mkdirSync('release-assets', { recursive: true });
const name = `dev-toolbox-v${pkg.version}-site.zip`;
// Fixed timestamps and file ordering make the ZIP reproducible for the same dist.
execFileSync('python3', ['-c', `
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import sys
with ZipFile(sys.argv[1], 'w', ZIP_DEFLATED, compresslevel=9) as z:
    entries = [(str(p.relative_to('dist')), p) for p in Path('dist').rglob('*') if p.is_file()]
    entries += [('serve.py', Path('scripts/serve.py'))]
    entries += [(name, Path(name)) for name in ['README.md', 'README.zh-CN.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'CONTRIBUTING.md', 'SECURITY.md', 'CHANGELOG.md', 'public/THIRD_PARTY_NOTICES.txt']]
    entries += [(str(p), p) for p in Path('docs').rglob('*') if p.is_file()]
    for name, p in sorted(entries):
        info = ZipInfo(name, (1980, 1, 1, 0, 0, 0))
        info.compress_type = ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        z.writestr(info, p.read_bytes(), compress_type=ZIP_DEFLATED, compresslevel=9)
`, `release-assets/${name}`], { stdio: 'inherit' });
const hash = createHash('sha256').update(readFileSync(`release-assets/${name}`)).digest('hex');
writeFileSync('release-assets/SHA256SUMS', `${hash}  ${name}\n`);
console.log(`Packaged ${name} from ${head}\nSHA-256 ${hash}`);
