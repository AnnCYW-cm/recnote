'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
} from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  CloudOff,
  Download,
  Eye,
  EyeOff,
  FileText,
  ImageIcon,
  LoaderCircle,
  LockKeyhole,
  Play,
  RotateCcw,
  Scissors,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Video,
  WandSparkles,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

type Phase = 'upload' | 'processing' | 'editor';
type EditorMode = 'edit' | 'preview';

type TutorialStep = {
  id: number;
  time: string;
  title: string;
  body: string;
  image: string;
  included: boolean;
  confidence: number;
};

const INITIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    time: '00:02',
    title: '新建一个对话',
    body: '点击左侧的 New chat，进入新的对话页面。录屏中的页面已经处于 Work 模式。',
    image: '/demo/step-01-new-chat.jpg',
    included: true,
    confidence: 98,
  },
  {
    id: 2,
    time: '00:18',
    title: '发送一条测试消息',
    body: '在底部输入框中输入测试内容并发送。等待处理完成后，页面出现回复。',
    image: '/demo/step-02-message.jpg',
    included: true,
    confidence: 96,
  },
  {
    id: 3,
    time: '00:31',
    title: '查看 Library 资料库',
    body: '点击左侧 Library。资料库页面提供搜索入口，并可按内容类型进行查看。',
    image: '/demo/step-03-library.jpg',
    included: true,
    confidence: 99,
  },
  {
    id: 4,
    time: '00:43',
    title: '查看 Projects 项目',
    body: '点击 Projects 进入项目页面。当前账号尚未创建项目，因此页面显示空状态。',
    image: '/demo/step-04-projects.jpg',
    included: true,
    confidence: 99,
  },
  {
    id: 5,
    time: '00:51',
    title: '查看 Scheduled 定时任务',
    body: '点击 Scheduled。页面顶部包含任务输入框和 Active 筛选入口。',
    image: '/demo/step-05-scheduled.jpg',
    included: true,
    confidence: 97,
  },
  {
    id: 6,
    time: '01:03',
    title: '打开 Plugins 插件页',
    body: '点击 Plugins。页面顶部可在 Plugins 与 Skills 之间切换，并提供插件搜索入口。',
    image: '/demo/step-06-plugins.jpg',
    included: true,
    confidence: 99,
  },
  {
    id: 7,
    time: '01:37',
    title: '浏览更多插件分类',
    body: '向下滚动插件页面，继续查看旅行、娱乐及其他分类中的可用插件。',
    image: '/demo/step-07-plugin-categories.jpg',
    included: true,
    confidence: 94,
  },
  {
    id: 8,
    time: '01:51',
    title: '展开 More 菜单',
    body: '点击左侧 More，可以看到 Health、Finances、Sites 和 GPTs 等附加入口。',
    image: '/demo/step-08-more-menu.jpg',
    included: true,
    confidence: 95,
  },
  {
    id: 9,
    time: '02:00',
    title: '查看 Health 页面',
    body: 'Health 页面显示 Connect your health data。录屏只进行了查看，没有连接或授权。',
    image: '/demo/step-09-health.jpg',
    included: true,
    confidence: 98,
  },
  {
    id: 10,
    time: '02:40',
    title: '打开 GPTs 页面',
    body: '通过 More 中的 GPTs 进入页面，可查看搜索框、分类标签、精选内容和热门排行。',
    image: '/demo/step-10-gpts.jpg',
    included: true,
    confidence: 99,
  },
];

const PROCESSING_STAGES = [
  { at: 14, label: '读取录屏信息', detail: '02:41 · 3456 × 2166 · 无音频' },
  { at: 34, label: '定位界面变化', detail: '发现 44 个候选画面' },
  { at: 58, label: '筛选关键步骤', detail: '去除加载态与重复画面' },
  { at: 78, label: '理解操作语义', detail: '匹配截图、时间戳与说明' },
  { at: 96, label: '生成教程初稿', detail: '10 个步骤 · 正在排版' },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`${compact ? 'size-8 rounded-[10px]' : 'size-9 rounded-[11px]'} grid place-items-center bg-gradient-to-br from-[#8b6cff] via-[#7657ff] to-[#4fdcff] text-white shadow-[0_10px_32px_rgba(118,87,255,.36)]`}>
        <Play className="size-3.5 fill-current" />
      </span>
      <div className="leading-none">
        <strong className="font-heading text-lg font-semibold tracking-[-.045em]">录见</strong>
        {!compact && (
          <span className="ml-2 text-[10px] font-medium uppercase tracking-[.24em] text-white/35">Recnote</span>
        )}
      </div>
    </div>
  );
}

