import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return source.getPages().map((page) => ({
    url: new URL(page.url, 'https://docs.yanxu.dev/').toString(),
    changeFrequency: page.url === '/' ? 'weekly' : 'monthly',
    priority: page.url === '/' ? 1 : page.url.split('/').filter(Boolean).length === 1 ? 0.8 : 0.6,
  }));
}
