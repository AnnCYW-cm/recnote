'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
} from 'react';
import {
  Archive,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clipboard,
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
import Image from 'next/image';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  buildMarkdown,
  buildWechatHtml,
  createTutorialZip,
  downloadBlob,
  safeBasename,
  writeRichClipboard,
} from '@/lib/tutorial-export';
import {
  analyzeVideo,
  formatVideoTimestamp,
  validateVideoFile,
  type VideoAnalysisProgress,
  type VideoAnalysisResult,
} from '@/lib/video-analysis';

type Phase = 'upload' | 'processing' | 'editor';
type EditorMode = 'edit' | 'preview';

type TutorialStep = {
  id: number;
  time: string;
  title: string;
  body: string;
  image: string;
  imageHeight: number;
  included: boolean;
  confidence: number;
};

type NoticeState = {
  message: string;
  tone: 'success' | 'warning' | 'error';
};

type StoredDraft = {
  version: number;
  steps: Array<Pick<TutorialStep, 'id' | 'title' | 'body' | 'included'>>;
  selectedId: number;
  mode: EditorMode;
  title: string;
  summary: string;
  articleCopyEdited: boolean;
  articleCopyReviewed: boolean;
  editedStepIds: number[];
  reviewedStepIds: number[];
  privacyReviewedIds: number[];
};

type EditorSource =
  | { kind: 'demo' }
  | {
      kind: 'local';
      fileName: string;
      duration: number;
      width: number;
      height: number;
      sampleCount: number;
      steps: TutorialStep[];
    };

const PUBLIC_SITE_ORIGIN =
  'https://lujian-video-guide-demo.caiyiwenann.chatgpt.site';
const DRAFT_STORAGE_KEY = 'recnote-demo-draft-v5-muwa-board';
const DRAFT_VERSION = 2;
const LOCAL_STEP_PLACEHOLDER =
  '请根据截图补充这一时刻的操作、目的和结果。当前文字是待人工完善的占位说明。';

function fileSizeLabel(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

function videoBaseName(fileName: string) {
  return safeBasename(fileName.replace(/\.(mov|mp4|webm)$/i, '')).slice(0, 36);
}

function localEditorSource(result: VideoAnalysisResult): EditorSource {
  return {
    kind: 'local',
    fileName: result.fileName,
    duration: result.duration,
    width: result.width,
    height: result.height,
    sampleCount: result.sampleCount,
    steps: result.frames.map((frame, index) => ({
      id: frame.id,
      time: frame.time,
      title: `关键画面 ${String(index + 1).padStart(2, '0')}`,
      body: LOCAL_STEP_PLACEHOLDER,
      image: frame.image,
      imageHeight: frame.imageHeight,
      included: true,
      confidence: Math.round(60 + Math.min(1, frame.score * 3) * 39),
    })),
  };
}

function clearStoredDraft() {
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

const INITIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    time: '00:01',
    title: '查看公众号发布看板',
    body: '打开「木瓦任务板」的公众号发布项目，先确认待处理、进行中和已完成三列，以及当前任务数量和本周进度。',
    image: '/cases/muwa-board/01-board.jpg',
    imageHeight: 1000,
    included: true,
    confidence: 99,
  },
  {
    id: 2,
    time: '00:03',
    title: '打开新建任务窗口',
    body: '点击右上角「新建任务」，打开任务创建窗口，为这次发布补一项交付前检查。',
    image: '/cases/muwa-board/02-dialog.jpg',
    imageHeight: 1000,
    included: true,
    confidence: 98,
  },
  {
    id: 3,
    time: '00:05',
    title: '填写任务信息',
    body: '输入“检查交付清单”和交付要求，保留高优先级并确认计划完成日期。',
    image: '/cases/muwa-board/03-filled.jpg',
    imageHeight: 1000,
    included: true,
    confidence: 97,
  },
  {
    id: 4,
    time: '00:07',
    title: '创建任务并打开详情',
    body: '点击「创建任务」。新任务会进入待处理列，并自动打开右侧任务详情面板。',
    image: '/cases/muwa-board/04-created.jpg',
    imageHeight: 1000,
    included: true,
    confidence: 99,
  },
  {
    id: 5,
    time: '00:10',
    title: '推进任务并完成检查',
    body: '把状态切换为「进行中」，再逐项核对账号、姓名、图片和文件路径。看板与清单进度会同步更新。',
    image: '/cases/muwa-board/05-progress.jpg',
    imageHeight: 1000,
    included: true,
    confidence: 96,
  },
  {
    id: 6,
    time: '00:14',
    title: '完成任务并归档',
    body: '点击「标记为完成」，任务会移动到已完成列，整轮公众号发布检查形成闭环。',
    image: '/cases/muwa-board/07-completed-board.jpg',
    imageHeight: 1000,
    included: true,
    confidence: 99,
  },
];

const PROCESSING_STAGES = [
  { at: 14, label: '载入自有案例', detail: '00:18 · 1440 × 900 · 无音频' },
  {
    at: 34,
    label: '回放候选信号',
    detail: '4 个场景信号 · 6 个周期信号',
  },
  { at: 58, label: '筛选候选画面', detail: '合并与去重后保留 7 张' },
  {
    at: 78,
    label: '模拟语义整理界面',
    detail: 'V0.1 尚未接入语义模型',
  },
  { at: 96, label: '载入预设教程初稿', detail: '展示 6 个自有案例步骤' },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`${compact ? 'size-8 rounded-[10px]' : 'size-9 rounded-[11px]'} grid place-items-center bg-gradient-to-br from-[#8b6cff] via-[#7657ff] to-[#4fdcff] text-white shadow-[0_10px_32px_rgba(118,87,255,.36)]`}
      >
        <Play className="size-3.5 fill-current" />
      </span>
      <div className="leading-none">
        <strong className="font-heading text-lg font-semibold tracking-[-.045em]">
          录见
        </strong>
        {!compact && (
          <span className="ml-2 text-[10px] font-medium uppercase tracking-[.24em] text-white/50">
            Recnote
          </span>
        )}
      </div>
    </div>
  );
}

