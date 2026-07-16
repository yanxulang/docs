import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const inputs = [path.join(root, 'content'), path.join(root, 'README.md')];
const timeoutMs = 15_000;
const concurrency = 8;

function walk(entry) {
  const stat = fs.statSync(entry);
  if (stat.isFile()) return [entry];
  return fs
    .readdirSync(entry, { withFileTypes: true })
    .flatMap((item) => walk(path.join(entry, item.name)));
}

function collectLinks(file) {
  const text = fs.readFileSync(file, 'utf8');
  const patterns = [
    /\]\((https?:\/\/[^)\s]+)(?:\s+["'][^"']*["'])?\)/g,
    /\b(?:href|src)=["'](https?:\/\/[^"']+)["']/g,
    /<(https?:\/\/[^>\s]+)>/g,
  ];
  const links = [];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) links.push(match[1]);
  }
  return links;
}

const references = new Map();
for (const file of inputs.flatMap(walk).filter((entry) => /\.(?:md|mdx)$/.test(entry))) {
  for (const value of collectLinks(file)) {
    const url = new URL(value).toString();
    const files = references.get(url) ?? new Set();
    files.add(path.relative(root, file));
    references.set(url, files);
  }
}

function shouldSkip(url) {
  const hostname = new URL(url).hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.test') || hostname === 'example.com';
}

async function request(url, method) {
  return fetch(url, {
    method,
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      'user-agent': 'YanxuDocsLinkCheck/1.0 (+https://docs.yanxu.dev/)',
      ...(method === 'GET' ? { range: 'bytes=0-0' } : {}),
    },
  });
}

async function check(url) {
  if (shouldSkip(url)) return { url, state: 'skipped' };
  const target = new URL(url);
  target.hash = '';
  try {
    let response = await request(target, 'HEAD');
    if ([403, 405, 501].includes(response.status)) response = await request(target, 'GET');
    const state = response.status < 400 || [401, 403].includes(response.status) ? 'ok' : 'failed';
    return { url, state, status: response.status, finalUrl: response.url };
  } catch (error) {
    return { url, state: 'failed', error: error instanceof Error ? error.message : String(error) };
  }
}

const queue = [...references.keys()].sort();
const results = [];
let index = 0;

async function worker() {
  while (index < queue.length) {
    const current = queue[index];
    index += 1;
    results.push(await check(current));
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));
results.sort((a, b) => a.url.localeCompare(b.url));

for (const result of results.filter((item) => item.state === 'failed')) {
  const detail = result.status ? `HTTP ${result.status}` : result.error;
  console.error(`坏链：${result.url}（${detail}）`);
  console.error(`  ${[...references.get(result.url)].join(', ')}`);
}

const passed = results.filter((item) => item.state === 'ok').length;
const skipped = results.filter((item) => item.state === 'skipped').length;
const failed = results.filter((item) => item.state === 'failed').length;
console.log(`外链检查完成：${passed} 个可达，${skipped} 个示例地址跳过，${failed} 个失败。`);

if (failed > 0) process.exitCode = 1;
