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

## 内容结构

文档按读者任务组织：

```text
content/docs/
├── index.mdx          # 文档总览与阅读路径
├── getting-started/   # 安装、第一份程序、命令行与 REPL
├── language/          # 语法、类型和运行语义
├── tooling/           # 编辑器、构建与项目仓库
└── project/           # 运行时架构与长期路线图
```

新增内容时优先放入已有主题目录；只有面向完全不同读者任务的内容才新增一级目录。较长页面应按可独立阅读的概念拆分，并在相邻页面之间提供明确链接。
