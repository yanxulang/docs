import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'out');
const origin = 'https://docs.yanxu.dev';

function redirectDocument(target) {
  const escaped = target.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,follow">
  <meta http-equiv="refresh" content="0;url=${escaped}">
  <link rel="canonical" href="${escaped}">
  <title>页面已迁移 · 言序文档</title>
</head>
<body>
  <p>页面已迁移到 <a href="${escaped}">${escaped}</a>。</p>
  <script>location.replace(${JSON.stringify(target)} + location.search + location.hash)</script>
</body>
</html>
`;
}

function writeRedirect(from, to) {
  const directory = path.join(output, from);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'index.html'), redirectDocument(`${origin}/${to}/`));
}

function walkIndexDirectories(directory) {
  if (!fs.existsSync(directory)) return [];
  const found = fs.existsSync(path.join(directory, 'index.html')) ? [directory] : [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) found.push(...walkIndexDirectories(path.join(directory, entry.name)));
  }
  return found;
}

for (const [currentPrefix, legacyPrefix] of [
  ['ecosystem/desktop', 'gui'],
  ['ecosystem/web', 'web'],
  ['ecosystem/yanju', 'yanju'],
  ['ecosystem/libraries', 'libraries'],
]) {
  const currentRoot = path.join(output, currentPrefix);
  for (const directory of walkIndexDirectories(currentRoot)) {
    const suffix = path.relative(currentRoot, directory).replace(/\\/g, '/');
    writeRedirect(path.posix.join(legacyPrefix, suffix), path.posix.join(currentPrefix, suffix));
  }
}

for (const [from, to] of Object.entries({
  project: 'design',
  'project/architecture': 'design/architecture',
  'project/compatibility': 'reference/compatibility',
  'project/reference-projects': 'guides/reference-projects',
  'project/roadmap': 'design/roadmap',
  'tooling/cli-tools': 'reference/cli',
  'tooling/compatibility': 'reference/formats',
  'tooling/embedding': 'guides/embedding',
  'tooling/gui-applications': 'ecosystem/desktop',
  'tooling/migration-1.1.6': 'reference/migrations/1.1.6',
  'tooling/migration-1.1.7': 'reference/migrations/1.1.7',
  'tooling/migration-1.1.8': 'reference/migrations/1.1.8',
  'language/standard-library': 'standard-library',
  'language/grammar': 'reference/grammar',
  'getting-started/learning-path': 'getting-started/next-steps',
})) writeRedirect(from, to);

console.log('旧版文档路径兼容跳转已生成。');