function UploadView({
  onStart,
  onResume,
}: {
  onStart: (file?: File) => void;
  onResume: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState('');
  const [hasDraft, setHasDraft] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const draft = JSON.parse(
          window.localStorage.getItem(DRAFT_STORAGE_KEY) ?? 'null',
        ) as Partial<StoredDraft> | null;
        setHasDraft(draft?.version === DRAFT_VERSION);
      } catch {
        clearStoredDraft();
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const acceptFile = (file?: File) => {
    if (!file) return;
    const validationError = validateVideoFile(file);
    if (validationError) {
      setSelectedFile(null);
      setFileError(validationError);
      return;
    }
    setSelectedFile(file);
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
          <div className="flex items-center gap-3 text-[11px] text-white/55">
            <span className="hidden items-center gap-2 sm:flex">
              <span className="size-1.5 rounded-full bg-[#6ce5ff] shadow-[0_0_12px_#6ce5ff]" />{' '}
              LOCAL-FIRST MVP
            </span>
            <Badge
              className="h-7 border-white/10 bg-white/[.055] px-3 text-white/70"
              variant="outline"
            >
              开源版本
            </Badge>
          </div>
        </div>
      </header>

      <section className="relative mx-auto grid min-h-[calc(100vh-64px)] max-w-[1440px] items-center gap-14 px-5 py-14 sm:px-8 lg:grid-cols-[.82fr_1.18fr] lg:py-20">
        <div className="relative z-10 max-w-[600px]">
          <div className="mb-7 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[.22em] text-[#92a0b8]">
            <span className="h-px w-9 bg-gradient-to-r from-[#8367ff] to-[#67ddff]" />
            Screen-to-Guide · Local
          </div>
          <h1 className="font-heading text-[clamp(2.6rem,4.5vw,4.4rem)] leading-[.98] font-semibold tracking-[-.065em]">
            <span className="block whitespace-nowrap">从录屏候选画面</span>
            <span className="block whitespace-nowrap bg-gradient-to-r from-[#b9a8ff] via-[#826cff] to-[#63ddff] bg-clip-text text-transparent">
              到一篇可编辑教程。
            </span>
          </h1>
          <p className="mt-7 max-w-lg text-[17px] leading-8 text-[#9aa4b7]">
            放入一段软件录屏，录见会在浏览器本地找出关键画面，生成一份可编辑、可复核、可导出的图文教程初稿。
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[.08em] text-white/55">
            <span>LOCAL：视频不离开设备</span>
            <span className="text-[#826cff]">/</span>
            <span className="text-white/75">OPEN SOURCE · 可自托管</span>
          </div>

          <div className="mt-9 rounded-[24px] border border-white/[.1] bg-white/[.045] p-2.5 shadow-[0_28px_90px_rgba(0,0,0,.42)] backdrop-blur-xl">
            <input
              ref={inputRef}
              className="sr-only"
              type="file"
              tabIndex={-1}
              aria-hidden="true"
              accept="video/mp4,video/quicktime,video/webm,.mov,.mp4,.webm"
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
                <span className="block truncate text-sm font-medium text-white">
                  {selectedFile?.name || '选择或拖入一段录屏'}
                </span>
                <span className="mt-1 block text-xs text-white/58">
                  {selectedFile
                    ? `${fileSizeLabel(selectedFile.size)} · 将只在当前浏览器本地处理`
                    : 'MP4 / MOV / WebM · 最长 5 分钟 · 不上传服务器'}
                </span>
              </span>
              {selectedFile ? (
                <CheckCircle2 className="mr-2 size-5 text-[#5de0c0]" />
              ) : (
                <ArrowRight className="mr-2 size-4 text-white/45 transition group-hover:translate-x-1 group-hover:text-white" />
              )}
            </button>
            {selectedFile ? (
              <>
                <Button
                  className="recnote-shine relative mt-2.5 h-12 w-full overflow-hidden rounded-[17px] border-0 bg-gradient-to-r from-[#7457ff] via-[#896cff] to-[#4bcfe9] text-[14px] font-semibold text-white shadow-[0_16px_40px_rgba(117,87,255,.3)] hover:brightness-110"
                  size="lg"
                  disabled={!hydrated}
                  onClick={() => onStart(selectedFile)}
                >
                  <Scissors data-icon="inline-start" /> 在本地分析这段录屏
                </Button>
                {hasDraft && (
                  <Button
                    className="mt-2.5 h-11 w-full rounded-[15px] border-white/[.1] bg-white/[.035] text-white/68 hover:bg-white/[.07] hover:text-white"
                    size="lg"
                    variant="outline"
                    onClick={onResume}
                  >
                    <BookOpenCheck data-icon="inline-start" />
                    继续编辑上次的示例草稿
                  </Button>
                )}
              </>
            ) : hasDraft ? (
              <>
                <Button
                  className="recnote-shine relative mt-2.5 h-12 w-full overflow-hidden rounded-[17px] border-0 bg-gradient-to-r from-[#7457ff] via-[#896cff] to-[#4bcfe9] text-[14px] font-semibold text-white shadow-[0_16px_40px_rgba(117,87,255,.3)] hover:brightness-110"
                  size="lg"
                  onClick={onResume}
                >
                  <BookOpenCheck data-icon="inline-start" /> 继续编辑上次草稿
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        className="mt-2.5 h-11 w-full rounded-[15px] border-white/[.1] bg-white/[.035] text-white/68 hover:bg-white/[.07] hover:text-white"
                        size="lg"
                        variant="outline"
                      />
                    }
                  >
                    <Sparkles data-icon="inline-start" />
                    清空草稿并从头体验
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border border-white/[.1] bg-[#12151d] text-white shadow-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        放弃上次草稿，从头开始？
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-white/62">
                        标题、步骤修改、排序和检查进度都会被清除，且无法恢复。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="border-white/[.08] bg-white/[.025]">
                      <AlertDialogCancel className="border-white/[.1] bg-transparent text-white/72 hover:bg-white/[.06] hover:text-white">
                        保留草稿
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-[#7657ff] text-white hover:bg-[#836dff]"
                        onClick={() => {
                          clearStoredDraft();
                          setHasDraft(false);
                          onStart();
                        }}
                      >
                        清空并开始
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <Button
                className="recnote-shine relative mt-2.5 h-12 w-full overflow-hidden rounded-[17px] border-0 bg-gradient-to-r from-[#7457ff] via-[#896cff] to-[#4bcfe9] text-[14px] font-semibold text-white shadow-[0_16px_40px_rgba(117,87,255,.3)] hover:brightness-110"
                size="lg"
                disabled={!hydrated}
                onClick={() => onStart()}
              >
                <Sparkles data-icon="inline-start" />
                体验示例流程
              </Button>
            )}
            {selectedFile && (
              <p className="px-2 pt-3 text-center text-xs leading-5 text-white/58">
                视频会在浏览器中解码、比较并截取候选画面，全程不上传服务器。
              </p>
            )}
            {fileError && (
              <p
                role="alert"
                className="px-2 pt-3 text-center text-xs text-destructive"
              >
                {fileError}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3 text-xs text-white/60">
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-[#69dec9]" />{' '}
              视频本地处理，不离开设备
            </span>
            <span className="flex items-center gap-2">
              <Archive className="size-3.5 text-[#8e7cff]" /> 导出独立图文包
            </span>
          </div>
          <p className="mt-5 max-w-lg text-[11px] leading-5 text-white/52">
            当前开源版本会真实读取并分析你主动选择的视频，但只在浏览器当前会话中处理；不会上传，也不会调用第三方模型。没有视频时仍可体验木瓦任务板自有案例。
          </p>
        </div>

        <div className="relative z-10 lg:pl-6">
          <div className="absolute inset-x-12 top-10 -z-10 h-56 rounded-full bg-[#7156ff]/26 blur-[90px]" />
          <div className="relative overflow-hidden rounded-[28px] border border-white/[.12] bg-[#11131a]/88 p-2.5 shadow-[0_45px_120px_rgba(0,0,0,.55)] backdrop-blur-xl sm:p-3">
            <div className="flex h-12 items-center justify-between px-3 text-white">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#ff6b67]" />
                  <span className="size-2 rounded-full bg-[#f6c85f]" />
                  <span className="size-2 rounded-full bg-[#5ed19a]" />
                </div>
              </div>
              <p className="text-[11px] font-medium uppercase tracking-[.16em] text-white/50">
                Recnote · Draft 01
              </p>
              <Badge
                className="h-6 border-[#67dfc5]/20 bg-[#67dfc5]/10 text-[#75e8cf]"
                variant="outline"
              >
                <span className="mr-1 size-1.5 rounded-full bg-current" /> OWNED
                CASE
              </Badge>
            </div>
            <div className="relative overflow-hidden rounded-[20px] border border-white/[.08] bg-white">
              <Image
                src="/cases/muwa-board/04-created.jpg"
                alt="木瓦任务板中新建任务后的详情画面"
                width={1600}
                height={1000}
                preload
                unoptimized
                className="aspect-[16/10] w-full object-cover object-top"
              />
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 rounded-[15px] border border-black/[.06] bg-[#0e1118]/92 p-3 text-white shadow-2xl backdrop-blur-xl">
                <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-[#8065ff] to-[#55d6ef] text-xs font-bold text-white">
                  04
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    创建任务并打开详情
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-white/56">
                    预置截图 · 时间戳 · 操作说明
                  </p>
                </div>
                <span className="font-mono text-[10px] text-[#78e5ce]">
                  自有案例
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-b-[18px] bg-white/[.08] text-white">
              {[
                ['00:18', '原始录屏'],
                ['7 FRAMES', 'CLI 候选'],
                ['6 STEP', 'WEB 预置稿'],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="bg-[#11131a] px-3 py-3.5 text-center"
                >
                  <p className="font-mono text-sm font-medium tracking-tight text-white/90">
                    {value}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[.1em] text-white/48">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ProcessingView({
  onCancel,
  onComplete,
}: {
  onCancel: () => void;
  onComplete: () => void;
}) {
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
          <Button
            className="border border-white/[.08] bg-white/[.04] text-white/65 hover:bg-white/[.08] hover:text-white"
            variant="ghost"
            onClick={onCancel}
          >
            退出演示
          </Button>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-14 px-5 py-12 sm:px-8 lg:grid-cols-[.86fr_1.14fr] lg:py-16">
        <div className="max-w-lg">
          <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[.2em] text-[#788398]">
            <span className="size-1.5 rounded-full bg-[#6de1cd] shadow-[0_0_12px_#6de1cd]" />
            Demo Pipeline · Owned Case
          </div>
          <h1 className="mt-6 font-heading text-[clamp(2.45rem,3.8vw,3.6rem)] font-semibold leading-[1.02] tracking-[-.055em]">
            正在回放两段
            <br />
            尚未连接的真实能力
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-7 text-white/52">
            先展示 CLI 的候选帧结果，再载入独立的 Web
            预置初稿。负责理解操作并生成步骤的语义层尚未接入。
          </p>

          <div className="mt-8 rounded-[20px] border border-white/[.09] bg-[#10131b]/82 p-5 shadow-[0_28px_90px_rgba(0,0,0,.34)] backdrop-blur-xl">
            <Progress
              value={progress}
              className="[&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-[#7b5cff] [&_[data-slot=progress-indicator]]:to-[#5bdbed] [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-white/[.07]"
            >
              <ProgressLabel className="text-[11px] font-medium uppercase tracking-[.16em] text-white/58">
                Demo progress
              </ProgressLabel>
              <ProgressValue className="font-mono text-sm text-white">
                {(_formatted, value) =>
                  `${String(value ?? 0).padStart(2, '0')}%`
                }
              </ProgressValue>
            </Progress>
            <div className="mt-6 space-y-1.5">
              {PROCESSING_STAGES.map((stage, index) => {
                const completed =
                  index === PROCESSING_STAGES.length - 1
                    ? progress === 100
                    : progress >= stage.at;
                const active =
                  !completed &&
                  (index === 0 || progress >= PROCESSING_STAGES[index - 1].at);
                return (
                  <div
                    key={stage.label}
                    className={`flex items-center gap-3 rounded-[13px] border px-3 py-3 transition duration-300 ${active ? 'border-[#7f68ff]/25 bg-[#8065ff]/[.09]' : 'border-transparent'}`}
                  >
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-[9px] border ${completed ? 'border-[#66dfca]/20 bg-[#66dfca]/10 text-[#72e3ce]' : active ? 'border-[#8a73ff]/35 bg-[#8065ff]/15 text-[#a797ff]' : 'border-white/[.07] text-white/18'}`}
                    >
                      {completed ? (
                        <Check className="size-3.5" />
                      ) : active ? (
                        <LoaderCircle className="size-3.5 animate-spin" />
                      ) : (
                        <span className="size-1 rounded-full bg-current" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[13px] font-medium ${completed || active ? 'text-white/90' : 'text-white/25'}`}
                      >
                        {stage.label}
                      </p>
                      <p
                        className={`mt-0.5 truncate text-[11px] ${completed || active ? 'text-white/48' : 'text-white/23'}`}
                      >
                        {stage.detail}
                      </p>
                    </div>
                    <span
                      className={`font-mono text-[10px] ${completed ? 'text-[#6fe1cc]/60' : active ? 'text-[#9c8aff]/70' : 'text-white/14'}`}
                    >
                      {completed ? 'DONE' : active ? 'RUN' : `0${index + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>
            {progress === 100 && (
              <Button
                className="mt-5 h-10 w-full border-0 bg-gradient-to-r from-[#7457ff] to-[#54cfe8] text-white shadow-[0_12px_30px_rgba(116,87,255,.22)] hover:brightness-110"
                onClick={onComplete}
              >
                查看预置初稿 <ArrowRight data-icon="inline-end" />
              </Button>
            )}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-2xl">
          <div className="absolute inset-16 -z-10 rounded-full bg-[#7657ff]/24 blur-[90px]" />
          <div className="overflow-hidden rounded-[22px] border border-white/[.11] bg-[#10131a] p-2.5 shadow-[0_42px_110px_rgba(0,0,0,.52)]">
            <div className="flex h-10 items-center justify-between px-2.5">
              <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[.14em] text-white/52">
                <Scissors className="size-3.5 text-[#8c76ff]" /> Owned case
                analysis
              </div>
              <span className="font-mono text-[10px] text-white/52">
                FRAME 005 / 007
              </span>
            </div>
            <div className="relative overflow-hidden rounded-[15px] border border-white/[.08] bg-white">
              <Image
                src="/cases/muwa-board/05-progress.jpg"
                alt="候选帧 CLI 输出的自有案例画面"
                width={1600}
                height={1000}
                preload
                unoptimized
                className="aspect-[16/10] w-full object-cover object-top"
              />
              <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-[12px] border border-white/[.1] bg-[#0b0e14]/90 px-3 py-2.5 text-white shadow-2xl backdrop-blur-xl">
                <span className="flex items-center gap-2 text-xs font-medium">
                  <span className="size-1.5 rounded-full bg-[#67e0ca] shadow-[0_0_8px_#67e0ca]" />{' '}
                  自有案例 · 候选画面 05
                </span>
                <span className="font-mono text-[10px] text-white/55">
                  00:09.250
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-b-[14px] bg-white/[.07]">
              {[
                ['SOURCE', 'CLI'],
                ['MODEL', 'NONE'],
                ['REVIEW', 'PENDING'],
              ].map(([label, value]) => (
                <div key={label} className="bg-[#10131a] px-3 py-3">
                  <p className="text-[9px] uppercase tracking-[.12em] text-white/48">
                    {label}
                  </p>
                  <p
                    className={`mt-1 font-mono text-xs ${label === 'REVIEW' ? 'text-[#f5c46d]' : 'text-white/68'}`}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

const LOCAL_STAGE_COPY: Array<{
  id: VideoAnalysisProgress['stage'];
  label: string;
}> = [
  { id: 'loading', label: '读取视频信息' },
  { id: 'sampling', label: '采样并比较画面变化' },
  { id: 'selecting', label: '筛选关键候选画面' },
  { id: 'capturing', label: '生成高清教程截图' },
  { id: 'complete', label: '创建可编辑初稿' },
];

function LocalProcessingView({
  file,
  onCancel,
  onComplete,
}: {
  file: File;
  onCancel: () => void;
  onComplete: (result: VideoAnalysisResult) => void;
}) {
  const [progress, setProgress] = useState<VideoAnalysisProgress>({
    stage: 'loading',
    percent: 1,
    detail: '准备在浏览器本地读取视频',
    completed: 0,
    total: 0,
  });
  const [result, setResult] = useState<VideoAnalysisResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    void analyzeVideo(file, {
      signal: controller.signal,
      onProgress: setProgress,
    })
      .then(setResult)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError')
          return;
        setError(
          reason instanceof Error ? reason.message : '视频处理失败，请重新选择',
        );
      });
    return () => controller.abort();
  }, [file]);

  const activeStageIndex = LOCAL_STAGE_COPY.findIndex(
    (stage) => stage.id === progress.stage,
  );

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#07080c] text-white">
      <div className="recnote-grid pointer-events-none absolute inset-0 -z-20 opacity-45" />
      <div className="pointer-events-none absolute -left-48 top-1/4 -z-10 size-[34rem] rounded-full bg-[#7657ff]/16 blur-[120px]" />
      <div className="pointer-events-none absolute -right-48 bottom-[-12rem] -z-10 size-[32rem] rounded-full bg-[#3cd8ee]/10 blur-[120px]" />

      <header className="border-b border-white/[.07] bg-[#07080c]/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Brand />
          <Badge
            className="border-[#69dec9]/20 bg-[#69dec9]/10 text-[#7be7d2]"
            variant="outline"
          >
            <ShieldCheck className="mr-1 size-3" /> 本地处理
          </Badge>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[.82fr_1.18fr] lg:py-16">
        <div className="max-w-lg">
          <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[.2em] text-[#788398]">
            <span className="size-1.5 rounded-full bg-[#6de1cd] shadow-[0_0_12px_#6de1cd]" />
            Local video pipeline
          </div>
          <h1 className="mt-6 font-heading text-[clamp(2.45rem,3.8vw,3.65rem)] leading-[1.02] font-semibold tracking-[-.055em]">
            正在把这段录屏
            <br />
            拆成关键画面
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-7 text-white/52">
            视频字节只在当前浏览器里读取。录见会采样画面、比较变化，再把候选截图交给你编辑和复核。
          </p>

          <div className="mt-7 rounded-[18px] border border-white/[.08] bg-white/[.035] p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-white/[.06] text-[#8f7cff]">
                <Video className="size-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/88">
                  {file.name}
                </p>
                <p className="mt-1 text-xs text-white/45">
                  {fileSizeLabel(file.size)} · 不上传服务器
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-[11px] text-white/48">
            <span>首版上限：5 分钟 / 500 MB</span>
            <span>·</span>
            <span>推荐 H.264 MP4</span>
          </div>
        </div>

        <div className="rounded-[26px] border border-white/[.1] bg-[#0f1219]/88 p-5 shadow-[0_35px_100px_rgba(0,0,0,.42)] backdrop-blur-xl sm:p-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[.16em] text-white/48">
                Analysis progress
              </p>
              <p className="mt-2 text-sm font-medium text-white/86">
                {error ? '处理没有完成' : progress.detail}
              </p>
            </div>
            <span className="font-mono text-2xl font-medium text-white">
              {error ? '--' : `${progress.percent}%`}
            </span>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[.07]">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${error ? 'bg-red-400' : 'bg-gradient-to-r from-[#7657ff] to-[#58d7ea]'}`}
              style={{ width: `${error ? 100 : progress.percent}%` }}
            />
          </div>

          {error ? (
            <div className="mt-6 rounded-[16px] border border-red-400/15 bg-red-400/[.06] p-4">
              <div className="flex gap-3">
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-red-300" />
                <div>
                  <p className="text-sm font-medium text-red-100">
                    无法处理这段视频
                  </p>
                  <p className="mt-1.5 text-xs leading-6 text-red-100/60">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-1.5">
              {LOCAL_STAGE_COPY.map((stage, index) => {
                const completed = result ? true : index < activeStageIndex;
                const active = !result && index === activeStageIndex;
                return (
                  <div
                    key={stage.id}
                    className={`flex items-center gap-3 rounded-[12px] border px-3 py-3 ${active ? 'border-[#8065ff]/25 bg-[#8065ff]/[.08]' : 'border-transparent'}`}
                  >
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-[9px] border ${completed ? 'border-[#66dfca]/20 bg-[#66dfca]/10 text-[#72e3ce]' : active ? 'border-[#8a73ff]/35 bg-[#8065ff]/15 text-[#a797ff]' : 'border-white/[.07] text-white/18'}`}
                    >
                      {completed ? (
                        <Check className="size-3.5" />
                      ) : active ? (
                        <LoaderCircle className="size-3.5 animate-spin" />
                      ) : (
                        <span className="size-1 rounded-full bg-current" />
                      )}
                    </span>
                    <span
                      className={`text-[13px] font-medium ${completed || active ? 'text-white/86' : 'text-white/25'}`}
                    >
                      {stage.label}
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-white/32">
                      0{index + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {result && (
            <div className="mt-6">
              <div className="grid grid-cols-3 gap-2">
                {result.frames.slice(0, 6).map((frame) => (
                  <div
                    key={frame.id}
                    className="relative overflow-hidden rounded-[10px] border border-white/[.08] bg-black"
                  >
                    <Image
                      src={frame.image}
                      alt={`候选画面 ${frame.id}`}
                      width={frame.imageWidth}
                      height={frame.imageHeight}
                      unoptimized
                      className="aspect-video w-full object-cover"
                    />
                    <span className="absolute right-1.5 bottom-1.5 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[8px] text-white/75">
                      {frame.time}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-[12px] border border-[#69dec9]/15 bg-[#69dec9]/[.06] px-4 py-3 text-xs leading-5 text-[#91ead9]">
                已从 {result.sampleCount} 个采样画面中保留{' '}
                {result.frames.length}{' '}
                张候选截图。步骤文字仍需你根据实际操作补充。
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Button
              className="flex-1 border-white/[.09] bg-white/[.035] text-white/62 hover:bg-white/[.075] hover:text-white"
              variant="outline"
              onClick={onCancel}
            >
              {error ? '返回重选' : result ? '换一段视频' : '停止处理'}
            </Button>
            <Button
              className="flex-[1.35] border-0 bg-gradient-to-r from-[#7457ff] to-[#54cfe8] text-white shadow-[0_12px_30px_rgba(116,87,255,.22)] hover:brightness-110"
              disabled={!result}
              onClick={() => result && onComplete(result)}
            >
              进入教程工作台 <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function EditorView({
  onReset,
  source,
}: {
  onReset: () => void;
  source: EditorSource;
}) {
  const isDemo = source.kind === 'demo';
  const sourceDuration =
    source.kind === 'local' ? formatVideoTimestamp(source.duration) : '00:18';
  const stepsScrollerRef = useRef<HTMLDivElement>(null);
  const contentScrollerRef = useRef<HTMLElement>(null);
  const noticeTimerRef = useRef<number | null>(null);
  const [steps, setSteps] = useState(() =>
    (source.kind === 'local' ? source.steps : INITIAL_STEPS).map((step) => ({
      ...step,
    })),
  );
  const [selectedId, setSelectedId] = useState(() =>
    source.kind === 'local' ? (source.steps[0]?.id ?? 1) : 4,
  );
  const [mode, setMode] = useState<EditorMode>('edit');
  const [title, setTitle] = useState(() =>
    source.kind === 'local'
      ? `从「${videoBaseName(source.fileName)}」整理的图文教程`
      : '用木瓦任务板完成一轮公众号发布检查',
  );
  const [summary, setSummary] = useState(() =>
    source.kind === 'local'
      ? `录见在浏览器本地分析了这段 ${formatVideoTimestamp(source.duration)} 的录屏，从 ${source.sampleCount} 个采样画面中筛出 ${source.steps.length} 张候选截图。请根据真实操作补全并核对每一步。`
      : '这段 18 秒录屏演示了如何在木瓦任务板中新建发布检查任务、推进状态、完成清单并归档。当前 Web 案例预置了 6 个步骤，用于验证编辑、复核与导出体验。',
  );
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [exporting, setExporting] = useState<
    'markdown' | 'rich' | 'zip' | null
  >(null);
  const [editedStepIds, setEditedStepIds] = useState<Set<number>>(
    () =>
      new Set(
        source.kind === 'local' ? source.steps.map((step) => step.id) : [],
      ),
  );
  const [reviewedStepIds, setReviewedStepIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [privacyReviewedIds, setPrivacyReviewedIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [articleCopyEdited, setArticleCopyEdited] = useState(
    source.kind === 'local',
  );
  const [articleCopyReviewed, setArticleCopyReviewed] = useState(false);
  const [draftReady, setDraftReady] = useState(!isDemo);

  const showNotice = (
    message: string,
    tone: NoticeState['tone'] = 'success',
  ) => {
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    setNotice({ message, tone });
    noticeTimerRef.current = window.setTimeout(() => setNotice(null), 2600);
  };

  useEffect(() => {
    if (!isDemo) return;
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        if (raw) {
          const draft = JSON.parse(raw) as Partial<StoredDraft>;
          if (draft.version === DRAFT_VERSION && Array.isArray(draft.steps)) {
            const storedById = new Map(
              draft.steps.map((step) => [step.id, step]),
            );
            const orderedIds = Array.from(
              new Set(
                draft.steps
                  .map((step) => step.id)
                  .filter((id) => INITIAL_STEPS.some((step) => step.id === id)),
              ),
            );
            const allIds = [
              ...orderedIds,
              ...INITIAL_STEPS.map((step) => step.id).filter(
                (id) => !orderedIds.includes(id),
              ),
            ];
            setSteps(
              allIds.map((id) => {
                const base = INITIAL_STEPS.find((step) => step.id === id)!;
                const stored = storedById.get(id);
                return {
                  ...base,
                  title:
                    typeof stored?.title === 'string'
                      ? stored.title.slice(0, 40)
                      : base.title,
                  body:
                    typeof stored?.body === 'string'
                      ? stored.body.slice(0, 300)
                      : base.body,
                  included:
                    typeof stored?.included === 'boolean'
                      ? stored.included
                      : base.included,
                };
              }),
            );
            if (typeof draft.title === 'string')
              setTitle(draft.title.slice(0, 64));
            if (typeof draft.summary === 'string')
              setSummary(draft.summary.slice(0, 160));
            setArticleCopyEdited(draft.articleCopyEdited === true);
            setArticleCopyReviewed(draft.articleCopyReviewed === true);
            if (
              typeof draft.selectedId === 'number' &&
              INITIAL_STEPS.some((step) => step.id === draft.selectedId)
            )
              setSelectedId(draft.selectedId);
            if (draft.mode === 'edit' || draft.mode === 'preview')
              setMode(draft.mode);
            const validId = (id: number) =>
              INITIAL_STEPS.some((step) => step.id === id);
            setEditedStepIds(
              new Set((draft.editedStepIds ?? []).filter(validId)),
            );
            setReviewedStepIds(
              new Set((draft.reviewedStepIds ?? []).filter(validId)),
            );
            setPrivacyReviewedIds(
              new Set((draft.privacyReviewedIds ?? []).filter(validId)),
            );
          }
        }
      } catch {
        clearStoredDraft();
      } finally {
        setDraftReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isDemo]);

  useEffect(() => {
    if (!isDemo || !draftReady) return;
    const timer = window.setTimeout(() => {
      const draft: StoredDraft = {
        version: DRAFT_VERSION,
        steps: steps.map(({ id, title: stepTitle, body, included }) => ({
          id,
          title: stepTitle,
          body,
          included,
        })),
        selectedId,
        mode,
        title,
        summary,
        articleCopyEdited,
        articleCopyReviewed,
        editedStepIds: [...editedStepIds],
        reviewedStepIds: [...reviewedStepIds],
        privacyReviewedIds: [...privacyReviewedIds],
      };
      try {
        window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      } catch {
        showNotice('浏览器无法保存草稿，请及时导出图文包', 'warning');
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [
    draftReady,
    articleCopyEdited,
    articleCopyReviewed,
    editedStepIds,
    mode,
    privacyReviewedIds,
    reviewedStepIds,
    selectedId,
    steps,
    summary,
    title,
    isDemo,
  ]);

  useEffect(
    () => () => {
      if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    },
    [],
  );

  const selectedStep = steps.find((step) => step.id === selectedId) ?? steps[0];
  const includedSteps = useMemo(
    () => steps.filter((step) => step.included),
    [steps],
  );

  useEffect(() => {
    const scroller = stepsScrollerRef.current;
    if (!scroller || mode !== 'edit' || window.innerWidth >= 1024) return;
    const item = scroller.querySelector<HTMLElement>(
      `[data-step-id="${selectedId}"]`,
    );
    if (!item) return;
    scroller.scrollTo({
      left: item.offsetLeft - (scroller.clientWidth - item.clientWidth) / 2,
      behavior: 'smooth',
    });
  }, [mode, selectedId]);

  useEffect(() => {
    contentScrollerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.innerWidth < 1024)
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [mode, selectedId]);

  const updateStep = (id: number, patch: Partial<TutorialStep>) => {
    setSteps((current) =>
      current.map((step) => (step.id === id ? { ...step, ...patch } : step)),
    );
  };

  const updateStepCopy = (
    id: number,
    patch: Pick<TutorialStep, 'title'> | Pick<TutorialStep, 'body'>,
  ) => {
    updateStep(id, patch);
    setEditedStepIds((current) => new Set(current).add(id));
    setReviewedStepIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  const updateArticleCopy = (field: 'title' | 'summary', value: string) => {
    if (field === 'title') setTitle(value);
    else setSummary(value);
    setArticleCopyEdited(true);
    setArticleCopyReviewed(false);
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

  const selectedIndex = steps.findIndex((step) => step.id === selectedId);
  const selectedStepEdited = editedStepIds.has(selectedStep.id);
  const selectedStepReviewed = reviewedStepIds.has(selectedStep.id);
  const selectedStepNeedsReview = selectedStepEdited && !selectedStepReviewed;
  const localStepCopyReady =
    isDemo ||
    includedSteps.every(
      (step) =>
        step.body.trim() !== LOCAL_STEP_PLACEHOLDER &&
        !step.body.trim().startsWith('请根据截图补充这一时刻'),
    );
  const contentReady = Boolean(
    title.trim() &&
    summary.trim() &&
    includedSteps.length > 0 &&
    includedSteps.every((step) => step.title.trim() && step.body.trim()) &&
    localStepCopyReady,
  );
  const timestampsReady =
    includedSteps.length > 0 && includedSteps.every((step) => step.time);
  const screenshotsReady =
    includedSteps.length > 0 && includedSteps.every((step) => step.image);
  const pendingReviewSteps = includedSteps.filter(
    (step) => editedStepIds.has(step.id) && !reviewedStepIds.has(step.id),
  );
  const articleCopyNeedsReview = articleCopyEdited && !articleCopyReviewed;
  const pendingReviewCount =
    pendingReviewSteps.length + (articleCopyNeedsReview ? 1 : 0);
  const copyReviewReady = pendingReviewCount === 0;
  const privacyReviewedCount = includedSteps.filter((step) =>
    privacyReviewedIds.has(step.id),
  ).length;
  const privacyReady =
    includedSteps.length > 0 && privacyReviewedCount === includedSteps.length;
  const checkItems: Array<[string, string, boolean]> = [
    [
      '内容完整',
      contentReady
        ? `${includedSteps.length} 个有效步骤`
        : localStepCopyReady
          ? '请补全标题与步骤'
          : '请替换每一步占位说明',
      contentReady,
    ],
    [
      '保留时间戳',
      `${includedSteps.filter((step) => step.time).length} / ${includedSteps.length}`,
      timestampsReady,
    ],
    [
      '候选截图齐全',
      `${includedSteps.filter((step) => step.image).length} / ${includedSteps.length}`,
      screenshotsReady,
    ],
    [
      '修改内容复核',
      copyReviewReady ? '没有待核对修改' : `${pendingReviewCount} 项待核对`,
      copyReviewReady,
    ],
    [
      '截图隐私复核',
      `${privacyReviewedCount} / ${includedSteps.length} 已检查`,
      privacyReady,
    ],
  ];
  const completedCheckCount = checkItems.filter(
    ([, , passed]) => passed,
  ).length;
  const publishReady = completedCheckCount === checkItems.length;

  const exportInput = {
    title,
    summary,
    steps,
    footer: isDemo
      ? '本文由录见的自有示例生成；木瓦任务板及示例数据均为演示内容，不包含真实账号、客户或业务信息。'
      : '本文由录见在浏览器本地整理生成；发布前请再次核对操作说明、截图内容和隐私信息。',
  };
  const assetOrigin =
    typeof window === 'undefined' ? PUBLIC_SITE_ORIGIN : window.location.origin;
  const markdownImagePath = (step: { image: string }, index: number) =>
    isDemo
      ? `${assetOrigin}${step.image}`
      : `images/step-${String(index + 1).padStart(2, '0')}.jpg`;
  const richImagePath = (step: { image: string }) =>
    isDemo ? `${assetOrigin}${step.image}` : step.image;

  const validateDelivery = () => {
    if (!contentReady) {
      showNotice('请先补全标题、摘要和每一步真实操作说明', 'warning');
      return false;
    }
    if (!timestampsReady || !screenshotsReady) {
      showNotice('时间戳或截图不完整，暂时无法交付', 'warning');
      return false;
    }
    if (!copyReviewReady) {
      showNotice(`还有 ${pendingReviewCount} 项修改待核对`, 'warning');
      return false;
    }
    if (!privacyReady) {
      showNotice(
        `请逐张检查截图隐私（${privacyReviewedCount}/${includedSteps.length}）`,
        'warning',
      );
      return false;
    }
    return true;
  };

  const requestDelivery = async (kind: 'markdown' | 'rich' | 'zip') => {
    if (!validateDelivery() || exporting) return;
    setExporting(kind);
    try {
      const markdown = buildMarkdown(exportInput, markdownImagePath);
      if (kind === 'markdown') {
        await navigator.clipboard.writeText(markdown);
        showNotice(
          isDemo
            ? '在线版 Markdown 已复制'
            : 'Markdown 已复制；完整图片请同时下载图文包',
        );
      } else if (kind === 'rich') {
        const result = await writeRichClipboard(
          buildWechatHtml(exportInput, richImagePath),
          markdown,
        );
        showNotice(
          result === 'rich'
            ? '公众号格式已复制；若图片未带入，请使用图文包'
            : '浏览器不支持富文本，已复制 Markdown',
          result === 'rich' ? 'success' : 'warning',
        );
      } else {
        const archive = await createTutorialZip(exportInput);
        downloadBlob(archive, `${safeBasename(title)}-图文包.zip`);
        showNotice('图文包已下载，可离线使用');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '交付失败，请重试';
      showNotice(message, 'error');
    } finally {
      setExporting(null);
    }
  };

  const polishSelectedStep = () => {
    const suffix = ' 完成后，请确认页面标题与预期结果一致。';
    if (!selectedStep.body.includes('完成后，请确认')) {
      if (selectedStep.body.length + suffix.length > 300) {
        showNotice('正文已接近 300 字上限，无法继续润色', 'warning');
        return;
      }
      updateStepCopy(selectedStep.id, {
        body: `${selectedStep.body}${suffix}`,
      });
      showNotice('已应用一条润色示例');
      return;
    }
    showNotice('这条润色已经应用', 'warning');
  };

  const confirmSelectedCopy = () => {
    setReviewedStepIds((current) => new Set(current).add(selectedStep.id));
    showNotice(`第 ${selectedIndex + 1} 步文案已核对`);
  };

  const confirmArticleCopy = () => {
    setArticleCopyReviewed(true);
    showNotice('文章标题与摘要已核对');
  };

  const confirmSelectedPrivacy = () => {
    if (!selectedStep.included) {
      showNotice('该步骤未纳入成稿，无需检查', 'warning');
      return;
    }
    setPrivacyReviewedIds((current) => new Set(current).add(selectedStep.id));
    showNotice(`第 ${selectedIndex + 1} 张截图已检查`);
  };

  const resetDraft = () => {
    if (isDemo) clearStoredDraft();
    onReset();
  };

  return (
    <main className="min-h-screen bg-[#080a0f] text-white lg:h-screen lg:overflow-hidden">
      <h1 className="sr-only">{title}</h1>
      <header className="sticky top-0 z-30 border-b border-white/[.075] bg-[#090b11]/92 backdrop-blur-2xl lg:static">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-5">
          <Brand compact />
          <div className="mx-2 hidden h-6 w-px bg-white/[.08] sm:block" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-white/90">
              {title}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[.1em] text-white/52">
              {isDemo
                ? draftReady
                  ? '示例草稿 · 已在本机自动保存'
                  : '示例草稿 · 正在恢复'
                : '本地视频草稿 · 仅保留在当前会话'}
            </p>
          </div>
          <div className="hidden rounded-[10px] border border-white/[.075] bg-white/[.035] p-1 sm:flex">
            <button
              aria-pressed={mode === 'edit'}
              onClick={() => setMode('edit')}
              className={`rounded-[7px] px-3 py-1.5 text-[11px] font-medium transition ${mode === 'edit' ? 'bg-white/[.1] text-white shadow-sm' : 'text-white/52 hover:text-white/80'}`}
            >
              编辑步骤
            </button>
            <button
              aria-pressed={mode === 'preview'}
              onClick={() => setMode('preview')}
              className={`rounded-[7px] px-3 py-1.5 text-[11px] font-medium transition ${mode === 'preview' ? 'bg-white/[.1] text-white shadow-sm' : 'text-white/52 hover:text-white/80'}`}
            >
              成稿预览
            </button>
          </div>
          <Button
            variant="outline"
            className="hidden border-white/[.09] bg-white/[.035] text-white/70 hover:bg-white/[.075] hover:text-white sm:inline-flex"
            disabled={Boolean(exporting)}
            onClick={() => void requestDelivery('rich')}
          >
            {exporting === 'rich' ? (
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
            ) : (
              <Clipboard data-icon="inline-start" />
            )}
            复制公众号排版
          </Button>
          <Button
            className="border-0 bg-gradient-to-r from-[#7457ff] to-[#54cfe8] text-white shadow-[0_10px_28px_rgba(116,87,255,.22)] hover:brightness-110"
            disabled={Boolean(exporting)}
            onClick={() => void requestDelivery('zip')}
          >
            {exporting === 'zip' ? (
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
            ) : (
              <Download data-icon="inline-start" />
            )}
            <span className="hidden sm:inline">下载独立图文包</span>
            <span className="sm:hidden">图文包</span>
          </Button>
        </div>
      </header>

      <div className="sticky top-16 z-20 border-b border-white/[.07] bg-[#090b11]/92 px-4 py-2 backdrop-blur-2xl sm:hidden">
        <div className="mx-auto flex max-w-4xl rounded-[10px] border border-white/[.075] bg-white/[.035] p-1">
          <button
            aria-pressed={mode === 'edit'}
            onClick={() => setMode('edit')}
            className={`flex-1 rounded-[7px] px-3 py-2 text-xs font-medium transition ${mode === 'edit' ? 'bg-white/[.1] text-white' : 'text-white/50'}`}
          >
            编辑步骤
          </button>
          <button
            aria-pressed={mode === 'preview'}
            onClick={() => setMode('preview')}
            className={`flex-1 rounded-[7px] px-3 py-2 text-xs font-medium transition ${mode === 'preview' ? 'bg-white/[.1] text-white' : 'text-white/50'}`}
          >
            成稿预览
          </button>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] overflow-x-hidden lg:h-[calc(100vh-64px)] lg:grid-cols-[276px_minmax(0,1fr)_270px]">
        <aside
          aria-label="教程步骤"
          className={`${mode === 'preview' ? 'hidden lg:block' : ''} min-w-0 overflow-hidden border-b border-white/[.07] bg-[#0b0e14] lg:overflow-y-auto lg:border-b-0 lg:border-r`}
        >
          <div className="hidden items-start justify-between p-4 pb-3 lg:flex">
            <div>
              <p className="text-[13px] font-medium text-white/88">教程步骤</p>
              <p className="mt-1 text-[11px] text-white/50">
                {isDemo ? '预置示例' : '本地候选'} · {includedSteps.length}{' '}
                个纳入步骤
              </p>
            </div>
            <Badge
              className="h-6 border-[#8873ff]/20 bg-[#8065ff]/10 px-2.5 text-[9px] font-medium tracking-[.08em] text-[#a797ff]"
              variant="outline"
            >
              {isDemo ? '示例草稿' : '本地草稿'}
            </Badge>
          </div>
          <div
            ref={stepsScrollerRef}
            className="flex gap-2 overflow-x-auto px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:block lg:space-y-1 lg:overflow-visible lg:pt-0"
          >
            {steps.map((step, index) => (
              <button
                key={step.id}
                data-step-id={step.id}
                type="button"
                aria-current={
                  selectedId === step.id && mode === 'edit' ? 'step' : undefined
                }
                aria-label={`步骤 ${index + 1}：${step.title}，${step.included ? '已纳入成稿' : '已从成稿隐藏'}`}
                onClick={() => {
                  setSelectedId(step.id);
                  setMode('edit');
                }}
                className={`group relative flex min-w-[225px] items-center gap-3 overflow-hidden rounded-[12px] border p-2 text-left transition duration-200 lg:min-w-0 lg:w-full ${selectedId === step.id && mode === 'edit' ? 'border-[#8065ff]/35 bg-[#8065ff]/[.09]' : 'border-transparent hover:border-white/[.07] hover:bg-white/[.035]'} ${step.included ? '' : 'opacity-35'}`}
              >
                {selectedId === step.id && mode === 'edit' && (
                  <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gradient-to-b from-[#927fff] to-[#59d7e9]" />
                )}
                <div className="relative h-12 w-[70px] shrink-0 overflow-hidden rounded-[8px] border border-white/[.07] bg-white/[.04]">
                  <Image
                    src={step.image}
                    alt=""
                    width={1600}
                    height={step.imageHeight}
                    unoptimized
                    className="h-full w-full object-cover object-top"
                  />
                  <span className="absolute left-1 top-1 grid size-4 place-items-center rounded-[4px] bg-[#090b11]/88 font-mono text-[8px] font-medium text-white">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-white/78">
                    {step.title}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 font-mono text-[9px] text-white/52">
                    <Video className="size-2.5" /> {step.time} ·{' '}
                    {isDemo ? '示例字段' : '候选画面'}
                  </p>
                </div>
                {step.included ? (
                  <Eye className="size-3 text-white/18" />
                ) : (
                  <EyeOff className="size-3 text-white/55" />
                )}
              </button>
            ))}
          </div>
        </aside>

        <section
          ref={contentScrollerRef}
          className="order-2 relative min-w-0 overflow-y-auto bg-[#080a0f] px-4 py-6 sm:px-8 lg:order-none lg:px-10"
        >
          <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-3/4 -translate-x-1/2 rounded-full bg-[#7457ff]/[.07] blur-[100px]" />
          {mode === 'edit' ? (
            <div className="relative mx-auto max-w-4xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge
                    className="h-6 border-white/[.08] bg-white/[.04] font-mono text-[9px] text-white/52"
                    variant="outline"
                  >
                    STEP {String(selectedIndex + 1).padStart(2, '0')} /{' '}
                    {String(steps.length).padStart(2, '0')}
                  </Badge>
                  <Badge
                    className={`h-6 text-[10px] ${selectedStepNeedsReview ? 'border-amber-300/15 bg-amber-300/[.07] text-amber-200' : 'border-[#63ddc5]/15 bg-[#63ddc5]/[.07] text-[#72dfca]'}`}
                    variant="outline"
                  >
                    {selectedStepNeedsReview ? (
                      <>
                        <WandSparkles data-icon="inline-start" /> 文案已修改 ·
                        待核对
                      </>
                    ) : selectedStepReviewed ? (
                      <>
                        <BookOpenCheck data-icon="inline-start" />{' '}
                        修改已人工核对
                      </>
                    ) : (
                      <>
                        <CheckCircle2 data-icon="inline-start" />{' '}
                        {isDemo ? '自有示例 · 字段预留' : '本地初稿 · 待补充'}
                      </>
                    )}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    className="border-white/[.08] bg-white/[.035] text-white/60 hover:bg-white/[.08]"
                    size="icon-sm"
                    variant="outline"
                    aria-label="上移步骤"
                    disabled={selectedIndex === 0}
                    onClick={() => {
                      moveStep(selectedStep.id, -1);
                      showNotice(`已移至第 ${selectedIndex} 步`);
                    }}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    className="border-white/[.08] bg-white/[.035] text-white/60 hover:bg-white/[.08]"
                    size="icon-sm"
                    variant="outline"
                    aria-label="下移步骤"
                    disabled={selectedIndex === steps.length - 1}
                    onClick={() => {
                      moveStep(selectedStep.id, 1);
                      showNotice(`已移至第 ${selectedIndex + 2} 步`);
                    }}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    className="border-white/[.08] bg-white/[.035] text-white/60 hover:bg-white/[.08] hover:text-white"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateStep(selectedStep.id, {
                        included: !selectedStep.included,
                      })
                    }
                  >
                    {selectedStep.included ? (
                      <>
                        <EyeOff data-icon="inline-start" /> 从成稿隐藏
                      </>
                    ) : (
                      <>
                        <Eye data-icon="inline-start" /> 恢复步骤
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <article
                className={`overflow-hidden rounded-[20px] border border-white/[.09] bg-[#10131a] shadow-[0_30px_90px_rgba(0,0,0,.34)] transition ${selectedStep.included ? '' : 'opacity-55'}`}
              >
                <div className="relative border-b border-white/[.07] bg-[#0b0d12] p-2 sm:p-3">
                  <Image
                    src={selectedStep.image}
                    alt={selectedStep.title}
                    width={1600}
                    height={selectedStep.imageHeight}
                    unoptimized
                    className="aspect-[16/9] w-full rounded-[13px] bg-white object-contain"
                  />
                  <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-[9px] border border-white/[.08] bg-[#090b11]/88 px-3 py-2 font-mono text-[10px] text-white/70 shadow-xl backdrop-blur-xl">
                    <Video className="size-3 text-[#68dfca]" /> SOURCE{' '}
                    {selectedStep.time}
                  </div>
                  <Button
                    className="absolute right-5 top-5 border-white/[.1] bg-[#0b0e14]/85 text-white/50 backdrop-blur"
                    variant="outline"
                    size="sm"
                    disabled
                  >
                    <ImageIcon data-icon="inline-start" /> 替换截图 · 产品版
                  </Button>
                </div>

                <div className="space-y-5 p-5 sm:p-7">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-[.14em] text-white/52">
                      <label htmlFor="step-title">步骤标题</label>
                      <span className="font-mono tracking-normal text-white/55">
                        {selectedStep.title.length} / 40
                      </span>
                    </div>
                    <Input
                      id="step-title"
                      maxLength={40}
                      value={selectedStep.title}
                      onChange={(event) =>
                        updateStepCopy(selectedStep.id, {
                          title: event.target.value,
                        })
                      }
                      className="h-12 border border-white/[.07] bg-white/[.035] px-4 text-base font-medium text-white shadow-none focus-visible:ring-[#8065ff]/25"
                    />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-[.14em] text-white/52">
                      <label htmlFor="step-body">操作说明</label>
                      <span className="flex items-center gap-3 normal-case tracking-normal">
                        <span className="font-mono text-white/55">
                          {selectedStep.body.length} / 300
                        </span>
                        <button
                          type="button"
                          className="flex items-center gap-1 text-[#aa9bff] transition hover:text-[#c5bcff]"
                          onClick={polishSelectedStep}
                        >
                          <WandSparkles className="size-3" /> 润色示例
                        </button>
                      </span>
                    </div>
                    <Textarea
                      id="step-body"
                      maxLength={300}
                      value={selectedStep.body}
                      onChange={(event) =>
                        updateStepCopy(selectedStep.id, {
                          body: event.target.value,
                        })
                      }
                      className="min-h-28 resize-y border border-white/[.07] bg-white/[.035] px-4 py-3 text-[13px] leading-7 text-white/78 shadow-none focus-visible:ring-[#8065ff]/25"
                    />
                  </div>
                  <div className="flex flex-col gap-3 rounded-[13px] border border-[#866fff]/15 bg-[#8065ff]/[.065] p-4 text-xs leading-6 text-white/64 sm:flex-row sm:items-start">
                    <Sparkles className="mt-1 size-3.5 shrink-0 text-[#9e8cff]" />
                    <div className="min-w-0 flex-1">
                      <p>
                        <strong className="font-medium text-white/86">
                          核对提示
                        </strong>{' '}
                        ·{' '}
                        {selectedStepNeedsReview
                          ? '文案已被修改，请重新确认说明与当前画面一致。'
                          : selectedStepReviewed
                            ? '这处修改已人工核对，后续再次编辑会自动恢复待核对状态。'
                            : isDemo
                              ? '自有示例已预先核对；如果修改文案，需要重新确认。'
                              : '这段说明由占位文字生成，请按真实操作补充后再确认。'}
                      </p>
                      {selectedStepEdited && (
                        <Button
                          className="mt-3 border-[#9d8cff]/20 bg-[#8b73ff]/10 text-[#c8beff] hover:bg-[#8b73ff]/20 disabled:opacity-70"
                          variant="outline"
                          size="sm"
                          disabled={selectedStepReviewed}
                          onClick={confirmSelectedCopy}
                        >
                          {selectedStepReviewed ? (
                            <>
                              <Check data-icon="inline-start" /> 修改已核对
                            </>
                          ) : (
                            <>
                              <BookOpenCheck data-icon="inline-start" />{' '}
                              确认文字与画面一致
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </article>

              <div className="mt-5 flex items-center justify-between">
                <Button
                  className="border-white/[.08] bg-white/[.03] text-white/55 hover:bg-white/[.07] hover:text-white"
                  variant="outline"
                  disabled={selectedIndex === 0}
                  onClick={() => setSelectedId(steps[selectedIndex - 1].id)}
                >
                  <ChevronLeft data-icon="inline-start" /> 上一步
                </Button>
                <Button
                  className="border-white/[.08] bg-white/[.03] text-white/55 hover:bg-white/[.07] hover:text-white"
                  variant="outline"
                  disabled={selectedIndex === steps.length - 1}
                  onClick={() => setSelectedId(steps[selectedIndex + 1].id)}
                >
                  下一步 <ChevronRight data-icon="inline-end" />
                </Button>
              </div>
            </div>
          ) : (
            <article className="relative mx-auto max-w-3xl overflow-hidden rounded-[20px] border border-white/[.08] bg-[#fbfbfd] px-5 py-9 text-[#14161d] shadow-[0_35px_110px_rgba(0,0,0,.38)] sm:px-12 sm:py-12">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#7657ff] via-[#8b72ff] to-[#55d7ea]" />
              <div className="mb-7 flex items-center justify-between">
                <Badge
                  className="h-6 border-[#7657ff]/10 bg-[#7657ff]/[.07] px-2.5 text-[9px] font-medium tracking-[.08em] text-[#6548e8]"
                  variant="outline"
                >
                  {isDemo ? '示例草稿' : '本地视频草稿'} · 可编辑
                </Badge>
                <span className="font-mono text-[9px] uppercase tracking-[.12em] text-[#14161d]/55">
                  {includedSteps.length} steps · {sourceDuration}
                </span>
              </div>
              <Textarea
                aria-label="教程标题"
                maxLength={64}
                value={title}
                onChange={(event) =>
                  updateArticleCopy('title', event.target.value)
                }
                className="min-h-[5.4rem] field-sizing-content resize-y border-0 bg-transparent p-0 font-heading text-3xl! font-semibold leading-tight tracking-[-.045em] text-[#101219] shadow-none focus-visible:ring-[#7657ff]/20 sm:min-h-[6.5rem] sm:text-4xl!"
              />
              <p className="mt-1 text-right font-mono text-[10px] text-[#14161d]/55">
                {title.length} / 64
              </p>
              <Textarea
                aria-label="教程摘要"
                maxLength={160}
                value={summary}
                onChange={(event) =>
                  updateArticleCopy('summary', event.target.value)
                }
                className="mt-5 min-h-20 field-sizing-content resize-y rounded-[12px] border border-black/[.04] bg-[#f2f3f7] px-4 py-3 text-sm leading-7 text-[#343844] shadow-none focus-visible:ring-[#7657ff]/15"
              />
              <p className="mt-1 text-right font-mono text-[10px] text-[#14161d]/55">
                {summary.length} / 160
              </p>
              {articleCopyEdited && (
                <div
                  className={`mt-4 flex flex-col gap-3 rounded-[12px] border p-4 text-sm sm:flex-row sm:items-center ${articleCopyNeedsReview ? 'border-amber-500/20 bg-amber-50 text-amber-950' : 'border-emerald-500/15 bg-emerald-50 text-emerald-950'}`}
                >
                  <BookOpenCheck className="size-4 shrink-0" />
                  <p className="min-w-0 flex-1">
                    {articleCopyNeedsReview
                      ? '标题或摘要已修改，请确认表述准确后再导出。'
                      : '文章标题与摘要已人工核对。'}
                  </p>
                  <Button
                    className="border-black/10 bg-white text-[#343844] hover:bg-white/80 disabled:opacity-65"
                    variant="outline"
                    size="sm"
                    disabled={articleCopyReviewed}
                    onClick={confirmArticleCopy}
                  >
                    {articleCopyReviewed ? (
                      <>
                        <Check data-icon="inline-start" /> 已核对
                      </>
                    ) : (
                      '确认标题与摘要'
                    )}
                  </Button>
                </div>
              )}
              <div className="mt-10 space-y-12">
                {includedSteps.map((step, index) => (
                  <section key={step.id}>
                    <div className="mb-4 flex items-center gap-3">
                      <span className="grid size-8 place-items-center rounded-[9px] bg-gradient-to-br from-[#7657ff] to-[#55cfe5] font-mono text-[10px] font-semibold text-white">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <h2 className="text-lg font-semibold tracking-[-.02em] text-[#14161d]">
                          {step.title}
                        </h2>
                        <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[.08em] text-[#14161d]/55">
                          Video time · {step.time}
                        </p>
                      </div>
                    </div>
                    <p className="mb-5 text-[15px] leading-7 text-[#343844]">
                      {step.body}
                    </p>
                    <Image
                      src={step.image}
                      alt={step.title}
                      width={1600}
                      height={step.imageHeight}
                      unoptimized
                      className="h-auto w-full rounded-[12px] border border-black/[.07] bg-[#f2f3f7] object-contain shadow-[0_14px_34px_rgba(12,16,28,.08)]"
                    />
                  </section>
                ))}
              </div>
              <div className="mt-12 rounded-[14px] bg-[#11141c] p-5 text-white">
                <div className="flex items-center gap-2">
                  <span
                    className={`size-1.5 rounded-full ${publishReady ? 'bg-[#67dfca] shadow-[0_0_9px_#67dfca]' : 'bg-amber-300'}`}
                  />
                  <p className="text-sm font-medium">
                    {publishReady
                      ? '发布检查已完成'
                      : '内容已生成 · 待完成发布检查'}
                  </p>
                </div>
                <p className="mt-2 text-xs leading-6 text-white/52">
                  共 {includedSteps.length}{' '}
                  个步骤。界面名称和功能以录屏版本为准，导出前请完成内容与隐私核对。
                </p>
              </div>
            </article>
          )}
        </section>

        <aside
          aria-label="发布检查与交付"
          className="order-3 min-w-0 border-t border-white/[.07] bg-[#0b0e14] p-4 lg:order-none lg:overflow-y-auto lg:border-l lg:border-t-0"
        >
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[13px] font-medium text-white/88">发布检查</p>
              <p className="mt-1 text-[10px] uppercase tracking-[.1em] text-white/52">
                Publish checklist
              </p>
            </div>
            <span className="font-mono text-xs font-medium text-[#6fe0cb]">
              {completedCheckCount}
              <span className="text-white/52"> / {checkItems.length} 完成</span>
            </span>
          </div>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7657ff] to-[#62ddcc] transition-all"
              style={{
                width: `${(completedCheckCount / checkItems.length) * 100}%`,
              }}
            />
          </div>

          <div className="mt-6 space-y-1.5">
            {checkItems.map(([label, value, passed]) => (
              <div
                key={String(label)}
                className="flex items-center gap-3 rounded-[11px] border border-white/[.055] bg-white/[.025] p-3"
              >
                <span
                  className={`grid size-7 place-items-center rounded-[8px] ${passed ? 'bg-[#64ddc6]/[.08] text-[#6fe2cc]' : 'bg-amber-400/[.08] text-amber-300'}`}
                >
                  {passed ? (
                    <Check className="size-3.5" />
                  ) : (
                    <LockKeyhole className="size-3.5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-white/74">{label}</p>
                  <p className="mt-0.5 text-[11px] text-white/55">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[13px] border border-amber-300/10 bg-amber-300/[.045] p-4">
            <div className="flex items-center justify-between gap-2 text-amber-100/90">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-3.5" />
                <p className="text-[11px] font-medium">逐张截图检查</p>
              </div>
              <span className="font-mono text-[10px] text-amber-100/58">
                {privacyReviewedCount}/{includedSteps.length}
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-amber-100/58">
              只记录当前选中的截图，避免一次点击误把全部图片标记为已检查。
            </p>
            <div
              className="mt-3 grid grid-cols-5 gap-1.5"
              aria-label="截图隐私检查进度"
            >
              {includedSteps.map((step) => {
                const checked = privacyReviewedIds.has(step.id);
                const current = step.id === selectedStep.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    aria-label={`选择第 ${steps.findIndex((item) => item.id === step.id) + 1} 张截图，${checked ? '已检查' : '待检查'}`}
                    aria-pressed={current}
                    onClick={() => {
                      setSelectedId(step.id);
                      setMode('edit');
                    }}
                    className={`grid aspect-square place-items-center rounded-[7px] border font-mono text-[9px] transition ${checked ? 'border-[#69dfca]/20 bg-[#69dfca]/10 text-[#7ae5d1]' : current ? 'border-amber-200/30 bg-amber-200/10 text-amber-100' : 'border-white/[.08] bg-white/[.025] text-white/55 hover:text-white/75'}`}
                  >
                    {checked ? (
                      <Check className="size-3" />
                    ) : (
                      String(
                        steps.findIndex((item) => item.id === step.id) + 1,
                      ).padStart(2, '0')
                    )}
                  </button>
                );
              })}
            </div>
            <Button
              className="mt-3 w-full border-amber-200/10 bg-white/[.04] text-amber-100/70 hover:bg-white/[.08] hover:text-amber-100"
              variant="outline"
              size="sm"
              disabled={
                !selectedStep.included ||
                privacyReviewedIds.has(selectedStep.id)
              }
              onClick={confirmSelectedPrivacy}
            >
              {privacyReviewedIds.has(selectedStep.id) ? (
                <>
                  <Check data-icon="inline-start" /> 当前截图已检查
                </>
              ) : (
                `确认第 ${selectedIndex + 1} 张无敏感信息`
              )}
            </Button>
          </div>

          <div className="mt-6">
            <p className="text-[10px] font-medium uppercase tracking-[.12em] text-white/52">
              Delivery
            </p>
            <button
              disabled={Boolean(exporting)}
              onClick={() => void requestDelivery('rich')}
              className="mt-2 flex w-full items-center justify-between rounded-[12px] border border-[#8065ff]/20 bg-[#8065ff]/[.08] p-3 text-left transition hover:bg-[#8065ff]/[.14] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span className="flex items-center gap-2.5">
                {exporting === 'rich' ? (
                  <LoaderCircle className="size-3.5 animate-spin text-[#aa9bff]" />
                ) : (
                  <Clipboard className="size-3.5 text-[#aa9bff]" />
                )}
                <span>
                  <span className="block text-[11px] font-medium text-white/82">
                    复制公众号排版
                  </span>
                  <span className="mt-0.5 block text-[9px] text-white/55">
                    优先富文本 · 不支持时回退 Markdown
                  </span>
                </span>
              </span>
              <ArrowRight className="size-3.5 text-white/45" />
            </button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                disabled={Boolean(exporting)}
                onClick={() => void requestDelivery('markdown')}
                className="rounded-[12px] border border-white/[.06] bg-white/[.025] p-3 text-left transition hover:bg-white/[.05] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <FileText className="size-3.5 text-[#9f8dff]" />
                <p className="mt-2 text-[11px] font-medium text-white/78">
                  复制 Markdown
                </p>
                <p className="mt-0.5 text-[9px] text-white/55">
                  {isDemo ? '含在线图片' : '使用图文包相对路径'}
                </p>
              </button>
              <button
                disabled={Boolean(exporting)}
                onClick={() => void requestDelivery('zip')}
                className="rounded-[12px] border border-white/[.06] bg-white/[.025] p-3 text-left transition hover:bg-white/[.05] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {exporting === 'zip' ? (
                  <LoaderCircle className="size-3.5 animate-spin text-[#5fd8e9]" />
                ) : (
                  <Archive className="size-3.5 text-[#5fd8e9]" />
                )}
                <p className="mt-2 text-[11px] font-medium text-white/78">
                  独立图文包
                </p>
                <p className="mt-0.5 text-[9px] text-white/55">含文稿与图片</p>
              </button>
            </div>
            <button
              onClick={() => {
                setMode('preview');
                showNotice('已切换到公众号成稿预览');
              }}
              className="mt-2 flex w-full items-center justify-between rounded-[12px] border border-white/[.06] bg-white/[.025] p-3 text-left transition hover:bg-white/[.05]"
            >
              <span>
                <span className="text-[11px] font-medium text-white/78">
                  公众号成稿预览
                </span>
                <span className="ml-2 text-[9px] text-white/55">
                  查看完整排版
                </span>
              </span>
              <ArrowRight className="size-3.5 text-white/45" />
            </button>
          </div>

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  className="mt-6 w-full text-white/45 hover:bg-white/[.04] hover:text-white/75"
                  variant="ghost"
                />
              }
            >
              <RotateCcw data-icon="inline-start" />{' '}
              {isDemo ? '重新体验示例' : '处理另一段视频'}
            </AlertDialogTrigger>
            <AlertDialogContent className="border border-white/[.1] bg-[#12151d] text-white shadow-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {isDemo ? '清空本机草稿？' : '离开当前视频草稿？'}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-white/58">
                  这会清除标题、步骤修改、排序和检查进度，并返回首页。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="border-white/[.08] bg-white/[.025]">
                <AlertDialogCancel className="border-white/[.1] bg-transparent text-white/70 hover:bg-white/[.06] hover:text-white">
                  继续编辑
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-[#7657ff] text-white hover:bg-[#836dff]"
                  onClick={resetDraft}
                >
                  {isDemo ? '清空并重新体验' : '离开并选择新视频'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <p className="mt-4 text-[9px] leading-4 text-white/50">
            {isDemo
              ? '木瓦任务板及其中数据均为自有演示内容，不包含真实客户或业务数据。'
              : '视频和候选截图只在当前浏览器会话中处理；刷新或关闭页面后不会保留。'}
          </p>
        </aside>
      </div>

      {notice && (
        <output
          aria-live="polite"
          className={`fixed bottom-5 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-full border bg-[#141822]/95 px-4 py-2.5 text-xs font-medium text-white shadow-2xl backdrop-blur-xl ${notice.tone === 'success' ? 'border-[#6fe1cc]/20' : notice.tone === 'warning' ? 'border-amber-300/25' : 'border-red-400/25'}`}
        >
          {notice.tone === 'success' ? (
            <CheckCircle2 className="size-3.5 shrink-0 text-[#6fe1cc]" />
          ) : (
            <CircleAlert
              className={`size-3.5 shrink-0 ${notice.tone === 'warning' ? 'text-amber-300' : 'text-red-300'}`}
            />
          )}
          <span className="truncate">{notice.message}</span>
        </output>
      )}
    </main>
  );
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editorSource, setEditorSource] = useState<EditorSource>({
    kind: 'demo',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase]);

  if (phase === 'processing') {
    if (selectedFile) {
      return (
        <LocalProcessingView
          file={selectedFile}
          onCancel={() => {
            setSelectedFile(null);
            setPhase('upload');
          }}
          onComplete={(result) => {
            setEditorSource(localEditorSource(result));
            setPhase('editor');
          }}
        />
      );
    }
    return (
      <ProcessingView
        onCancel={() => setPhase('upload')}
        onComplete={() => {
          setEditorSource({ kind: 'demo' });
          setPhase('editor');
        }}
      />
    );
  }
  if (phase === 'editor') {
    return (
      <EditorView
        source={editorSource}
        onReset={() => {
          setSelectedFile(null);
          setEditorSource({ kind: 'demo' });
          setPhase('upload');
        }}
      />
    );
  }
  return (
    <UploadView
      onStart={(file) => {
        setSelectedFile(file ?? null);
        setPhase('processing');
      }}
      onResume={() => {
        setSelectedFile(null);
        setEditorSource({ kind: 'demo' });
        setPhase('editor');
      }}
    />
  );
}
