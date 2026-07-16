# 言序文档

[![CI](https://github.com/YanXuLang/docs/actions/workflows/ci.yml/badge.svg)](https://github.com/YanXuLang/docs/actions/workflows/ci.yml)
[![Pages](https://github.com/YanXuLang/docs/actions/workflows/pages.yml/badge.svg)](https://github.com/YanXuLang/docs/actions/workflows/pages.yml)

言序编程语言、项目工程、工具链、标准库与生态能力的独立文档项目，使用 Fumadocs、Next.js、MDX、TypeScript 和 Tailwind CSS 构建。

线上文档：https://docs.yanxu.dev/

## 开发

需要 Node.js 22 或更新版本：

```sh
npm install
npm run check
npm run build
```

文档写在 `content/docs`，提交到 `main` 后由 GitHub Actions 静态导出并部署到独立 GitHub Pages。

## 内容结构

文档按读者任务组织：

```text
content/docs/
├── index.mdx          # 语言优先的文档总览
├── getting-started/   # 安装、编辑器、首个程序与首个项目
├── language/          # 语法、类型和运行语义
├── projects/          # 清单、锁图、权限、资源与发布
├── tooling/           # 言包、编辑器、构建和扩展
├── standard-library/  # 25 个版本化标准模块
├── guides/            # 面向真实任务的组合指南
├── ecosystem/         # 言据、Web、第三方包与桌面应用
├── reference/         # 文法、CLI、格式、错误与迁移
└── design/            # 架构、语言设计、贡献与路线图
```

新增内容时优先放入已有主题目录；只有面向完全不同读者任务的内容才新增一级目录。较长页面应按可独立阅读的概念拆分，并在相邻页面之间提供明确链接。

每个一级入口应说明适用读者、建议阅读顺序和前置知识。教程按学习顺序组织，参考页按查询主题组织；不要把路线图或实现细节设为初学者的必读前置内容。

构建会为旧版一级路径生成静态兼容跳转，并检查本地链接、锚点、元数据、搜索制品与资源体积。`scripts/check-examples.mjs`使用真实言序格式化器解析全部用户可见言序代码块；高优先级入门示例还会在 CI 中执行静态检查和运行结果比对。
