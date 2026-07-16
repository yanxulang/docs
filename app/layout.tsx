import { Provider } from '@/components/provider';
import type { Metadata, Viewport } from 'next';
import './global.css';

const title = '言序文档 · 现代中文编程语言';
const description = '从第一份现代中文程序，到类型、模块、标准库、项目工程、工具链与生态应用的完整言序文档。';

export const metadata: Metadata = {
  metadataBase: new URL('https://docs.yanxu.dev/'),
  title: { default: title, template: '%s · 言序文档' },
  description,
  applicationName: '言序文档',
  authors: [{ name: 'YanXuLang', url: 'https://github.com/YanXuLang' }],
  creator: 'YanXuLang',
  category: 'technology',
  keywords: ['言序', 'Yanxu', '中文编程语言', '编程语言文档', 'yanbao', '字节码'],
  alternates: { canonical: '/' },
  icons: { icon: '/icon.svg' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: '言序文档',
    title,
    description,
    url: '/',
    images: [{ url: '/og/docs/image.png', width: 1200, height: 630, alt: '言序文档' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og/docs/image.png'],
  },
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f4ec' },
    { media: '(prefers-color-scheme: dark)', color: '#171513' },
  ],
};

const websiteData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: '言序文档',
  alternateName: 'Yanxu Documentation',
  url: 'https://docs.yanxu.dev/',
  inLanguage: 'zh-CN',
  description,
  publisher: {
    '@type': 'Organization',
    name: 'YanXuLang',
    url: 'https://github.com/YanXuLang',
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData).replaceAll('<', '\\u003c') }}
        />
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
