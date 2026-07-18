import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { gzipSync } from 'node:zlib';

const output = path.resolve(process.argv[2] ?? 'out');
const failures = [];

function walk(directory, extension) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute, extension) : entry.name.endsWith(extension) ? [absolute] : [];
  });
}

function htmlTarget(pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { decoded = pathname; }
  const relative = decoded.replace(/^\/+/, '');
  const absolute = path.join(output, relative);
  if (fs.existsSync(absolute) && fs.statSync(absolute).isFile()) return absolute;
  const index = path.join(absolute, 'index.html');
  if (fs.existsSync(index)) return index;
  return null;
}

const htmlFiles = walk(output, '.html');
const idCache = new Map();
for (const file of htmlFiles) {
  const relative = path.relative(output, file).replace(/\\/g, '/');
  const html = fs.readFileSync(file, 'utf8');
  const redirect = /<meta name="robots" content="noindex,follow"/.test(html);
  if (!/<html[^>]+lang="zh-CN"/.test(html)) failures.push(`${relative}: 缺少 zh-CN`);
  if (!/<title>[^<]+<\/title>/.test(html)) failures.push(`${relative}: 缺少标题`);
  if (!/<link rel="canonical" href="https:\/\/docs\.yanxu\.dev\//.test(html)) failures.push(`${relative}: 缺少 canonical`);
  if (!redirect && relative !== '404.html' && !/<meta name="description" content="[^"<>]{12,240}"/.test(html)) {
    failures.push(`${relative}: 缺少描述元数据`);
  }

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  if (new Set(ids).size !== ids.length) failures.push(`${relative}: 含重复 id`);
  idCache.set(file, new Set(ids));

  for (const match of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const raw = match[1].replaceAll('&amp;', '&');
    if (/^(?:https?:|mailto:|tel:|data:|javascript:|#)/.test(raw)) continue;
    let url;
    try {
      const route = relative === 'index.html' ? '/' : `/${relative.replace(/index\.html$/, '')}`;
      url = new URL(raw, `https://docs.yanxu.dev${route}`);
    } catch {
      failures.push(`${relative}: 无法解析链接 ${raw}`);
      continue;
    }
    const target = htmlTarget(url.pathname);
    if (!target) {
      failures.push(`${relative}: 失效本地链接 ${raw}`);
      continue;
    }
    if (url.hash && target.endsWith('.html')) {
      const fragment = decodeURIComponent(url.hash.slice(1));
      const targetIds = idCache.get(target) ?? new Set([...fs.readFileSync(target, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((item) => item[1]));
      idCache.set(target, targetIds);
      if (!targetIds.has(fragment)) failures.push(`${relative}: 失效锚点 ${raw}`);
    }
  }
}

for (const required of [
  'index.html', '404.html', 'robots.txt', 'sitemap.xml', 'api/search',
  'getting-started/index.html', 'language/index.html', 'projects/index.html',
  'standard-library/index.html', 'reference/index.html', 'gui/index.html', 'web/index.html',
]) {
  if (!fs.existsSync(path.join(output, required))) failures.push(`缺少生产文件：${required}`);
}

const searchIndex = fs.readFileSync(path.join(output, 'api/search'));
const searchIndexBytes = searchIndex.byteLength;
const compressedSearchIndexBytes = gzipSync(searchIndex, { level: 9 }).byteLength;
if (searchIndexBytes > 8_000_000) failures.push(`中文搜索索引超过 8 MB：${searchIndexBytes} B`);
if (compressedSearchIndexBytes > 2_000_000) {
  failures.push(`中文搜索索引 gzip 后超过 2 MB：${compressedSearchIndexBytes} B`);
}

for (const file of walk(path.join(output, '_next/static'), '.js')) {
  const bytes = fs.statSync(file).size;
  if (bytes > 420_000) failures.push(`${path.relative(output, file)} 超过 420 kB`);
}
for (const file of walk(path.join(output, '_next/static'), '.css')) {
  const bytes = fs.statSync(file).size;
  if (bytes > 140_000) failures.push(`${path.relative(output, file)} 超过 140 kB`);
}

if (failures.length) {
  console.error(`站点检查失败（${failures.length} 项）：\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`站点检查通过：${htmlFiles.length} 个 HTML 页面。`);
