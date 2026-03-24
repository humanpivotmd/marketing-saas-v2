import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://marketingflow.kr'),
  title: {
    default: 'MarketingFlow - 네이버 상위 노출을 위한 콘텐츠 자동화',
    template: '%s | MarketingFlow',
  },
  description: '키워드 분석부터 AI 콘텐츠 생성, SNS 발행, 순위 추적까지. 네이버 상위 노출을 위한 콘텐츠 자동화 파이프라인.',
  keywords: ['마케팅', '콘텐츠 자동화', '네이버 SEO', 'AI 콘텐츠', '키워드 분석', 'SNS 마케팅'],
  alternates: {
    canonical: 'https://marketingflow.kr/',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://marketingflow.kr/',
    siteName: 'MarketingFlow',
    title: 'MarketingFlow - 네이버 상위 노출을 위한 콘텐츠 자동화',
    description: '키워드 분석부터 AI 콘텐츠 생성, SNS 발행까지. 마케팅 자동화 파이프라인.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MarketingFlow - 네이버 상위 노출을 위한 콘텐츠 자동화',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MarketingFlow - 네이버 상위 노출을 위한 콘텐츠 자동화',
    description: '키워드 분석부터 AI 콘텐츠 생성, SNS 발행까지. 마케팅 자동화 파이프라인.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