function UploadView({ onStart }: { onStart: (fileName?: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState('');

  const acceptFile = (file?: File) => {
    if (!file) return;
    const supported = ['video/mp4', 'video/quicktime'].includes(file.type) || /\.(mov|mp4)$/i.test(file.name);
    if (!supported) {
      setFileName('');
      setFileError('请选择 MOV 或 MP4 录屏文件');
      return;
    }
    setFileName(file.name);
    setFileError('');
  };

  const handleDrop = (event: ReactDragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#07080c] text-white">
      <div className="recnote-grid pointer-events-none absolute inset-0 -z-20 opacity-70" />
      <div className="pointer-events-none absolute left-[12%] top-[-22rem] -z-10 h-[38rem] w-[38rem] rounded-full bg-[#795cff]/25 blur-[120px]" />
      <div className="pointer-events-none absolute -right-44 bottom-[-20rem] -z-10 h-[38rem] w-[38rem] rounded-full bg-[#3bd9ff]/14 blur-[130px]" />

      <header className="border-b border-white/[.07] bg-[#07080c]/72 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-8">
          <Brand />
          <div className="flex items-center gap-3 text-[11px] text-white/42">
            <span className="hidden items-center gap-2 sm:flex"><span className="size-1.5 rounded-full bg-[#6ce5ff] shadow-[0_0_12px_#6ce5ff]" /> INTERACTIVE PROTOTYPE</span>
            <Badge className="h-7 border-white/10 bg-white/[.055] px-3 text-white/70" variant="outline">Demo 01</Badge>
          </div>
        </div>
      </header>

      <section className="relative mx-auto grid min-h-[calc(100vh-64px)] max-w-[1440px] items-center gap-14 px-5 py-14 sm:px-8 lg:grid-cols-[.82fr_1.18fr] lg:py-20">
        <div className="relative z-10 max-w-[600px]">
          <div className="mb-7 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[.22em] text-[#92a0b8]">
            <span className="h-px w-9 bg-gradient-to-r from-[#8367ff] to-[#67ddff]" />
            AI Screen-to-Guide
          </div>
          <h1 className="font-heading text-[clamp(2.6rem,5.2vw,4.8rem)] leading-[.96] font-semibold tracking-[-.07em]">
            把一段录屏
            <br />
            <span className="bg-gradient-to-r from-[#b9a8ff] via-[#826cff] to-[#63ddff] bg-clip-text text-transparent">变成一篇教程。</span>
          </h1>
          <p className="mt-7 max-w-lg text-[17px] leading-8 text-[#9aa4b7]">
            AI 自动找到关键操作，匹配截图与说明。你只需要校对几处，就能得到一篇可以直接发布的图文教程。
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[.08em] text-white/42">
            <span>02:41 录屏</span><ArrowRight className="size-3 text-[#826cff]" />
            <span>44 个候选画面</span><ArrowRight className="size-3 text-[#826cff]" />
            <span className="text-white/75">10 步教程</span>
          </div>

          <div className="mt-9 rounded-[24px] border border-white/[.1] bg-white/[.045] p-2.5 shadow-[0_28px_90px_rgba(0,0,0,.42)] backdrop-blur-xl">
            <input
              ref={inputRef}
              className="sr-only"
              type="file"
              accept="video/mp4,video/quicktime,.mov,.mp4"
              onChange={(event) => acceptFile(event.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragEnter={() => setDragging(true)}
              onDragLeave={() => setDragging(false)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              className={`group flex w-full items-center gap-4 rounded-[17px] border p-4 text-left transition duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#856cff]/20 ${dragging ? 'border-[#8b73ff]/70 bg-[#7d63ff]/12' : 'border-white/[.08] bg-black/20 hover:border-white/20 hover:bg-white/[.04]'}`}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-[13px] border border-white/10 bg-white/[.08] text-white transition duration-300 group-hover:-translate-y-0.5 group-hover:bg-white/[.12]">
                <UploadCloud className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-white">{fileName || '选择或拖入一段录屏'}</span>
                <span className="mt-1 block text-xs text-white/38">
                  {fileName ? '文件已在浏览器中选择，未上传' : 'MOV / MP4 · 演示模式不上传文件'}
                </span>
              </span>
              {fileName ? (
                <CheckCircle2 className="mr-2 size-5 text-[#5de0c0]" />
              ) : (
                <ArrowRight className="mr-2 size-4 text-white/30 transition group-hover:translate-x-1 group-hover:text-white" />
              )}
            </button>
            <Button
              className="recnote-shine relative mt-2.5 h-12 w-full overflow-hidden rounded-[17px] border-0 bg-gradient-to-r from-[#7457ff] via-[#896cff] to-[#4bcfe9] text-[14px] font-semibold text-white shadow-[0_16px_40px_rgba(117,87,255,.3)] hover:brightness-110"
              size="lg"
              onClick={() => onStart(fileName)}
            >
              <Sparkles data-icon="inline-start" />
              {fileName ? '以示例结果继续体验' : '用示例录屏体验完整流程'}
            </Button>
            {fileName && (
              <p className="px-2 pt-3 text-center text-xs leading-5 text-white/38">
                当前是前端 Demo，将使用内置示例结果演示后续流程，不会处理或上传你选择的视频。
              </p>
            )}
            {fileError && <p role="alert" className="px-2 pt-3 text-center text-xs text-destructive">{fileError}</p>}
          </div>

          <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3 text-xs text-white/46">
            <span className="flex items-center gap-2"><ShieldCheck className="size-3.5 text-[#69dec9]" /> 本地优先 · 隐私可控</span>
            <span className="flex items-center gap-2"><FileText className="size-3.5 text-[#8e7cff]" /> 一键导出 Markdown</span>
          </div>
        </div>

        <div className="relative z-10 lg:pl-6">
          <div className="absolute inset-x-12 top-10 -z-10 h-56 rounded-full bg-[#7156ff]/26 blur-[90px]" />
          <div className="relative overflow-hidden rounded-[28px] border border-white/[.12] bg-[#11131a]/88 p-2.5 shadow-[0_45px_120px_rgba(0,0,0,.55)] backdrop-blur-xl sm:p-3">
            <div className="flex h-12 items-center justify-between px-3 text-white">
              <div>
                <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#ff6b67]" /><span className="size-2 rounded-full bg-[#f6c85f]" /><span className="size-2 rounded-full bg-[#5ed19a]" /></div>
              </div>
              <p className="text-[11px] font-medium uppercase tracking-[.16em] text-white/35">Recnote · Draft 01</p>
              <Badge className="h-6 border-[#67dfc5]/20 bg-[#67dfc5]/10 text-[#75e8cf]" variant="outline"><span className="mr-1 size-1.5 rounded-full bg-current" /> READY</Badge>
            </div>
            <div className="relative overflow-hidden rounded-[20px] border border-white/[.08] bg-white">
              <img
                src="/demo/step-06-plugins.jpg"
                alt="自动生成教程中的插件页面步骤截图"
                className="aspect-[16/9] w-full object-cover object-top"
              />
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 rounded-[15px] border border-black/[.06] bg-[#0e1118]/92 p-3 text-white shadow-2xl backdrop-blur-xl">
                <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-[#8065ff] to-[#55d6ef] text-xs font-bold text-white">06</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">打开 Plugins 插件页</p>
                  <p className="mt-0.5 truncate text-[11px] text-white/42">已匹配截图 · 时间戳 · 操作说明</p>
                </div>
                <span className="font-mono text-[10px] text-[#78e5ce]">99% MATCH</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-b-[18px] bg-white/[.08] text-white">
              {[
                ['02:41', '原始录屏'],
                ['44 → 10', '关键步骤'],
                ['01:08', '生成初稿'],
              ].map(([value, label]) => (
                <div key={label} className="bg-[#11131a] px-3 py-3.5 text-center">
                  <p className="font-mono text-sm font-medium tracking-tight text-white/90">{value}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[.1em] text-white/30">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="recnote-float absolute -bottom-6 -left-5 hidden items-center gap-3 rounded-[16px] border border-white/10 bg-[#151823]/90 px-4 py-3 text-white shadow-[0_20px_60px_rgba(0,0,0,.45)] backdrop-blur-xl sm:flex">
            <span className="grid size-8 place-items-center rounded-[10px] bg-[#61dcc8]/10"><Video className="size-4 text-[#6ce2cc]" /></span>
            <div>
              <p className="text-[10px] uppercase tracking-[.12em] text-white/32">Traceability</p>
              <p className="mt-0.5 text-xs font-medium text-white/85">10 个步骤全部可回溯</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ProcessingView({ onCancel }: { onCancel: () => void }) {
  const [progress, setProgress] = useState(4);

  useEffect(() => {
    const values = [14, 34, 58, 78, 96, 100];
    const timers = values.map((value, index) =>
      window.setTimeout(() => setProgress(value), 650 + index * 720),
    );
    return () => timers.forEach(window.clearTimeout);
  }, []);

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#07080c] text-white">
      <div className="recnote-grid pointer-events-none absolute inset-0 -z-20 opacity-45" />
      <div className="pointer-events-none absolute -left-48 top-1/4 -z-10 size-[34rem] rounded-full bg-[#7657ff]/16 blur-[120px]" />
      <div className="pointer-events-none absolute -right-48 bottom-[-12rem] -z-10 size-[32rem] rounded-full bg-[#3cd8ee]/10 blur-[120px]" />

      <header className="border-b border-white/[.07] bg-[#07080c]/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Brand />
          <Button className="border border-white/[.08] bg-white/[.04] text-white/65 hover:bg-white/[.08] hover:text-white" variant="ghost" onClick={onCancel}>
            取消分析
          </Button>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-14 px-5 py-12 sm:px-8 lg:grid-cols-[.86fr_1.14fr] lg:py-16">
        <div className="max-w-lg">
          <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[.2em] text-[#788398]">
            <span className="size-1.5 rounded-full bg-[#6de1cd] shadow-[0_0_12px_#6de1cd]" />
            AI Pipeline · Live
          </div>
          <h1 className="mt-6 font-heading text-[clamp(2.55rem,4.2vw,4rem)] font-semibold leading-[1.02] tracking-[-.06em]">
            正在把操作过程<br />变成清晰教程
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-7 text-white/52">
            先捕获所有界面变化，再由 AI 去重、排序并写出步骤，让每一张截图都有出处。
          </p>

          <div className="mt-8 rounded-[20px] border border-white/[.09] bg-[#10131b]/82 p-5 shadow-[0_28px_90px_rgba(0,0,0,.34)] backdrop-blur-xl">
            <Progress value={progress} className="[&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-[#7b5cff] [&_[data-slot=progress-indicator]]:to-[#5bdbed] [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-white/[.07]">
              <ProgressLabel className="text-[11px] font-medium uppercase tracking-[.16em] text-white/50">Analysis progress</ProgressLabel>
              <ProgressValue className="font-mono text-sm text-white">{String(progress).padStart(2, '0')}%</ProgressValue>
            </Progress>
            <div className="mt-6 space-y-1.5">
              {PROCESSING_STAGES.map((stage, index) => {
                const completed = progress >= stage.at;
                const active = !completed && (index === 0 || progress >= PROCESSING_STAGES[index - 1].at);
                return (
                  <div
                    key={stage.label}
                    className={`flex items-center gap-3 rounded-[13px] border px-3 py-3 transition duration-300 ${active ? 'border-[#7f68ff]/25 bg-[#8065ff]/[.09]' : 'border-transparent'}`}
                  >
                    <span className={`grid size-7 shrink-0 place-items-center rounded-[9px] border ${completed ? 'border-[#66dfca]/20 bg-[#66dfca]/10 text-[#72e3ce]' : active ? 'border-[#8a73ff]/35 bg-[#8065ff]/15 text-[#a797ff]' : 'border-white/[.07] text-white/18'}`}>
                      {completed ? <Check className="size-3.5" /> : active ? <LoaderCircle className="size-3.5 animate-spin" /> : <span className="size-1 rounded-full bg-current" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[13px] font-medium ${completed || active ? 'text-white/90' : 'text-white/25'}`}>{stage.label}</p>
                      <p className={`mt-0.5 truncate text-[11px] ${completed || active ? 'text-white/38' : 'text-white/16'}`}>{stage.detail}</p>
                    </div>
                    <span className={`font-mono text-[10px] ${completed ? 'text-[#6fe1cc]/60' : active ? 'text-[#9c8aff]/70' : 'text-white/14'}`}>{completed ? 'DONE' : active ? 'RUN' : `0${index + 1}`}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-2xl">
          <div className="absolute inset-16 -z-10 rounded-full bg-[#7657ff]/24 blur-[90px]" />
          <div className="overflow-hidden rounded-[22px] border border-white/[.11] bg-[#10131a] p-2.5 shadow-[0_42px_110px_rgba(0,0,0,.52)]">
            <div className="flex h-10 items-center justify-between px-2.5">
              <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[.14em] text-white/34"><Scissors className="size-3.5 text-[#8c76ff]" /> Frame analysis</div>
              <span className="font-mono text-[10px] text-white/28">CANDIDATE 028 / 044</span>
            </div>
            <div className="relative overflow-hidden rounded-[15px] border border-white/[.08] bg-white">
              <img src="/demo/step-07-plugin-categories.jpg" alt="正在分析的示例录屏画面" className="aspect-[16/10] w-full object-cover object-top" />
              <div className="absolute left-[8%] top-[24%] h-[17%] w-[31%] rounded-[7px] border border-[#66dceb] bg-[#66dceb]/[.07] shadow-[0_0_0_4px_rgba(102,220,235,.08)]">
                <span className="absolute -top-5 left-0 rounded-[5px] bg-[#66dceb] px-1.5 py-0.5 font-mono text-[8px] font-bold text-[#081013]">UI CHANGE</span>
              </div>
              <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-[12px] border border-white/[.1] bg-[#0b0e14]/90 px-3 py-2.5 text-white shadow-2xl backdrop-blur-xl">
                <span className="flex items-center gap-2 text-xs font-medium"><span className="size-1.5 rounded-full bg-[#67e0ca] shadow-[0_0_8px_#67e0ca]" /> 正在识别插件分类变化</span>
                <span className="font-mono text-[10px] text-white/42">01:37.000</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-b-[14px] bg-white/[.07]">
              {[['SCENE', '0.84'], ['SIMILARITY', '12%'], ['KEEP', 'YES']].map(([label, value]) => (
                <div key={label} className="bg-[#10131a] px-3 py-3">
                  <p className="text-[9px] uppercase tracking-[.12em] text-white/24">{label}</p>
                  <p className={`mt-1 font-mono text-xs ${label === 'KEEP' ? 'text-[#6fe2cd]' : 'text-white/68'}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="recnote-float absolute -bottom-6 right-5 rounded-[15px] border border-white/10 bg-[#171b25]/92 px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,.5)] backdrop-blur-xl">
            <p className="text-[9px] font-medium uppercase tracking-[.15em] text-[#8f7aff]">AI Decision</p>
            <p className="mt-1 text-xs font-medium text-white/85">保留 · 具有教学价值</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function buildMarkdown(title: string, summary: string, steps: TutorialStep[], assetOrigin: string) {
  const body = steps
    .filter((step) => step.included)
    .map(
      (step, index) =>
        `## ${index + 1}. ${step.title}\n\n**视频时间：${step.time}**\n\n${step.body}\n\n![${step.title}](${assetOrigin}${step.image})`,
    )
    .join('\n\n');
  return `# ${title}\n\n> ${summary}\n\n${body}\n`;
}

function EditorView({ onReset }: { onReset: () => void }) {
  const [steps, setSteps] = useState(() => INITIAL_STEPS.map((step) => ({ ...step })));
  const [selectedId, setSelectedId] = useState(6);
  const [mode, setMode] = useState<EditorMode>('edit');
  const [title, setTitle] = useState('ChatGPT Work 快速导览：从新对话到插件与 GPTs');
  const [summary, setSummary] = useState('这段操作演示了 ChatGPT Work 网页版中的主要入口，并由 2 分 41 秒的无声录屏自动生成。');
  const [notice, setNotice] = useState('');
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false);

  const selectedStep = steps.find((step) => step.id === selectedId) ?? steps[0];
  const includedSteps = useMemo(() => steps.filter((step) => step.included), [steps]);

  const updateStep = (id: number, patch: Partial<TutorialStep>) => {
    setSteps((current) => current.map((step) => (step.id === id ? { ...step, ...patch } : step)));
  };

  const moveStep = (id: number, direction: -1 | 1) => {
    setSteps((current) => {
      const from = current.findIndex((step) => step.id === id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= current.length) return current;
      const next = [...current];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  };

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2200);
  };

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(buildMarkdown(title, summary, steps, window.location.origin));
      showNotice('Markdown 已复制');
    } catch {
      showNotice('浏览器未授权剪贴板，请使用下载');
    }
  };

  const downloadMarkdown = () => {
    const blob = new Blob([buildMarkdown(title, summary, steps, window.location.origin)], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'ChatGPT-Work-功能入口导览.md';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
    showNotice('教程已导出');
  };

  const selectedIndex = steps.findIndex((step) => step.id === selectedId);
  const publishScore = privacyConfirmed ? 100 : 92;

  const polishSelectedStep = () => {
    if (!selectedStep.body.includes('完成后，请确认')) {
      updateStep(selectedStep.id, {
        body: `${selectedStep.body} 完成后，请确认页面标题与预期结果一致。`,
      });
    }
    showNotice('AI 已润色当前步骤');
  };

  return (
    <main className="min-h-screen bg-[#080a0f] text-white lg:h-screen lg:overflow-hidden">
      <header className="sticky top-0 z-30 border-b border-white/[.075] bg-[#090b11]/92 backdrop-blur-2xl lg:static">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-5">
          <Brand compact />
          <div className="mx-2 hidden h-6 w-px bg-white/[.08] sm:block" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-white/90">ChatGPT Work 功能入口导览</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[.1em] text-white/28">Draft 01 · Sample data</p>
          </div>
          <div className="hidden rounded-[10px] border border-white/[.075] bg-white/[.035] p-1 sm:flex">
            <button aria-pressed={mode === 'edit'} onClick={() => setMode('edit')} className={`rounded-[7px] px-3 py-1.5 text-[11px] font-medium transition ${mode === 'edit' ? 'bg-white/[.1] text-white shadow-sm' : 'text-white/38 hover:text-white/70'}`}>编辑步骤</button>
            <button aria-pressed={mode === 'preview'} onClick={() => setMode('preview')} className={`rounded-[7px] px-3 py-1.5 text-[11px] font-medium transition ${mode === 'preview' ? 'bg-white/[.1] text-white shadow-sm' : 'text-white/38 hover:text-white/70'}`}>成稿预览</button>
          </div>
          <Button variant="outline" className="hidden border-white/[.09] bg-white/[.035] text-white/70 hover:bg-white/[.075] hover:text-white sm:inline-flex" onClick={copyMarkdown}><Clipboard data-icon="inline-start" /> 复制</Button>
          <Button className="border-0 bg-gradient-to-r from-[#7457ff] to-[#54cfe8] text-white shadow-[0_10px_28px_rgba(116,87,255,.22)] hover:brightness-110" onClick={downloadMarkdown}><Download data-icon="inline-start" /> 导出 Markdown</Button>
        </div>
      </header>

      <div className="grid lg:h-[calc(100vh-64px)] lg:grid-cols-[276px_minmax(0,1fr)_270px]">
        <aside className="border-b border-white/[.07] bg-[#0b0e14] lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between p-4 pb-3">
            <div>
              <p className="text-[13px] font-medium text-white/88">教程步骤</p>
              <p className="mt-1 text-[11px] text-white/30">44 个候选 → {includedSteps.length} 步成稿</p>
            </div>
            <Badge className="h-6 border-[#8873ff]/20 bg-[#8065ff]/10 px-2.5 text-[9px] font-medium uppercase tracking-[.12em] text-[#a797ff]" variant="outline">AI Draft</Badge>
          </div>
          <div className="flex gap-2 overflow-x-auto px-3 pb-4 lg:block lg:space-y-1 lg:overflow-visible">
            {steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                aria-current={selectedId === step.id && mode === 'edit' ? 'step' : undefined}
                aria-label={`步骤 ${index + 1}：${step.title}，${step.included ? '已纳入成稿' : '已从成稿隐藏'}`}
                onClick={() => { setSelectedId(step.id); setMode('edit'); }}
                className={`group relative flex min-w-[225px] items-center gap-3 overflow-hidden rounded-[12px] border p-2 text-left transition duration-200 lg:min-w-0 lg:w-full ${selectedId === step.id && mode === 'edit' ? 'border-[#8065ff]/35 bg-[#8065ff]/[.09]' : 'border-transparent hover:border-white/[.07] hover:bg-white/[.035]'} ${step.included ? '' : 'opacity-35'}`}
              >
                {selectedId === step.id && mode === 'edit' && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gradient-to-b from-[#927fff] to-[#59d7e9]" />}
                <div className="relative h-12 w-[70px] shrink-0 overflow-hidden rounded-[8px] border border-white/[.07] bg-white/[.04]">
                  <img src={step.image} alt="" className="h-full w-full object-cover object-top" />
                  <span className="absolute left-1 top-1 grid size-4 place-items-center rounded-[4px] bg-[#090b11]/88 font-mono text-[8px] font-medium text-white">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-white/78">{step.title}</p>
                  <p className="mt-1 flex items-center gap-1.5 font-mono text-[9px] text-white/27"><Video className="size-2.5" /> {step.time} · {step.confidence}%</p>
                </div>
                {step.included ? <Eye className="size-3 text-white/18" /> : <EyeOff className="size-3 text-white/35" />}
              </button>
            ))}
          </div>
        </aside>

        <section className="relative min-w-0 overflow-y-auto bg-[#080a0f] px-4 py-6 sm:px-8 lg:px-10">
          <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-3/4 -translate-x-1/2 rounded-full bg-[#7457ff]/[.07] blur-[100px]" />
          <div className="relative mx-auto mb-4 flex max-w-4xl rounded-[10px] border border-white/[.075] bg-white/[.035] p-1 sm:hidden">
            <button aria-pressed={mode === 'edit'} onClick={() => setMode('edit')} className={`flex-1 rounded-[7px] px-3 py-2 text-xs font-medium transition ${mode === 'edit' ? 'bg-white/[.1] text-white' : 'text-white/38'}`}>编辑步骤</button>
            <button aria-pressed={mode === 'preview'} onClick={() => setMode('preview')} className={`flex-1 rounded-[7px] px-3 py-2 text-xs font-medium transition ${mode === 'preview' ? 'bg-white/[.1] text-white' : 'text-white/38'}`}>成稿预览</button>
          </div>
          {mode === 'edit' ? (
            <div className="relative mx-auto max-w-4xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge className="h-6 border-white/[.08] bg-white/[.04] font-mono text-[9px] text-white/52" variant="outline">STEP {String(selectedIndex + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</Badge>
                  <Badge className="h-6 border-[#63ddc5]/15 bg-[#63ddc5]/[.07] text-[10px] text-[#72dfca]" variant="outline"><CheckCircle2 data-icon="inline-start" /> {selectedStep.confidence}% MATCH</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button className="border-white/[.08] bg-white/[.035] text-white/60 hover:bg-white/[.08]" size="icon-sm" variant="outline" aria-label="上移步骤" disabled={selectedIndex === 0} onClick={() => moveStep(selectedStep.id, -1)}><ArrowUp /></Button>
                  <Button className="border-white/[.08] bg-white/[.035] text-white/60 hover:bg-white/[.08]" size="icon-sm" variant="outline" aria-label="下移步骤" disabled={selectedIndex === steps.length - 1} onClick={() => moveStep(selectedStep.id, 1)}><ArrowDown /></Button>
                  <Button className="border-white/[.08] bg-white/[.035] text-white/60 hover:bg-white/[.08] hover:text-white" variant="outline" size="sm" onClick={() => updateStep(selectedStep.id, { included: !selectedStep.included })}>
                    {selectedStep.included ? <><EyeOff data-icon="inline-start" /> 从成稿隐藏</> : <><Eye data-icon="inline-start" /> 恢复步骤</>}
                  </Button>
                </div>
              </div>

              <article className={`overflow-hidden rounded-[20px] border border-white/[.09] bg-[#10131a] shadow-[0_30px_90px_rgba(0,0,0,.34)] transition ${selectedStep.included ? '' : 'opacity-55'}`}>
                <div className="relative border-b border-white/[.07] bg-[#0b0d12] p-2 sm:p-3">
                  <img src={selectedStep.image} alt={selectedStep.title} className="aspect-[16/9] w-full rounded-[13px] bg-white object-contain" />
                  <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-[9px] border border-white/[.08] bg-[#090b11]/88 px-3 py-2 font-mono text-[10px] text-white/70 shadow-xl backdrop-blur-xl">
                    <Video className="size-3 text-[#68dfca]" /> SOURCE {selectedStep.time}
                  </div>
                  <Button className="absolute right-5 top-5 border-white/[.1] bg-[#0b0e14]/85 text-white/75 backdrop-blur hover:bg-[#141824] hover:text-white" variant="outline" size="sm" onClick={() => showNotice('Demo 中已使用最佳候选截图')}>
                    <ImageIcon data-icon="inline-start" /> 替换截图
                  </Button>
                </div>

                <div className="space-y-5 p-5 sm:p-7">
                  <div>
                    <label htmlFor="step-title" className="mb-2 block text-[10px] font-medium uppercase tracking-[.14em] text-white/30">步骤标题</label>
                    <Input id="step-title" value={selectedStep.title} onChange={(event) => updateStep(selectedStep.id, { title: event.target.value })} className="h-12 border border-white/[.07] bg-white/[.035] px-4 text-base font-medium text-white shadow-none focus-visible:ring-[#8065ff]/25" />
                  </div>
                  <div>
                    <label htmlFor="step-body" className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-[.14em] text-white/30">
                      <span>操作说明</span>
                      <button type="button" className="flex items-center gap-1 normal-case tracking-normal text-[#9c8aff] transition hover:text-[#b5a8ff]" onClick={polishSelectedStep}><WandSparkles className="size-3" /> AI 润色</button>
                    </label>
                    <Textarea id="step-body" value={selectedStep.body} onChange={(event) => updateStep(selectedStep.id, { body: event.target.value })} className="min-h-28 resize-none border border-white/[.07] bg-white/[.035] px-4 py-3 text-[13px] leading-7 text-white/75 shadow-none focus-visible:ring-[#8065ff]/25" />
                  </div>
                  <div className="flex items-start gap-3 rounded-[13px] border border-[#866fff]/15 bg-[#8065ff]/[.065] p-4 text-xs leading-6 text-white/58">
                    <Sparkles className="mt-1 size-3.5 shrink-0 text-[#9e8cff]" />
                    <p><strong className="font-medium text-white/80">AI 建议</strong> · 当前说明与画面一致。发布前建议确认界面名称是否仍与最新版本相同。</p>
                  </div>
                </div>
              </article>

              <div className="mt-5 flex items-center justify-between">
                <Button className="border-white/[.08] bg-white/[.03] text-white/55 hover:bg-white/[.07] hover:text-white" variant="outline" disabled={selectedIndex === 0} onClick={() => setSelectedId(steps[selectedIndex - 1].id)}><ChevronLeft data-icon="inline-start" /> 上一步</Button>
                <Button className="border-white/[.08] bg-white/[.03] text-white/55 hover:bg-white/[.07] hover:text-white" variant="outline" disabled={selectedIndex === steps.length - 1} onClick={() => setSelectedId(steps[selectedIndex + 1].id)}>下一步 <ChevronRight data-icon="inline-end" /></Button>
              </div>
            </div>
          ) : (
            <article className="relative mx-auto max-w-3xl overflow-hidden rounded-[20px] border border-white/[.08] bg-[#fbfbfd] px-5 py-9 text-[#14161d] shadow-[0_35px_110px_rgba(0,0,0,.38)] sm:px-12 sm:py-12">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#7657ff] via-[#8b72ff] to-[#55d7ea]" />
              <div className="mb-7 flex items-center justify-between">
                <Badge className="h-6 border-[#7657ff]/10 bg-[#7657ff]/[.07] px-2.5 text-[9px] font-medium uppercase tracking-[.12em] text-[#6548e8]" variant="outline">AI Generated</Badge>
                <span className="font-mono text-[9px] uppercase tracking-[.12em] text-[#14161d]/30">10 steps · 02:41</span>
              </div>
              <Input aria-label="教程标题" value={title} onChange={(event) => setTitle(event.target.value)} className="h-auto border-0 bg-transparent p-0 font-heading text-3xl font-semibold leading-tight tracking-[-.045em] text-[#101219] shadow-none focus-visible:ring-0 sm:text-4xl" />
              <Textarea aria-label="教程摘要" value={summary} onChange={(event) => setSummary(event.target.value)} className="mt-5 min-h-20 resize-none rounded-[12px] border border-black/[.04] bg-[#f2f3f7] px-4 py-3 text-sm leading-7 text-[#343844] shadow-none focus-visible:ring-[#7657ff]/15" />
              <div className="mt-10 space-y-12">
                {includedSteps.map((step, index) => (
                  <section key={step.id}>
                    <div className="mb-4 flex items-center gap-3">
                      <span className="grid size-8 place-items-center rounded-[9px] bg-gradient-to-br from-[#7657ff] to-[#55cfe5] font-mono text-[10px] font-semibold text-white">{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <h2 className="text-lg font-semibold tracking-[-.02em] text-[#14161d]">{step.title}</h2>
                        <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[.08em] text-[#14161d]/35">Video time · {step.time}</p>
                      </div>
                    </div>
                    <p className="mb-5 text-[15px] leading-7 text-[#343844]">{step.body}</p>
                    <img src={step.image} alt={step.title} className="w-full rounded-[12px] border border-black/[.07] bg-[#f2f3f7] object-contain shadow-[0_14px_34px_rgba(12,16,28,.08)]" />
                  </section>
                ))}
              </div>
              <div className="mt-12 rounded-[14px] bg-[#11141c] p-5 text-white">
                <div className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-[#67dfca] shadow-[0_0_9px_#67dfca]" /><p className="text-sm font-medium">教程已整理完成</p></div>
                <p className="mt-2 text-xs leading-6 text-white/48">共 {includedSteps.length} 个步骤。界面名称和功能以录屏版本为准，正式发布前请人工核对。</p>
              </div>
            </article>
          )}
        </section>

        <aside className="border-t border-white/[.07] bg-[#0b0e14] p-4 lg:overflow-y-auto lg:border-l lg:border-t-0">
          <div className="flex items-end justify-between">
            <div><p className="text-[13px] font-medium text-white/88">发布检查</p><p className="mt-1 text-[10px] uppercase tracking-[.1em] text-white/25">Publish readiness</p></div>
            <span className="font-mono text-xs font-medium text-[#6fe0cb]">{publishScore}<span className="text-white/22"> / 100</span></span>
          </div>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-gradient-to-r from-[#7657ff] to-[#62ddcc] transition-all" style={{ width: `${publishScore}%` }} /></div>

          <div className="mt-6 space-y-1.5">
            {[
              ['步骤完整', `${includedSteps.length} 个步骤`, true],
              ['时间可回溯', '10 / 10', true],
              ['画面清晰', '10 / 10', true],
              ['隐私确认', privacyConfirmed ? '人工确认完成' : '2 处待确认', privacyConfirmed],
            ].map(([label, value, passed]) => (
              <div key={String(label)} className="flex items-center gap-3 rounded-[11px] border border-white/[.055] bg-white/[.025] p-3">
                <span className={`grid size-7 place-items-center rounded-[8px] ${passed ? 'bg-[#64ddc6]/[.08] text-[#6fe2cc]' : 'bg-amber-400/[.08] text-amber-300'}`}>
                  {passed ? <Check className="size-3.5" /> : <LockKeyhole className="size-3.5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-white/70">{label}</p>
                  <p className="mt-0.5 text-[10px] text-white/25">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[13px] border border-amber-300/10 bg-amber-300/[.045] p-4">
            <div className="flex items-center gap-2 text-amber-200/85"><ShieldCheck className="size-3.5" /><p className="text-[11px] font-medium">隐私提示</p></div>
            <p className="mt-2 text-[11px] leading-5 text-amber-100/40">系统已裁剪浏览器标签与个人文件区域，但发布前仍需人工逐张确认。</p>
            <Button
              className="mt-3 w-full border-amber-200/10 bg-white/[.04] text-amber-100/70 hover:bg-white/[.08] hover:text-amber-100"
              variant="outline"
              size="sm"
              disabled={privacyConfirmed}
              onClick={() => { setPrivacyConfirmed(true); showNotice('隐私检查已完成人工确认'); }}
            >
              {privacyConfirmed ? <><Check data-icon="inline-start" /> 已人工确认</> : '标记为已确认'}
            </Button>
          </div>

          <div className="mt-6">
            <p className="text-[10px] font-medium uppercase tracking-[.12em] text-white/25">Export as</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button onClick={downloadMarkdown} className="rounded-[12px] border border-[#8065ff]/20 bg-[#8065ff]/[.07] p-3 text-left transition hover:bg-[#8065ff]/[.12]"><FileText className="size-3.5 text-[#9f8dff]" /><p className="mt-2 text-[11px] font-medium text-white/75">Markdown</p><p className="mt-0.5 text-[9px] text-white/25">图片引用本站</p></button>
              <button onClick={() => showNotice('公众号格式将在产品版开放')} className="rounded-[12px] border border-white/[.06] bg-white/[.025] p-3 text-left transition hover:bg-white/[.05]"><Sparkles className="size-3.5 text-[#5fd8e9]" /><p className="mt-2 text-[11px] font-medium text-white/75">公众号</p><p className="mt-0.5 text-[9px] text-white/25">Demo 预览</p></button>
            </div>
          </div>

          <Button className="mt-6 w-full text-white/35 hover:bg-white/[.04] hover:text-white/65" variant="ghost" onClick={onReset}><RotateCcw data-icon="inline-start" /> 重新体验 Demo</Button>
        </aside>
      </div>

      {notice && (
        <div role="status" className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-[#141822]/95 px-4 py-2.5 text-xs font-medium text-white shadow-2xl backdrop-blur-xl">
          <CheckCircle2 className="size-3.5 text-[#6fe1cc]" /> {notice}
        </div>
      )}
    </main>
  );
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>('upload');

  useEffect(() => {
    if (phase !== 'processing') return;
    const timer = window.setTimeout(() => setPhase('editor'), 5050);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === 'processing') {
    return <ProcessingView onCancel={() => setPhase('upload')} />;
  }
  if (phase === 'editor') {
    return <EditorView onReset={() => setPhase('upload')} />;
  }
  return <UploadView onStart={() => setPhase('processing')} />;
}
