import type { Metadata } from 'next';

import { MuwaBoard } from './muwa-board';

export const metadata: Metadata = {
  title: '木瓦任务板 · 自有录屏案例',
  description: '用于录见产品验证的自有任务管理案例页面。',
  alternates: {
    canonical: '/cases/muwa-board',
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: '木瓦任务板 · 录见自有案例',
    description: '用于录见产品验证的自有任务管理案例页面。',
    images: [],
  },
  twitter: {
    card: 'summary',
    title: '木瓦任务板 · 录见自有案例',
    description: '用于录见产品验证的自有任务管理案例页面。',
    images: [],
  },
};

export default function MuwaBoardCasePage() {
  return <MuwaBoard />;
}
