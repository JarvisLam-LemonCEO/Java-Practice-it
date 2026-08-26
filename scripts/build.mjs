import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

await import('./generate-data.mjs');

const root = path.resolve(process.cwd());
const dist = path.join(root, 'dist');

await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, 'data'), { recursive: true });

for (const file of ['index.html', 'app.js', 'styles.css', 'favicon.svg']) {
  await cp(path.join(root, file), path.join(dist, file));
}
await cp(path.join(root, 'data', 'questions.js'), path.join(dist, 'data', 'questions.js'));

console.log('Built static site in dist/.');
