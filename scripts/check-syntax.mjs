import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { createHighlighter } from 'shiki';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const grammarPath = path.join(root, 'syntaxes/yanxu.tmLanguage.json');
const upstreamUrl = 'https://raw.githubusercontent.com/YanXuLang/vscode-extension/main/syntaxes/yanxu.tmLanguage.json';
const grammar = JSON.parse(fs.readFileSync(grammarPath, 'utf8'));

grammar.name = 'yanxu';
grammar.aliases = ['yx', '言序'];

function normalize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function scopesFrom(tokens) {
  return tokens.flatMap((line) => line.flatMap((token) =>
    (token.explanation ?? []).flatMap((part) =>
      part.scopes.map((scope) => ({ content: part.content, scope: scope.scopeName })),
    ),
  ));
}

const fixture = `引「标准:JSON」为 JSON；
公 类 示例 则
    公 域 名：文；
    法 读取（次数：数）：文 则
        定 若然：理 为 真；
        若 次数 不小于 1 且 若然 则
            归 JSON.序列化（{「名」：此.名}）；
        终
        试 抛「失败」；救 错误 则 归「空」；终
    终
终
言 读取（2）；`;

const requiredScopes = [
  'keyword.control.import.yanxu',
  'storage.type.class.yanxu',
  'storage.type.function.yanxu',
  'entity.name.function.call.yanxu',
  'support.type.yanxu',
  'constant.language.yanxu',
  'constant.numeric.yanxu',
  'keyword.operator.yanxu',
  'string.quoted.double.corner.yanxu',
  'punctuation.yanxu',
];

const highlighter = await createHighlighter({ themes: ['github-light', 'github-dark'], langs: [grammar] });
try {
  for (const language of ['yanxu', 'yx', '言序']) {
    const result = highlighter.codeToTokens(fixture, {
      lang: language,
      theme: 'github-light',
      includeExplanation: true,
    });
    const scopes = scopesFrom(result.tokens);
    for (const expected of requiredScopes) {
      assert.ok(scopes.some(({ scope }) => scope === expected), `${language} 未产生作用域 ${expected}`);
    }
    assert.ok(
      !scopes.some(({ content, scope }) => content === '若然' && scope === 'keyword.control.yanxu'),
      '普通中文标识符“若然”被错误识别为关键字',
    );
  }
} finally {
  highlighter.dispose();
}

if (process.argv.includes('--upstream')) {
  const response = await fetch(upstreamUrl);
  assert.ok(response.ok, `无法读取 VS Code 语法真源：HTTP ${response.status}`);
  assert.equal(normalize(await response.json()), normalize(JSON.parse(fs.readFileSync(grammarPath, 'utf8'))),
    '文档语法与 VS Code 扩展真源不一致');
}

console.log('言序语法高亮与别名检查通过。');
