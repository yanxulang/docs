import { getPageImage, source } from '@/lib/source';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<'/og/docs/[...slug]'>) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#f8f4ec',
        color: '#28231e',
        padding: '70px 76px',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', width: '72%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#a43d30', fontSize: 24, fontWeight: 700 }}>
          <span style={{ display: 'flex', width: 8, height: 34, background: '#b64632' }} />
          言序文档 · YANXU
        </div>
        <div style={{ display: 'flex', marginTop: 54, fontSize: 62, lineHeight: 1.18, fontWeight: 700, letterSpacing: '-0.035em' }}>
          {page.data.title}
        </div>
        <div style={{ display: 'flex', marginTop: 28, maxWidth: 760, color: '#5e554c', fontSize: 28, lineHeight: 1.5 }}>
          {page.data.description}
        </div>
        <div style={{ display: 'flex', marginTop: 'auto', color: '#a43d30', fontSize: 22, fontWeight: 600 }}>
          docs.yanxu.dev
        </div>
      </div>
      <div style={{ display: 'flex', position: 'absolute', top: 88, right: 70, width: 190, height: 1, background: '#b64632' }} />
      <div style={{ display: 'flex', position: 'absolute', top: 88, right: 256, width: 14, height: 14, background: '#b64632' }} />
      <div style={{ display: 'flex', position: 'absolute', top: 175, right: 102, width: 112, height: 112, background: '#2c2925' }} />
      <div style={{ display: 'flex', position: 'absolute', top: 214, right: 214, width: 74, height: 74, background: '#c34b37' }} />
      <div style={{ display: 'flex', position: 'absolute', top: 286, right: 56, width: 1, height: 212, background: '#8d8175' }} />
      <div style={{ display: 'flex', position: 'absolute', top: 376, right: 56, width: 238, height: 1, background: '#8d8175' }} />
      <div style={{ display: 'flex', position: 'absolute', top: 367, right: 286, width: 18, height: 18, border: '3px solid #2c2925' }} />
      <div style={{ display: 'flex', position: 'absolute', top: 455, right: 146, width: 84, height: 84, background: '#d5cec3' }} />
      <div style={{ display: 'flex', position: 'absolute', top: 508, right: 86, width: 150, height: 1, background: '#b64632' }} />
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImage(page).segments,
  }));
}
