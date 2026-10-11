import { log } from 'node:console';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const hash = file => createHash('sha256').update(readFileSync(resolve(root, file))).digest('hex');
function requireFile(file) {
  if (!existsSync(resolve(root, file))) throw new Error(`Missing release file: ${file}`);
}
function verifyHash(file, expected) {
  requireFile(file);
  if (hash(file) !== expected) throw new Error(`Release file changed: ${file}`);
}

verifyHash('src/content/ozymandias.json', 'a0ac72fca670f48b677aa34e81d6ab5d84a700ae41b57ba377247dd37747ee8b');
verifyHash('src/content/second-coming.json', 'f47e2412f978454243b22ef2f440d3c547231e227e59930d8e7d398ab8c52761');
const poem = JSON.parse(readFileSync(resolve(root, 'src/content/ozymandias.json'), 'utf8'));
if (poem.length !== 14) throw new Error('Ozymandias must keep all fourteen source lines.');

let verified = 2;
for (const name of ['refinement-manifest.json', 'manifest.json']) {
  const manifest = JSON.parse(readFileSync(resolve(root, 'public/world', name), 'utf8'));
  for (const file of manifest.files) {
    verifyHash(`public/world/${file.file}`, file.sha256);
    verified++;
  }
}
for (const file of ['public/world/audio/quiet-desert-air.mp3', 'public/world/audio/CREDITS.md',
  'public/world/fonts/EB-Garamond-OFL.txt', 'public/world/fonts/Cinzel-OFL.txt',
  'public/world/anatomy/LICENSE.CC0.txt', 'public/world/ramesses/provenance.json',
  'LICENSE', 'THIRD_PARTY_NOTICES.md', 'docs/submission/DEVPOST.md', 'docs/submission/REQUIREMENTS.md',
  'public/watch.html', 'docs/submission/tour-highlights.mp4', 'docs/submission/images/public-demo.png']) requireFile(file);

for (const file of ['src/world/engine.ts', 'src/world/sculpture.ts', 'src/world/vision.ts',
  'src/world/vision-craft.ts', 'src/world/ambience.ts']) {
  const source = readFileSync(resolve(root, file), 'utf8');
  if (/["'`]\/world\//.test(source)) throw new Error(`Root-relative runtime asset path in ${file}`);
}
log(`Verified ${verified} recorded content and asset hashes, required notices, and portable runtime paths.`);
