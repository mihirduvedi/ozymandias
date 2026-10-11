import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { log } from 'node:console';

const root = resolve(import.meta.dirname, '..');
const media = resolve(root, 'dist/media');
await mkdir(media, { recursive: true });
await Promise.all([
  copyFile(resolve(root, 'docs/submission/tour-highlights.mp4'), resolve(media, 'tour-highlights.mp4')),
  copyFile(resolve(root, 'docs/submission/images/public-demo.png'), resolve(media, 'tour-poster.png')),
  copyFile(resolve(root, 'node_modules/@fontsource/eb-garamond/files/eb-garamond-latin-400-normal.woff2'),
    resolve(media, 'eb-garamond.woff2')),
]);
log('Bundled the playable tour video, poster, and local font.');
