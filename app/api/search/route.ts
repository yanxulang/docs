import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';
import { createChineseTokenizer } from '@/lib/search-tokenizer';

export const revalidate = false;

export const { staticGET: GET } = createFromSource(source, {
  tokenizer: createChineseTokenizer(),
});
