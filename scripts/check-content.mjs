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
assert.equal(packageJson.version, '1.1.20');
assert.match(read('content/docs/standard-library/index.mdx'), /25 个标准模块/);
assert.match(read('app/layout.tsx'), /metadataBase:\s*new URL\('https:\/\/docs\.yanxu\.dev\/'\)/);

assert.match(read('.github/workflows/ci.yml'), /ref: v1\.1\.20/g, '示例 CI 未固定言序 1.1.20');
assert.match(read('content/docs/language/binary-data.mdx'), /单值硬上限为 16 MiB/);
assert.match(read('content/docs/reference/project-format.mdx'), /\| 字节码块 \| 2 \| 2 \|/);
assert.match(read('content/docs/reference/permissions.mdx'), /15 项宿主能力/);
assert.match(read('content/docs/reference/permissions.mdx'), /`本地网络`/);
const migrationMeta = JSON.parse(read('content/docs/reference/migrations/meta.json'));
for (let patch = 6; patch <= 20; patch += 1) {
  assert.ok(migrationMeta.pages.includes(`1.1.${patch}`), `迁移导航缺少 1.1.${patch}`);
}
assert.match(read('content/docs/reference/migrations/1.1.20.mdx'), /1\.1\.17 用户应直接升级到 1\.1\.20/);

const stableLibraries = [
  ['yanju', '1.2.0', '1.1.6', 'content/docs/ecosystem/yanju/index.mdx', '/ecosystem/yanju/'],
  ['yanxu-semver', '1.0.0', '1.1.6', 'content/docs/ecosystem/libraries/semver.mdx', '/ecosystem/libraries/semver/'],
  ['yanxu-collections', '1.0.0', '1.1.6', 'content/docs/ecosystem/libraries/collections.mdx', '/ecosystem/libraries/collections/'],
  ['yanxu-datetime', '1.0.0', '1.1.6', 'content/docs/ecosystem/libraries/datetime.mdx', '/ecosystem/libraries/datetime/'],
  ['yanxu-validate', '1.0.0', '1.1.6', 'content/docs/ecosystem/libraries/validate.mdx', '/ecosystem/libraries/validate/'],
  ['yanxu-log', '1.0.0', '1.1.6', 'content/docs/ecosystem/libraries/log.mdx', '/ecosystem/libraries/log/'],
  ['yanxu-retry', '1.0.0', '1.1.6', 'content/docs/ecosystem/libraries/retry.mdx', '/ecosystem/libraries/retry/'],
  ['yanxu-cli', '1.0.0', '1.1.6', 'content/docs/ecosystem/libraries/cli.mdx', '/ecosystem/libraries/cli/'],
  ['yanxu-http', '1.0.0', '1.1.6', 'content/docs/ecosystem/web/http.mdx', '/ecosystem/web/http/'],
  ['yanxu-request', '1.0.0', '1.1.11', 'content/docs/ecosystem/web/request.mdx', '/ecosystem/web/request/'],
  ['yanxu-jwt', '1.0.0', '1.1.6', 'content/docs/ecosystem/libraries/jwt.mdx', '/ecosystem/libraries/jwt/'],
  ['yanxu-db', '1.0.0', '1.1.11', 'content/docs/ecosystem/libraries/db.mdx', '/ecosystem/libraries/db/'],
  ['yanxu-sqlite', '1.0.0', '1.1.12', 'content/docs/ecosystem/libraries/sqlite.mdx', '/ecosystem/libraries/sqlite/'],
  ['yanxu-postgres', '1.0.0', '1.1.12', 'content/docs/ecosystem/libraries/postgres.mdx', '/ecosystem/libraries/postgres/'],
  ['yanxu-mysql', '1.0.0', '1.1.12', 'content/docs/ecosystem/libraries/mysql.mdx', '/ecosystem/libraries/mysql/'],
  ['yanxu-orm', '1.0.0', '1.1.12', 'content/docs/ecosystem/libraries/orm.mdx', '/ecosystem/libraries/orm/'],
  ['yanxu-html', '1.0.0', '1.1.12', 'content/docs/ecosystem/web/html.mdx', '/ecosystem/web/html/'],
  ['yanxu-markdown', '1.0.1', '1.1.12', 'content/docs/ecosystem/libraries/markdown.mdx', '/ecosystem/libraries/markdown/'],
  ['yanxu-web', '1.0.0', '1.1.12', 'content/docs/ecosystem/web/framework.mdx', '/ecosystem/web/framework/'],
  ['yanxu-test', '1.0.0', '1.1.12', 'content/docs/ecosystem/libraries/test.mdx', '/ecosystem/libraries/test/'],
  ['yanxu-gui', '1.0.0', '1.1.12', 'content/docs/ecosystem/desktop/gui.mdx', '/ecosystem/desktop/gui/'],
];

