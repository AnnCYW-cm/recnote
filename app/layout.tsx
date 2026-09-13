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
  title: '录见 Demo · AI 录屏教程生成器',
  description:
    '交互式产品概念 Demo：使用内置录屏样例，体验从关键步骤识别、图文校对到公众号素材导出的完整流程。',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: '录见 Demo · AI 录屏教程生成器',
    description:
      '交互式产品概念 Demo：使用内置样例，体验录屏转图文教程的完整流程。',
    url: '/',
    type: 'website',
    siteName: '录见 Demo',
    locale: 'zh_CN',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: '录见：录一遍，教程自己长出来',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '录见 Demo · AI 录屏教程生成器',
    description:
      '交互式产品概念 Demo：使用内置样例，体验录屏转图文教程的完整流程。',
    images: ['/og.png'],
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
