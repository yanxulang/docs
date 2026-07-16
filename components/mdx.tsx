import defaultMdxComponents from 'fumadocs-ui/mdx';
import { CodeBlock, Pre, type CodeBlockProps } from 'fumadocs-ui/components/codeblock';
import type { MDXComponents } from 'mdx/types';
import { isValidElement, type ComponentProps, type ReactNode } from 'react';

function getText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return getText(node.props.children);
  return '';
}

function AccessiblePre(props: ComponentProps<'pre'>) {
  const blockProps = props as unknown as CodeBlockProps;
  const firstLine = getText(props.children)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  const label = props.title?.trim() ? `代码：${props.title.trim()}` : `代码示例：${firstLine?.slice(0, 48) || '未命名'}`;

  return (
    <CodeBlock {...blockProps} viewportProps={{ ...blockProps.viewportProps, 'aria-label': label }}>
      <Pre>{props.children}</Pre>
    </CodeBlock>
  );
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    pre: AccessiblePre,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
