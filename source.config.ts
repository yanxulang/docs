import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import type { LanguageRegistration } from '@shikijs/types';
import yanxuGrammar from './syntaxes/yanxu.tmLanguage.json';

const yanxuLanguage = {
  ...yanxuGrammar,
  name: 'yanxu',
  aliases: ['yx'],
} as unknown as LanguageRegistration;

// You can customize Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      langs: [yanxuLanguage],
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
});