const libraryCatalog = read('content/docs/ecosystem/libraries/index.mdx');
assert.match(libraryCatalog, /组织维护 21 个独立稳定库/);
for (const [repository, version, minimumYanxu, page, route] of stableLibraries) {
  const row = libraryCatalog.split('\n').find((line) => line.includes(`\`${repository}\``));
  assert.ok(row, `第三方库目录缺少 ${repository}`);
  assert.ok(row.includes(`| ${version} | ${minimumYanxu} |`),
    `${repository} 的稳定版本或最低言序不正确`);
  assert.ok(row.includes(`](${route})`), `${repository} 缺少稳定文档入口 ${route}`);

  const markdown = read(page);
  assert.ok(markdown.includes(version), `${page} 缺少稳定版本 ${version}`);
  assert.ok(markdown.includes(minimumYanxu), `${page} 缺少最低言序 ${minimumYanxu}`);
  assert.ok(markdown.includes(`https://github.com/yanxulang/${repository}`), `${page} 缺少仓库链接`);
  assert.ok(markdown.includes(`/releases/tag/v${version}`), `${page} 缺少稳定 Release 链接`);
  assert.ok(!/\^0\.[12]\b/u.test(markdown), `${page} 仍使用 0.x 依赖范围`);
  assert.ok(!/(?:修订\s*=\s*["']|--rev\s+)(?:main|HEAD)\b/iu.test(markdown),
    `${page} 仍把可变分支写成稳定来源`);
}

const libraryMeta = JSON.parse(read('content/docs/ecosystem/libraries/meta.json'));
for (const page of ['authoring', 'postgres', 'mysql']) {
  assert.ok(libraryMeta.pages.includes(page), `第三方库导航缺少 ${page}`);
}

const expectedAuthoringPages = [
  'index', 'project-structure', 'api-design', 'testing-ci', 'publishing', 'requirements',
];
const authoringMeta = JSON.parse(read('content/docs/ecosystem/libraries/authoring/meta.json'));
assert.deepEqual(authoringMeta.pages, expectedAuthoringPages, '第三方库编写指南导航不完整');
const authoring = expectedAuthoringPages
  .map((page) => read(`content/docs/ecosystem/libraries/authoring/${page}.mdx`))
  .join('\n');
for (const requirement of [
  '言序.toml', '格式 2', '结构化错误', '资源预算', '测试', 'CI', 'SemVer',
  '普通 merge', '附注标签', 'GitHub Release', '权限', 'SECURITY.md', '全新克隆',
]) {
  assert.ok(authoring.includes(requirement), `第三方库编写指南缺少 ${requirement}`);
}
assert.match(read('content/docs/ecosystem/libraries/authoring/publishing.mdx'),
  /没有把包直接发布到远端的`publish`命令/);
for (const page of [
  'content/docs/projects/dependencies.mdx',
  'content/docs/tooling/package-manager.mdx',
]) {
  assert.ok(!/yanbao add (?:http|html|web).*\^0\.[12]/u.test(read(page)),
    `${page} 仍推荐目标库的旧版安装范围`);
}

console.log(`内容检查通过：${files.length} 个文档页面。`);
