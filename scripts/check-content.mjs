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

const docsCi = read('.github/workflows/ci.yml');
assert.match(docsCi, /name: 入门语言示例[\s\S]*?ref: v1\.1\.20/, '语言示例 CI 未固定言序 1.1.20');
assert.match(docsCi, /yanxu: \['1\.1\.9', '1\.1\.20'\]/, '言界示例 CI 未覆盖最低与当前工具链');
assert.match(docsCi, /ref: v\$\{\{ matrix\.yanxu \}\}/, '言界示例 CI 未按矩阵固定工具链标签');
assert.match(read('content/docs/language/binary-data.mdx'), /单值硬上限为 16 MiB/);
assert.match(read('content/docs/reference/project-format.mdx'), /\| 字节码块 \| 2 \| 2 \|/);
assert.match(read('content/docs/reference/permissions.mdx'), /15 项宿主能力/);
assert.match(read('content/docs/reference/permissions.mdx'), /`本地网络`/);
const migrationMeta = JSON.parse(read('content/docs/reference/migrations/meta.json'));
for (let patch = 6; patch <= 20; patch += 1) {
  assert.ok(migrationMeta.pages.includes(`1.1.${patch}`), `迁移导航缺少 1.1.${patch}`);
}
assert.match(read('content/docs/reference/migrations/1.1.20.mdx'), /1\.1\.17 用户应直接升级到 1\.1\.20/);
const packageManager = read('content/docs/tooling/package-manager.mdx');
for (const requirement of [
  '0.6.1', '言序 1.1.20', 'CLI001..CLI010', 'TXN001..TXN005',
  '--message-format', 'AUDIT_CAPABILITY_MISSING', 'CycloneDX 1.5',
]) {
  assert.ok(packageManager.includes(requirement), `言包文档缺少 ${requirement}`);
}
const desktopManifest = read('examples/desktop/言序.toml');
assert.match(desktopManifest, /言序 = ">=1\.1\.9"/);
assert.match(desktopManifest, /版本 = "1\.0\.0"/);
assert.match(desktopManifest, /修订 = "v1\.0\.0"/);
assert.match(desktopManifest, /版 = "\^1\.0"/);
for (const permission of ['图形界面', '原生扩展', '剪贴板', '文件对话框']) {
  assert.match(desktopManifest, new RegExp(`^${permission} = true$`, 'm'), `桌面示例缺少 ${permission} 权限`);
}
const desktopLock = read('examples/desktop/言序.lock');
assert.match(desktopLock, /generator = "1\.1\.9"/);
assert.match(desktopLock, /target = "aarch64-apple-darwin"/);
assert.match(desktopLock, /yanxu-ui@1\.0\.0/);
assert.match(desktopLock, /yanxu-platform@1\.0\.0/);
assert.match(desktopLock, /minimum_yanxu = ">=1\.1\.9"/);
assert.match(desktopLock, /\[package\.native\][\s\S]*?abi = 2/);
const desktopCompatibility = read('content/docs/ecosystem/desktop/compatibility.mdx');
for (const requirement of [
  '1.1.9', '1.1.20', '0.6.1', '1.0.0', '1.1.2',
  '平台 1.7', '事件 1.3', '无障碍 1.0', '绘制 1.1', '70 个稳定错误码',
]) {
  assert.ok(desktopCompatibility.includes(requirement), `桌面兼容矩阵缺少 ${requirement}`);
}
const desktopMeta = JSON.parse(read('content/docs/ecosystem/desktop/meta.json'));
for (const page of [
  'accessibility', 'lifecycle-diagnostics', 'forms', 'overlays-menus', 'data-views', 'animation',
]) {
  assert.ok(desktopMeta.pages.includes(page), `桌面 1.0 导航缺少 ${page}`);
}
assert.equal(
  firstCodeBlock(read('content/docs/ecosystem/desktop/complete-example.mdx'), 'yanxu'),
  read('examples/desktop/综合控件展示.yx'),
  '言界完整示例与可运行源码不一致',
);
const desktopPages = desktopMeta.pages
  .filter((page) => !page.startsWith('---'))
  .map((page) => read(`content/docs/ecosystem/desktop/${page}.mdx`))
  .join('\n');
assert.doesNotMatch(desktopPages, /yanxu-(?:ui|platform)\/blob\/v0\./, '桌面 1.0 文档仍链接 0.x 上游文档');
assert.doesNotMatch(desktopPages, /言界 0\.1\.1|言台 0\.1\.0/, '桌面 1.0 文档仍把旧预览版写成当前版本');
for (const requirement of [
  '30 个声明', '23 个类', '7 个包级函数', '125 个域', '375 个方法',
]) {
  assert.ok(read('content/docs/ecosystem/desktop/api-reference.mdx').includes(requirement),
    `言界 1.0 API 参考缺少 ${requirement}`);
}
for (const requirement of [
  '平台协议为`1.7`', '事件协议为`1.3`', '无障碍协议为`1.0`', 'YXDR 1.1',
]) {
  assert.ok(read('content/docs/ecosystem/desktop/platform-architecture.mdx').includes(requirement),
    `言台 1.0 架构缺少 ${requirement}`);
}

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
