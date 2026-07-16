import assert from 'node:assert/strict';
import test from 'node:test';
import { create, insert, search } from '@orama/orama';
import { createChineseTokenizer, tokenizeChineseSearch } from '../lib/search-tokenizer.ts';

test('中文词组、言序术语和拉丁命令产生可复用词元', () => {
  const tokens = tokenizeChineseSearch('静态检查与字节码 VM，运行 yanbao check');
  for (const token of ['静态', '检查', '字节', '节码', 'vm', 'yanbao', 'check']) {
    assert.ok(tokens.includes(token), `缺少词元：${token}`);
  }
});

test('中文查询能命中正确文档', async () => {
  const database = create({
    schema: { title: 'string', content: 'string' },
    components: { tokenizer: createChineseTokenizer() },
  });

  await insert(database, {
    title: '依赖与锁图',
    content: '言序项目使用完整依赖锁图固定精确版本和来源。',
  });
  await insert(database, {
    title: '字节码虚拟机',
    content: '独立字节码 VM 执行 YXB 应用。',
  });

  const lockResults = await search(database, { term: '依赖锁图' });
  assert.equal(lockResults.hits[0]?.document.title, '依赖与锁图');

  const vmResults = await search(database, { term: '字节码 VM' });
  assert.equal(vmResults.hits[0]?.document.title, '字节码虚拟机');
});
