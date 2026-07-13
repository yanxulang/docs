# 言序文档

[![CI](https://github.com/YanXuLang/docs/actions/workflows/ci.yml/badge.svg)](https://github.com/YanXuLang/docs/actions/workflows/ci.yml)
[![Pages](https://github.com/YanXuLang/docs/actions/workflows/pages.yml/badge.svg)](https://github.com/YanXuLang/docs/actions/workflows/pages.yml)

言序编程语言的独立文档项目，使用 Fumadocs、Next.js、MDX、TypeScript 和 Tailwind CSS 构建。

线上文档：https://docs.yanxu.dev/

## 开发

需要 Node.js 22 或更新版本：

```sh
npm install
npm run types:check
npm run lint
npm run build
```

文档写在 `content/docs`，提交到 `main` 后由 GitHub Actions 静态导出并部署到独立 GitHub Pages。
