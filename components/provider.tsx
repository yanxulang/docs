'use client';
import SearchDialog from '@/components/search';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { type ReactNode } from 'react';

export function Provider({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      search={{ SearchDialog }}
      i18n={{
        locale: 'zh-CN',
        translations: {
          'Search(search trigger)': '搜索',
          'Search(search dialog)': '搜索文档',
          'Open Search(search trigger)(aria-label)': '打开搜索',
          'Close Search(search dialog)(aria-label)': '关闭搜索',
          'No results found(search dialog)': '没有找到结果',
          'On this page(table of contents)': '本页目录',
          'Previous Page(pagination)': '上一篇',
          'Next Page(pagination)': '下一篇',
          'Copy Markdown(page actions)': '复制 Markdown',
          'View as Markdown(page actions)': '查看 Markdown',
          'Edit on GitHub(edit page)': '在 GitHub 编辑',
          'Toggle Theme(theme switcher)(aria-label)': '切换主题',
          'Collapse Sidebar(sidebar)(aria-label)': '收起侧栏',
          'Open Sidebar(sidebar)(aria-label)': '打开侧栏',
        },
      }}
    >
      {children}
    </RootProvider>
  );
}
