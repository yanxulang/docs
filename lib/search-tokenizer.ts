import type { Tokenizer } from '@orama/orama';

const segmentsPattern = /[\p{Script=Han}]+|[\p{Letter}\p{Number}_./+-]+/gu;
const hanPattern = /^\p{Script=Han}+$/u;

export function tokenizeChineseSearch(raw: string): string[] {
  if (typeof raw !== 'string') return [String(raw)];

  const normalized = raw.normalize('NFKC').toLocaleLowerCase('zh-CN');
  const tokens = new Set<string>();

  for (const match of normalized.matchAll(segmentsPattern)) {
    const segment = match[0];
    if (!hanPattern.test(segment)) {
      tokens.add(segment);
      continue;
    }

    const characters = Array.from(segment);
    if (characters.length === 1) {
      tokens.add(characters[0]);
      continue;
    }
    for (let index = 0; index < characters.length - 1; index += 1) {
      tokens.add(characters.slice(index, index + 2).join(''));
    }
    if (characters.length <= 4) tokens.add(segment);
  }

  return Array.from(tokens);
}

export function createChineseTokenizer(): Tokenizer {
  return {
    language: 'zh-CN',
    normalizationCache: new Map<string, string>(),
    tokenize: (raw) => tokenizeChineseSearch(raw),
  };
}
