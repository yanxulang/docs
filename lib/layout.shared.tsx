import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';
import { appName, gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="flex items-center gap-2">
          <Image src="/icon.svg" alt="" width={28} height={28} />
          <span>{appName}</span>
        </span>
      ),
    },
    links: [
      { text: '官网', url: 'https://yanxu.dev/' },
      { text: '下载', url: 'https://yanxu.dev/download/' },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
