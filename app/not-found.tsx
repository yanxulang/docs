import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '页面未找到',
  description: '请求的言序文档页面不存在或已经迁移。',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-20">
      <p className="mb-4 text-sm font-semibold tracking-[0.18em] text-fd-primary">404 · 路径未收录</p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">这页不在当前文档里。</h1>
      <p className="mt-5 max-w-xl text-lg leading-8 text-fd-muted-foreground">
        页面可能已经迁移，或链接存在拼写问题。可以返回文档首页，也可以从参考入口继续查找。
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="rounded-lg bg-fd-primary px-5 py-3 font-medium text-fd-primary-foreground" href="/">
          返回文档首页
        </Link>
        <Link className="rounded-lg border border-fd-border bg-fd-card px-5 py-3 font-medium" href="/reference/">
          打开参考
        </Link>
      </div>
    </main>
  );
}
