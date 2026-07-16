import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsRoot = path.join(root, 'content/docs');
const binary = path.resolve(process.argv[2] ?? process.env.YANXU_BIN ?? path.join(root, '../yanxu-language-new/target/debug/yanxu'));

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : entry.name.endsWith('.mdx') ? [absolute] : [];
  });
}

if (!fs.existsSync(binary)) throw new Error(`找不到言序核心：${binary}`);
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'yanxu-doc-examples-'));
const failures = [];
let count = 0;

try {
  for (const file of walk(docsRoot)) {
    const markdown = fs.readFileSync(file, 'utf8');
    let index = 0;
    for (const match of markdown.matchAll(/^```yanxu[^\n]*\n([\s\S]*?)^```$/gm)) {
      count += 1;
      index += 1;
      const example = path.join(temporary, `${count}.yx`);
      fs.writeFileSync(example, match[1]);
      const result = spawnSync(binary, ['fmt', example], { encoding: 'utf8' });
      if (result.status !== 0) {
        failures.push(`${path.relative(root, file)}#${index}\n${(result.stderr || result.stdout).trim()}`);
      }
    }
  }
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}

if (count < 100) failures.push(`言序代码块数量异常：${count}`);
if (failures.length) {
  console.error(`言序示例检查失败（${failures.length} 项）：\n${failures.join('\n\n')}`);
  process.exit(1);
}

console.log(`言序示例检查通过：${count} 个代码块。`);
