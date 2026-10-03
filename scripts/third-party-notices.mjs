import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const runtimeExtras = new Set(['clsx', 'tailwind-merge', 'workbox-window']);
const sections = [];
for (const [path, info] of Object.entries(lock.packages)) {
  if (!path || (info.dev && !runtimeExtras.has(path.split('node_modules/').at(-1)) && !path.split('node_modules/').at(-1).startsWith('workbox-'))) continue;
  const pkg = JSON.parse(readFileSync(join(path, 'package.json'), 'utf8'));
  const licenseFiles = readdirSync(path).filter((name) => /^(licen[cs]e|copying|notice)(\.|$|-)/i.test(name)).sort();
  const fallback = pkg.name.startsWith('@radix-ui/') ? 'Radix-MIT.txt'
    : pkg.name === 'html-parse-stringify' ? 'html-parse-stringify-MIT.txt'
    : pkg.name === 'react-remove-scroll-bar' ? 'react-remove-scroll-bar-MIT.txt' : null;
  if (!licenseFiles.length && !fallback) throw new Error(`Missing license file: ${pkg.name}`);
  const licenses = !licenseFiles.length ? readFileSync(join('docs/licenses', fallback), 'utf8') : licenseFiles.map((file) => `${file}\n${readFileSync(join(path, file), 'utf8')}`).join('\n\n');
  sections.push(`${pkg.name}@${pkg.version}\nLicense: ${pkg.license ?? info.license ?? 'see license below'}\nSource: ${typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url ?? pkg.homepage ?? 'npm registry'}\n\n${licenses}`);
}
sections.sort();
const wasmNotices = [
  ['stb image reader (inside zxing-wasm; used under MIT)', 'https://github.com/nothings/stb', 'STB-license.txt'],
  ['wasm-bindgen and js-sys support (inside RaptorQ WASM; used under MIT)', 'https://github.com/wasm-bindgen/wasm-bindgen', 'wasm-bindgen-MIT.txt'],
  ['RaptorQ 2.0.1 (inside @raptorqr/raptorq-wasm)', 'https://github.com/cberner/raptorq/tree/v2.0.1', 'RaptorQ-Apache-2.0.txt'],
  ['ZXing-C++ (inside zxing-wasm, commit 0b2d9a8fc81f420f369928c24331091ff0525976)', 'https://github.com/zxing-cpp/zxing-cpp/tree/0b2d9a8fc81f420f369928c24331091ff0525976', 'ZXing-CPP-Apache-2.0.txt'],
].map(([name, source, file]) => `${name}\nSource: ${source}\n\n${readFileSync(join('docs/licenses', file), 'utf8')}`).join('\n\n');
const twilio = readFileSync('docs/licenses/Twilio-MIT.txt', 'utf8');
const text = `Dev Toolbox third-party notices\n\nGenerated from package-lock.json. Includes installed production dependencies, browser runtime helpers and generated Workbox runtime. Development-only tools retain their licenses in their npm packages. DOMPurify is used under Apache-2.0 (its alternate MPL license is also preserved below).\n\nTwilio message-segment-calculator\nSource: https://github.com/TwilioDevEd/message-segment-calculator/tree/f640391f395920f3d1c654434a90982f1b3af105\nAdapted UnicodeToGSM.ts, SmartEncodingMap.ts and segmentation logic. Local UI, tests and extensions are separate project work.\n\n${twilio}\n\n${wasmNotices}\n\n${sections.join('\n\n' + '='.repeat(72) + '\n\n')}\n`;
// Normalize license line endings/whitespace for deterministic Git and CI output.
writeFileSync('public/THIRD_PARTY_NOTICES.txt', text.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '').trimEnd() + '\n');
console.log(`Preserved licenses for ${sections.length} installed packages and Twilio, RaptorQ and ZXing-C++.`);
