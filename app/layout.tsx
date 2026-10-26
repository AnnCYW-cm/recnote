import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    'https://lujian-video-guide-demo.caiyiwenann.chatgpt.site',
  ),
  title: '录见 Demo · 录屏转图文产品概念',
  description:
    '录见交互式产品概念 Demo：使用自有木瓦任务板案例，验证教程编辑、人工复核与公众号素材导出体验。',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: '录见 Demo · 录屏转图文产品概念',
    description:
      '使用自有木瓦任务板案例，体验教程编辑、人工复核与公众号素材导出。',
    url: '/',
    type: 'website',
    siteName: '录见 Demo',
    locale: 'zh_CN',
    images: [
      {
        url: '/og.jpg',
        width: 1200,
        height: 630,
        alt: '录见：把一段录屏变成可编辑教程',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '录见 Demo · 录屏转图文产品概念',
    description:
      '使用自有木瓦任务板案例，体验教程编辑、人工复核与公众号素材导出。',
    images: ['/og.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
