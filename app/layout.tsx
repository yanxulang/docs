import { Provider } from '@/components/provider';
import type { Metadata } from 'next';
import './global.css';

export const metadata: Metadata = {
  title: { default: '言序文档', template: '%s · 言序文档' },
  description: '言序编程语言的入门教程、语法参考、运行时架构与路线图。',
  metadataBase: new URL('https://docs.yanxu.dev/'),
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
