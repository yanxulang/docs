import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsRoot = path.join(root, 'content/docs');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

function walk(directory, extension) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute, extension) : entry.name.endsWith(extension) ? [absolute] : [];
  });
}

function routeFor(file) {
  const relative = path.relative(docsRoot, file).replace(/\\/g, '/').replace(/\.mdx$/, '');
  const route = relative === 'index' ? '/' : relative.endsWith('/index') ? `/${relative.slice(0, -6)}` : `/${relative}`;
  return route.endsWith('/') ? route : `${route}/`;
}

function firstCodeBlock(markdown, language) {
  const match = markdown.match(new RegExp('\\n```' + language + '\\n([\\s\\S]*?)\\n```', 'u'));
  assert.ok(match, `缺少 ${language} 代码块`);
  return `${match[1]}\n`;
}

const expectedRootPages = [
  'index', 'getting-started', 'language', 'projects', 'tooling',
  'standard-library', 'guides', 'ecosystem', 'reference', 'design',
];
const rootMeta = JSON.parse(read('content/docs/meta.json'));
assert.deepEqual(rootMeta.pages, expectedRootPages, '一级信息架构与约定不一致');
assert.ok(!rootMeta.pages.some((page) => /^(?:gui|desktop|图形界面)$/i.test(page)), '桌面能力不得成为一级入口');

const files = walk(docsRoot, '.mdx');
const routes = new Set(files.map(routeFor));
const routeAliases = new Set(['/llms.txt', '/llms-full.txt']);
assert.ok(files.length >= 115, `文档页数量异常：${files.length}`);

const forbiddenOldLinks = /(?:href=["']|\]\()\/(?:gui|web|yanju|libraries|project|tooling\/(?:cli-tools|compatibility|embedding|migration-1\.1\.[678])|language\/(?:standard-library|grammar)|getting-started\/learning-path)\//;
const placeholders = /TODO|TBD|待补(?:充|写|全)?|lorem ipsum/iu;

for (const file of files) {
  const markdown = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file);
  const frontmatter = markdown.match(/^---\n([\s\S]*?)\n---\n/u);
  assert.ok(frontmatter, `${relative} 缺少 frontmatter`);
  assert.match(frontmatter[1], /^title:\s*.+$/mu, `${relative} 缺少标题`);
  assert.match(frontmatter[1], /^description:\s*.+$/mu, `${relative} 缺少描述`);
  assert.ok(!placeholders.test(markdown), `${relative} 含占位内容`);
  assert.ok(!forbiddenOldLinks.test(markdown), `${relative} 仍引用旧信息架构路径`);

  const fences = [...markdown.matchAll(/^```/gm)];
  assert.equal(fences.length % 2, 0, `${relative} 的代码围栏未闭合`);

  for (const match of markdown.matchAll(/(?:href=["']|\]\()([^"')\s]+)["')]?/g)) {
    const raw = match[1];
    if (!raw.startsWith('/') || raw.startsWith('//')) continue;
    const pathname = raw.split(/[?#]/, 1)[0];
    if (/\.[a-z0-9]+$/i.test(pathname)) {
      assert.ok(fs.existsSync(path.join(root, 'public', pathname.slice(1))) || routeAliases.has(pathname),
        `${relative} 引用了不存在的公开文件 ${pathname}`);
      continue;
    }
    const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`;
    assert.ok(routes.has(normalized), `${relative} 引用了不存在的文档路由 ${pathname}`);
  }
}

const home = read('content/docs/index.mdx');
assert.ok(!/\bGUI\b|言窗|言界|\/ecosystem\/desktop\//i.test(home), '文档首页不得突出桌面界面');
for (const route of ['/getting-started/', '/language/', '/projects/', '/tooling/', '/standard-library/', '/reference/']) {
  assert.ok(home.includes(route), `文档首页缺少 ${route}`);
}

const examplePairs = [
  ['content/docs/getting-started/first-program.mdx', 'examples/language/初见.yx'],
  ['content/docs/getting-started/first-project.mdx', 'examples/language/问候项目.yx'],
];
for (const [page, example] of examplePairs) {
  assert.equal(firstCodeBlock(read(page), 'yanxu'), read(example), `${page} 与 ${example} 不一致`);
}

assert.match(read('source.config.ts'), /aliases:\s*\['yx', '言序'\]/);
assert.ok(!read('components/search.tsx').includes("language: 'english'"), '搜索仍使用英文分词');
assert.ok(!read('app/api/search/route.ts').includes("language: 'english'"), '搜索索引仍使用英文分词');
const layout = read('lib/layout.shared.tsx');
assert.ok(!/图形|GUI|桌面|言窗|言界/i.test(layout), '顶栏不得包含桌面界面入口');

const packageJson = JSON.parse(read('package.json'));
assert.equal(packageJson.version, '1.1.8');
assert.match(read('content/docs/standard-library/index.mdx'), /25 个标准模块/);
assert.match(read('app/layout.tsx'), /metadataBase:\s*new URL\('https:\/\/docs\.yanxu\.dev\/'\)/);

console.log(`内容检查通过：${files.length} 个文档页面。`);
