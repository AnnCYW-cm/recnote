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
      <span className={`${compact ? 'size-8 rounded-[11px]' : 'size-9 rounded-xl'} grid place-items-center bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(255,92,53,.24)]`}>
        <Play className="size-3.5 fill-current" />
      </span>
      <div className="leading-none">
        <strong className="font-heading text-lg tracking-[-.04em]">录见</strong>
        {!compact && (
          <span className="ml-2 text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Recnote</span>
        )}
      </div>
    </div>
  );
}

function UploadView({ onStart }: { onStart: (fileName?: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);

  const acceptFile = (file?: File) => {
    if (!file) return;
    setFileName(file.name);
  };

  const handleDrop = (event: ReactDragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="border-b border-foreground/10 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-8">
          <Brand />
          <Badge className="border-primary/20 bg-primary/10 text-primary" variant="outline">
            公众号 Demo
          </Badge>
        </div>
      </header>

      <section className="relative mx-auto grid min-h-[calc(100vh-64px)] max-w-[1440px] items-center gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[.86fr_1.14fr] lg:py-16">
        <div className="pointer-events-none absolute -left-32 top-28 size-72 rounded-full bg-accent/35 blur-3xl" />
        <div className="relative z-10 max-w-xl">
          <Badge className="mb-6 bg-secondary text-secondary-foreground" variant="secondary">
            <Sparkles data-icon="inline-start" /> AI 录屏教程生成器
          </Badge>
          <h1 className="font-heading text-[clamp(3.3rem,7vw,6.4rem)] leading-[.89] font-semibold tracking-[-.075em]">
            录一遍
            <br />
            <span className="text-primary">教程自己长出来</span>
          </h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-muted-foreground">
            上传一段操作录屏，自动提取关键画面、整理步骤，几分钟得到一篇可编辑、可发布的图文教程。
          </p>

          <div className="mt-9 rounded-[28px] border border-foreground/10 bg-card p-3 shadow-[0_24px_80px_rgba(23,32,29,.1)]">
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
              className={`group flex w-full items-center gap-4 rounded-[20px] border border-dashed p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${dragging ? 'border-primary bg-primary/[.07]' : 'border-foreground/15 bg-muted/55 hover:border-primary/50 hover:bg-primary/[.04]'}`}
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-foreground text-background transition group-hover:-translate-y-0.5">
                <UploadCloud className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{fileName || '选择或拖入一段录屏'}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {fileName ? '文件已在浏览器中选择，未上传' : 'MOV / MP4 · 演示模式不上传文件'}
                </span>
              </span>
              {fileName ? (
                <CheckCircle2 className="mr-2 size-5 text-emerald-700" />
              ) : (
                <ArrowRight className="mr-2 size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
              )}
            </button>
            <Button
              className="mt-3 h-11 w-full rounded-2xl text-[15px]"
              size="lg"
              onClick={() => onStart(fileName)}
            >
              <Sparkles data-icon="inline-start" />
              {fileName ? '以示例结果继续体验' : '用示例录屏体验完整流程'}
            </Button>
            {fileName && (
              <p className="px-2 pt-3 text-center text-xs leading-5 text-muted-foreground">
                当前是前端 Demo，将使用内置示例结果演示后续流程，不会处理或上传你选择的视频。
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-700" /> 本地优先，隐私可控</span>
            <span className="flex items-center gap-2"><FileText className="size-4 text-emerald-700" /> 支持 Markdown 导出</span>
          </div>
        </div>

        <div className="relative z-10 lg:pl-6">
          <div className="absolute -right-20 -top-16 size-52 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative overflow-hidden rounded-[34px] border border-foreground/10 bg-[#17201d] p-3 shadow-[0_35px_100px_rgba(23,32,29,.22)] sm:p-5">
            <div className="flex items-center justify-between px-2 pb-4 pt-1 text-white">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.14em] text-white/45">示例结果</p>
                <p className="mt-1 font-semibold">ChatGPT Work 功能入口导览</p>
              </div>
              <Badge className="border-white/10 bg-white/10 text-white" variant="outline">已生成</Badge>
            </div>
            <div className="relative overflow-hidden rounded-[24px] bg-white">
              <img
                src="/demo/step-06-plugins.jpg"
                alt="自动生成教程中的插件页面步骤截图"
                className="aspect-[16/9] w-full object-cover object-top"
              />
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 rounded-2xl border border-black/5 bg-white/95 p-3 shadow-xl backdrop-blur">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary text-xs font-bold text-white">06</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">打开 Plugins 插件页</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">系统已匹配截图、时间戳和操作说明</p>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,.12)]" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-3 text-white">
              {[
                ['02:41', '原始录屏'],
                ['44 → 10', '关键步骤'],
                ['≈ 1 min', '生成初稿'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-white/[.06] px-3 py-3 text-center">
                  <p className="font-heading text-lg font-semibold tracking-tight">{value}</p>
                  <p className="mt-0.5 text-[11px] text-white/45">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-2xl border border-foreground/10 bg-[#efffd0] px-4 py-3 shadow-xl sm:flex">
            <Video className="size-5 text-emerald-800" />
            <div>
              <p className="text-xs text-emerald-900/60">识别状态</p>
              <p className="text-sm font-semibold text-emerald-950">10 个步骤全部可回溯</p>
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
    <main className="min-h-screen bg-[#17201d] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Brand />
          <Button className="text-white hover:bg-white/10" variant="ghost" onClick={onCancel}>
            取消分析
          </Button>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl items-center gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <Badge className="border-white/10 bg-white/10 text-white" variant="outline">
            <CloudOff data-icon="inline-start" /> 本地演示任务
          </Badge>
          <h1 className="mt-6 font-heading text-4xl font-semibold tracking-[-.055em] sm:text-5xl">
            正在把录屏整理成教程
          </h1>
          <p className="mt-4 max-w-md leading-7 text-white/55">
            我们会先保留更多候选，再筛掉重复、加载和无教学价值的画面，避免漏掉关键步骤。
          </p>

          <div className="mt-9 rounded-[28px] border border-white/10 bg-white/[.055] p-5">
            <Progress value={progress} className="[&_[data-slot=progress-indicator]]:bg-[#e9ff70] [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-white/10">
              <ProgressLabel className="text-white">分析进度</ProgressLabel>
              <ProgressValue className="text-white/60">{progress}%</ProgressValue>
            </Progress>
            <div className="mt-6 space-y-2">
              {PROCESSING_STAGES.map((stage, index) => {
                const completed = progress >= stage.at;
                const active = !completed && (index === 0 || progress >= PROCESSING_STAGES[index - 1].at);
                return (
                  <div
                    key={stage.label}
                    className={`flex items-center gap-4 rounded-2xl px-3 py-3 transition ${active ? 'bg-white/[.07]' : ''}`}
                  >
                    <span className={`grid size-8 shrink-0 place-items-center rounded-full border ${completed ? 'border-[#e9ff70]/30 bg-[#e9ff70] text-[#17201d]' : active ? 'border-white/20 bg-white/10' : 'border-white/10 text-white/25'}`}>
                      {completed ? <Check className="size-4" /> : active ? <LoaderCircle className="size-4 animate-spin" /> : <span className="size-1.5 rounded-full bg-current" />}
                    </span>
                    <div>
                      <p className={`text-sm font-medium ${completed || active ? 'text-white' : 'text-white/30'}`}>{stage.label}</p>
                      <p className={`mt-0.5 text-xs ${completed || active ? 'text-white/45' : 'text-white/20'}`}>{stage.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute inset-12 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative rotate-[1.5deg] overflow-hidden rounded-[30px] border border-white/10 bg-[#f7f5ef] p-3 shadow-2xl">
            <img src="/demo/step-07-plugin-categories.jpg" alt="正在分析的示例录屏画面" className="aspect-[16/10] w-full rounded-[20px] object-cover object-top" />
            <div className="absolute left-[16%] top-[28%] size-12 rounded-full border-2 border-primary bg-primary/15 shadow-[0_0_0_9px_rgba(255,92,53,.12)]" />
            <div className="absolute bottom-7 left-7 right-7 flex items-center justify-between rounded-2xl border border-black/5 bg-white/95 px-4 py-3 text-[#17201d] shadow-xl backdrop-blur">
              <span className="flex items-center gap-2 text-sm font-semibold"><Scissors className="size-4 text-primary" /> 候选画面 28 / 44</span>
              <span className="font-mono text-xs text-black/45">01:37.000</span>
            </div>
          </div>
          <div className="absolute -bottom-5 -right-3 -rotate-2 rounded-2xl bg-[#e9ff70] px-4 py-3 text-[#17201d] shadow-xl">
            <p className="text-xs opacity-55">AI 判断</p>
            <p className="text-sm font-bold">保留：插件分类发生变化</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function buildMarkdown(title: string, summary: string, steps: TutorialStep[]) {
  const body = steps
    .filter((step) => step.included)
    .map(
      (step, index) =>
        `## ${index + 1}. ${step.title}\n\n**视频时间：${step.time}**\n\n${step.body}\n\n![${step.title}](${step.image})`,
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
    await navigator.clipboard.writeText(buildMarkdown(title, summary, steps));
    showNotice('Markdown 已复制');
  };

  const downloadMarkdown = () => {
    const blob = new Blob([buildMarkdown(title, summary, steps)], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'ChatGPT-Work-功能入口导览.md';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
    showNotice('教程已导出');
  };

  const selectedIndex = steps.findIndex((step) => step.id === selectedId);

  return (
    <main className="min-h-screen bg-[#efede7] text-foreground lg:h-screen lg:overflow-hidden">
      <header className="sticky top-0 z-30 border-b border-foreground/10 bg-[#f8f6f1]/95 backdrop-blur-xl lg:static">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-5">
          <Brand compact />
          <div className="mx-2 hidden h-6 w-px bg-foreground/10 sm:block" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">ChatGPT Work 功能入口导览</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">已保存 · Demo 示例数据</p>
          </div>
          <div className="hidden rounded-xl bg-muted p-1 sm:flex">
            <button onClick={() => setMode('edit')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${mode === 'edit' ? 'bg-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>编辑</button>
            <button onClick={() => setMode('preview')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${mode === 'preview' ? 'bg-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>成稿预览</button>
          </div>
          <Button variant="outline" className="hidden sm:inline-flex" onClick={copyMarkdown}><Clipboard data-icon="inline-start" /> 复制</Button>
          <Button onClick={downloadMarkdown}><Download data-icon="inline-start" /> 导出 Markdown</Button>
        </div>
      </header>

      <div className="grid lg:h-[calc(100vh-64px)] lg:grid-cols-[290px_minmax(0,1fr)_280px]">
        <aside className="border-b border-foreground/10 bg-[#f8f6f1] lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between p-4 pb-3">
            <div>
              <p className="text-sm font-semibold">教程步骤</p>
              <p className="mt-1 text-xs text-muted-foreground">44 个候选压缩为 {includedSteps.length} 步</p>
            </div>
            <Badge className="bg-[#e9ff70] text-[#294212]" variant="secondary">AI 初稿</Badge>
          </div>
          <div className="flex gap-2 overflow-x-auto px-3 pb-4 lg:block lg:space-y-1.5 lg:overflow-visible">
            {steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => { setSelectedId(step.id); setMode('edit'); }}
                className={`group flex min-w-[250px] items-center gap-3 rounded-2xl border p-2.5 text-left transition lg:min-w-0 lg:w-full ${selectedId === step.id && mode === 'edit' ? 'border-primary/25 bg-primary/[.08] shadow-sm' : 'border-transparent hover:border-foreground/10 hover:bg-white/70'} ${step.included ? '' : 'opacity-45'}`}
              >
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <img src={step.image} alt="" className="h-full w-full object-cover object-top" />
                  <span className="absolute left-1 top-1 grid size-5 place-items-center rounded-md bg-[#17201d]/90 text-[9px] font-bold text-white">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{step.title}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground"><Video className="size-3" /> {step.time} · {step.confidence}%</p>
                </div>
                {step.included ? <Eye className="size-3.5 text-muted-foreground/50" /> : <EyeOff className="size-3.5" />}
              </button>
            ))}
          </div>
        </aside>

        <section className="min-w-0 overflow-y-auto bg-[#efede7] px-4 py-6 sm:px-8 lg:px-10">
          {mode === 'edit' ? (
            <div className="mx-auto max-w-4xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-white text-foreground" variant="outline">步骤 {selectedIndex + 1} / {steps.length}</Badge>
                  <Badge className="border-emerald-700/15 bg-emerald-50 text-emerald-800" variant="outline"><CheckCircle2 data-icon="inline-start" /> 高置信度 {selectedStep.confidence}%</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon-sm" variant="outline" aria-label="上移步骤" disabled={selectedIndex === 0} onClick={() => moveStep(selectedStep.id, -1)}><ArrowUp /></Button>
                  <Button size="icon-sm" variant="outline" aria-label="下移步骤" disabled={selectedIndex === steps.length - 1} onClick={() => moveStep(selectedStep.id, 1)}><ArrowDown /></Button>
                  <Button variant="outline" size="sm" onClick={() => updateStep(selectedStep.id, { included: !selectedStep.included })}>
                    {selectedStep.included ? <><EyeOff data-icon="inline-start" /> 从成稿隐藏</> : <><Eye data-icon="inline-start" /> 恢复步骤</>}
                  </Button>
                </div>
              </div>

              <article className={`overflow-hidden rounded-[28px] border border-foreground/10 bg-card shadow-[0_20px_70px_rgba(23,32,29,.08)] transition ${selectedStep.included ? '' : 'opacity-55'}`}>
                <div className="relative bg-[#17201d] p-2 sm:p-3">
                  <img src={selectedStep.image} alt={selectedStep.title} className="aspect-[16/9] w-full rounded-[20px] bg-white object-contain" />
                  <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-xl bg-[#17201d]/90 px-3 py-2 text-xs text-white shadow-lg backdrop-blur">
                    <Video className="size-3.5 text-[#e9ff70]" /> 来源时间 {selectedStep.time}
                  </div>
                  <Button className="absolute right-5 top-5 border-white/10 bg-white/90 text-[#17201d] hover:bg-white" variant="outline" size="sm" onClick={() => showNotice('Demo 中已使用最佳候选截图')}>
                    <ImageIcon data-icon="inline-start" /> 替换截图
                  </Button>
                </div>

                <div className="space-y-5 p-5 sm:p-7">
                  <div>
                    <label htmlFor="step-title" className="mb-2 block text-xs font-semibold text-muted-foreground">步骤标题</label>
                    <Input id="step-title" value={selectedStep.title} onChange={(event) => updateStep(selectedStep.id, { title: event.target.value })} className="h-12 border-0 bg-muted/70 px-4 text-lg font-semibold shadow-none focus-visible:ring-primary/20" />
                  </div>
                  <div>
                    <label htmlFor="step-body" className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                      <span>操作说明</span>
                      <button type="button" className="flex items-center gap-1 text-primary hover:underline" onClick={() => showNotice('AI 已重新润色当前步骤')}><WandSparkles className="size-3" /> AI 润色</button>
                    </label>
                    <Textarea id="step-body" value={selectedStep.body} onChange={(event) => updateStep(selectedStep.id, { body: event.target.value })} className="min-h-28 resize-none border-0 bg-muted/70 px-4 py-3 leading-7 shadow-none focus-visible:ring-primary/20" />
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-[#dcefa7] bg-[#f6ffdc] p-4 text-sm text-[#294212]">
                    <Sparkles className="mt-0.5 size-4 shrink-0" />
                    <p><strong>AI 建议：</strong>当前说明与画面一致。发布前建议确认界面名称是否仍与最新版本相同。</p>
                  </div>
                </div>
              </article>

              <div className="mt-5 flex items-center justify-between">
                <Button variant="outline" disabled={selectedIndex === 0} onClick={() => setSelectedId(steps[selectedIndex - 1].id)}><ChevronLeft data-icon="inline-start" /> 上一步</Button>
                <Button variant="outline" disabled={selectedIndex === steps.length - 1} onClick={() => setSelectedId(steps[selectedIndex + 1].id)}>下一步 <ChevronRight data-icon="inline-end" /></Button>
              </div>
            </div>
          ) : (
            <article className="mx-auto max-w-3xl rounded-[28px] border border-foreground/10 bg-white px-5 py-9 shadow-[0_20px_70px_rgba(23,32,29,.08)] sm:px-12 sm:py-12">
              <Badge className="mb-6 bg-secondary text-secondary-foreground" variant="secondary">AI 生成 · 待人工校对</Badge>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} className="h-auto border-0 p-0 font-heading text-3xl font-semibold tracking-[-.045em] shadow-none focus-visible:ring-0 sm:text-4xl" />
              <Textarea value={summary} onChange={(event) => setSummary(event.target.value)} className="mt-5 min-h-20 resize-none border-0 bg-muted/65 px-4 py-3 leading-7 shadow-none focus-visible:ring-primary/20" />
              <div className="mt-10 space-y-12">
                {includedSteps.map((step, index) => (
                  <section key={step.id}>
                    <div className="mb-4 flex items-center gap-3">
                      <span className="grid size-8 place-items-center rounded-xl bg-primary text-xs font-bold text-white">{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <h2 className="text-xl font-semibold tracking-tight">{step.title}</h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">视频时间 {step.time}</p>
                      </div>
                    </div>
                    <p className="mb-5 leading-7 text-foreground/75">{step.body}</p>
                    <img src={step.image} alt={step.title} className="w-full rounded-2xl border border-foreground/10 bg-muted object-contain" />
                  </section>
                ))}
              </div>
              <div className="mt-12 rounded-2xl bg-[#17201d] p-5 text-white">
                <p className="font-semibold">教程已整理完成</p>
                <p className="mt-1 text-sm leading-6 text-white/55">共 {includedSteps.length} 个步骤。界面名称和功能以录屏版本为准，正式发布前请人工核对。</p>
              </div>
            </article>
          )}
        </section>

        <aside className="border-t border-foreground/10 bg-[#f8f6f1] p-4 lg:overflow-y-auto lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">发布检查</p>
            <span className="font-mono text-xs font-semibold text-emerald-700">92 / 100</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full w-[92%] rounded-full bg-emerald-600" /></div>

          <div className="mt-6 space-y-2">
            {[
              ['步骤完整', `${includedSteps.length} 个步骤`, true],
              ['时间可回溯', '10 / 10', true],
              ['画面清晰', '10 / 10', true],
              ['隐私确认', '2 处待确认', false],
            ].map(([label, value, passed]) => (
              <div key={String(label)} className="flex items-center gap-3 rounded-2xl border border-foreground/[.07] bg-white/75 p-3">
                <span className={`grid size-7 place-items-center rounded-full ${passed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {passed ? <Check className="size-3.5" /> : <LockKeyhole className="size-3.5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">{label}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-amber-900"><ShieldCheck className="size-4" /><p className="text-xs font-semibold">隐私提示</p></div>
            <p className="mt-2 text-xs leading-5 text-amber-900/65">系统已裁剪浏览器标签与个人文件区域，但发布前仍需人工逐张确认。</p>
            <Button className="mt-3 w-full border-amber-200 bg-white text-amber-900 hover:bg-amber-100" variant="outline" size="sm" onClick={() => showNotice('已标记为人工确认')}>标记为已确认</Button>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold text-muted-foreground">导出格式</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button onClick={downloadMarkdown} className="rounded-2xl border border-primary/25 bg-primary/[.07] p-3 text-left transition hover:bg-primary/[.12]"><FileText className="size-4 text-primary" /><p className="mt-2 text-xs font-semibold">Markdown</p><p className="mt-0.5 text-[10px] text-muted-foreground">可立即导出</p></button>
              <button onClick={() => showNotice('公众号格式将在产品版开放')} className="rounded-2xl border border-foreground/10 bg-white/75 p-3 text-left transition hover:bg-white"><Sparkles className="size-4" /><p className="mt-2 text-xs font-semibold">公众号</p><p className="mt-0.5 text-[10px] text-muted-foreground">Demo 预览</p></button>
            </div>
          </div>

          <Button className="mt-6 w-full" variant="ghost" onClick={onReset}><RotateCcw data-icon="inline-start" /> 重新体验 Demo</Button>
        </aside>
      </div>

      {notice && (
        <div role="status" className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#17201d] px-4 py-2.5 text-sm font-medium text-white shadow-2xl">
          <CheckCircle2 className="size-4 text-[#e9ff70]" /> {notice}
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
