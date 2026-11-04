'use client';

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  Archive,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  Command,
  Flag,
  Inbox,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  Tag,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type Status = 'todo' | 'doing' | 'done';
type Priority = 'high' | 'medium' | 'low';
type ViewMode = 'board' | 'list';

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

type Task = {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  due: string;
  tags: string[];
  checklist: ChecklistItem[];
};

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-cover',
    title: '核对封面尺寸',
    description: '确认头图在手机端和分享卡片中的安全区域。',
    status: 'todo',
    priority: 'medium',
    due: '2026-11-02',
    tags: ['视觉'],
    checklist: [
      { id: 'cover-1', label: '检查移动端裁切', done: true },
      { id: 'cover-2', label: '检查分享卡片', done: false },
    ],
  },
  {
    id: 'task-rights',
    title: '检查图片版权',
    description: '逐张确认图片来源、授权范围与必要署名。',
    status: 'todo',
    priority: 'high',
    due: '2026-11-03',
    tags: ['发布', '风险'],
    checklist: [
      { id: 'rights-1', label: '核对图片来源', done: false },
      { id: 'rights-2', label: '移除无授权素材', done: false },
    ],
  },
  {
    id: 'task-summary',
    title: '确认标题与摘要',
    description: '统一文章标题、分享摘要和导出文件名。',
    status: 'todo',
    priority: 'low',
    due: '2026-11-04',
    tags: ['文案'],
    checklist: [],
  },
  {
    id: 'task-draft',
    title: '整理文章终稿',
    description: '完成结构精简，核对所有技术描述和能力边界。',
    status: 'doing',
    priority: 'high',
    due: '2026-11-02',
    tags: ['正文'],
    checklist: [
      { id: 'draft-1', label: '完成全文审校', done: true },
      { id: 'draft-2', label: '核对事实边界', done: true },
      { id: 'draft-3', label: '补齐配图说明', done: false },
      { id: 'draft-4', label: '完成发布预览', done: false },
    ],
  },
  {
    id: 'task-mobile',
    title: '完成手机预览',
    description: '检查小屏下的字号、图片清晰度和段落节奏。',
    status: 'doing',
    priority: 'medium',
    due: '2026-11-05',
    tags: ['验收'],
    checklist: [
      { id: 'mobile-1', label: '检查 iPhone 尺寸', done: true },
      { id: 'mobile-2', label: '检查安卓尺寸', done: false },
    ],
  },
  {
    id: 'task-topic',
    title: '确认选题方向',
    description: '明确文章面向教程创作者，聚焦录屏转图文场景。',
    status: 'done',
    priority: 'low',
    due: '2026-10-30',
    tags: ['选题'],
    checklist: [
      { id: 'topic-1', label: '确认目标读者', done: true },
      { id: 'topic-2', label: '确认文章主线', done: true },
    ],
  },
  {
    id: 'task-rhythm',
    title: '建立发布节奏',
    description: '确定录屏、配图、终审和发布四个节点。',
    status: 'done',
    priority: 'medium',
    due: '2026-10-31',
    tags: ['计划'],
    checklist: [
      { id: 'rhythm-1', label: '拆分四个节点', done: true },
      { id: 'rhythm-2', label: '确认交付顺序', done: true },
    ],
  },
];

const COLUMNS: Array<{
  id: Status;
  label: string;
  hint: string;
  icon: typeof Circle;
}> = [
  { id: 'todo', label: '待处理', hint: '下一步要做', icon: Circle },
  { id: 'doing', label: '进行中', hint: '正在推进', icon: Clock3 },
  { id: 'done', label: '已完成', hint: '本周归档', icon: CheckCircle2 },
];

const PRIORITIES: Record<
  Priority,
  { label: string; dot: string; text: string }
> = {
  high: { label: '高优先级', dot: 'bg-[#d45b55]', text: 'text-[#a43d38]' },
  medium: { label: '中优先级', dot: 'bg-[#d59a3a]', text: 'text-[#9a6b20]' },
  low: { label: '低优先级', dot: 'bg-[#7f8c85]', text: 'text-[#69736e]' },
};

const STATUS_LABELS: Record<Status, string> = {
  todo: '待处理',
  doing: '进行中',
  done: '已完成',
};

const FRESH_DRAFT = {
  title: '',
  description: '',
  priority: 'high' as Priority,
  due: '2026-11-06',
};

function formatDue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return '未设置';
  return `${Number(match[2])}月${Number(match[3])}日`;
}

function useModalKeyboard(
  containerRef: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusableSelector =
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
    const focusFirst = () => {
      const preferred = container.querySelector<HTMLElement>(
        '[data-initial-focus="true"]',
      );
      const first = container.querySelector<HTMLElement>(focusableSelector);
      (preferred ?? first ?? container).focus();
    };
    const frame = window.requestAnimationFrame(focusFirst);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => !element.hasAttribute('hidden'));
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef]);
}

function checklistProgress(task: Task) {
  const total = task.checklist.length;
  const done = task.checklist.filter((item) => item.done).length;
  return { total, done };
}

function TrafficLights() {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      <span className="size-3 rounded-full border border-black/10 bg-[#ff5f57] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,.08)]" />
      <span className="size-3 rounded-full border border-black/10 bg-[#febc2e] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,.08)]" />
      <span className="size-3 rounded-full border border-black/10 bg-[#28c840] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,.08)]" />
    </div>
  );
}

function TaskCard({
  task,
  selected,
  onSelect,
}: {
  task: Task;
  selected: boolean;
  onSelect: () => void;
}) {
  const progress = checklistProgress(task);
  const priority = PRIORITIES[task.priority];

  return (
    <button
      type="button"
      data-testid={`task-card-${task.id}`}
      onClick={onSelect}
      className={cn(
        'group w-full rounded-xl border bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(18,24,21,.04),0_8px_22px_rgba(18,24,21,.035)] transition-[border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-px hover:border-[#bccbc1] hover:shadow-[0_2px_5px_rgba(18,24,21,.06),0_12px_28px_rgba(18,24,21,.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f755f] focus-visible:ring-offset-2',
        selected
          ? 'border-[#8fa999] ring-2 ring-[#4f755f]/15'
          : 'border-black/8',
        task.status === 'done' && 'bg-[#fbfcfb]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            'text-[14px] leading-5 font-medium tracking-[-0.01em] text-[#26282a]',
            task.status === 'done' && 'text-[#666d69]',
          )}
        >
          {task.title}
        </span>
        <MoreHorizontal className="mt-0.5 size-4 shrink-0 text-[#a0a39f] opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#777c79]">
        <span className="inline-flex items-center gap-1.5">
          <span className={cn('size-1.5 rounded-full', priority.dot)} />
          {formatDue(task.due)}
        </span>
        {progress.total > 0 && (
          <span className="inline-flex items-center gap-1 text-[#7c817e]">
            <CheckCircle2 className="size-3.5" />
            {progress.done}/{progress.total}
          </span>
        )}
      </div>

      {task.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {task.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-[#eef2ef] px-2 py-0.5 text-[11px] font-medium text-[#617067]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

function NewTaskDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (draft: typeof FRESH_DRAFT) => void;
}) {
  const [draft, setDraft] = useState(FRESH_DRAFT);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useModalKeyboard(dialogRef, onClose);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#1f2421]/18 p-5 backdrop-blur-[2px]">
      <dialog
        ref={dialogRef}
        open
        aria-modal="true"
        aria-labelledby="new-task-title"
        tabIndex={-1}
        className="relative m-0 w-full max-w-[470px] overflow-hidden rounded-[18px] border border-white/70 bg-[#fbfbfc]/95 p-0 text-[#1d1d1f] shadow-[0_28px_80px_rgba(29,35,31,.24),0_2px_8px_rgba(29,35,31,.08)] backdrop-blur-2xl"
      >
        <div className="flex items-center justify-between border-b border-black/8 px-5 py-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.08em] text-[#8a8f8b] uppercase">
              内容发布
            </p>
            <h2
              id="new-task-title"
              className="mt-0.5 text-[18px] font-semibold tracking-[-0.02em] text-[#202321]"
            >
              新建任务
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="关闭新建任务"
            className="rounded-lg text-[#6f7471] hover:bg-black/5"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <label htmlFor="new-task-name" className="block space-y-2">
            <span className="text-[12px] font-medium text-[#5f6561]">
              任务名称
            </span>
            <Input
              id="new-task-name"
              autoFocus
              data-initial-focus="true"
              data-testid="task-title-input"
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="例如：检查交付清单"
              className="h-10 rounded-[9px] border-black/10 bg-white px-3 text-[14px] text-[#202321] shadow-[inset_0_1px_1px_rgba(0,0,0,.02)] focus-visible:border-[#6f8f7b] focus-visible:ring-[#4f755f]/15"
            />
          </label>

          <label htmlFor="new-task-description" className="block space-y-2">
            <span className="text-[12px] font-medium text-[#5f6561]">说明</span>
            <Textarea
              id="new-task-description"
              data-testid="task-description-input"
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="写下完成标准或交付要求…"
              className="min-h-24 resize-none rounded-[9px] border-black/10 bg-white px-3 py-2.5 text-[14px] leading-5 text-[#202321] focus-visible:border-[#6f8f7b] focus-visible:ring-[#4f755f]/15"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <span className="text-[12px] font-medium text-[#5f6561]">
                优先级
              </span>
              <fieldset className="grid grid-cols-3 rounded-[9px] bg-[#eceeed] p-0.5">
                <legend className="sr-only">优先级</legend>
                {(['high', 'medium', 'low'] as Priority[]).map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    aria-pressed={draft.priority === priority}
                    data-testid={`priority-${priority}`}
                    onClick={() =>
                      setDraft((current) => ({ ...current, priority }))
                    }
                    className={cn(
                      'rounded-[7px] px-2 py-1.5 text-[11px] font-medium transition-all',
                      draft.priority === priority
                        ? 'bg-white text-[#303531] shadow-[0_1px_3px_rgba(0,0,0,.1)]'
                        : 'text-[#787e7a] hover:text-[#454a47]',
                    )}
                  >
                    {priority === 'high'
                      ? '高'
                      : priority === 'medium'
                        ? '中'
                        : '低'}
                  </button>
                ))}
              </fieldset>
            </div>

            <label htmlFor="new-task-due" className="space-y-2">
              <span className="text-[12px] font-medium text-[#5f6561]">
                计划完成
              </span>
              <Input
                id="new-task-due"
                type="date"
                value={draft.due}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    due: event.target.value,
                  }))
                }
                className="h-9 rounded-[9px] border-black/10 bg-white text-[12px] text-[#454a47] focus-visible:border-[#6f8f7b] focus-visible:ring-[#4f755f]/15"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-black/8 bg-[#f6f7f6]/80 px-5 py-3.5">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-8 rounded-lg px-3 text-[13px] text-[#5e6460] hover:bg-black/5"
          >
            取消
          </Button>
          <Button
            type="button"
            data-testid="create-task-button"
            disabled={!draft.title.trim()}
            onClick={() => onCreate(draft)}
            className="h-8 rounded-lg bg-[#4f755f] px-3.5 text-[13px] text-white shadow-[0_1px_2px_rgba(38,69,49,.2)] hover:bg-[#426650]"
          >
            创建任务
          </Button>
        </div>
      </dialog>
    </div>
  );
}

function TaskInspector({
  task,
  onClose,
  onUpdate,
  onComplete,
}: {
  task: Task;
  onClose: () => void;
  onUpdate: (patch: Partial<Task>) => void;
  onComplete: () => void;
}) {
  const progress = checklistProgress(task);
  const inspectorRef = useRef<HTMLDialogElement>(null);
  useModalKeyboard(inspectorRef, onClose);

  const toggleChecklist = (itemId: string) => {
    onUpdate({
      checklist: task.checklist.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item,
      ),
    });
  };

  return (
    <dialog
      ref={inspectorRef}
      open
      aria-modal="true"
      aria-labelledby="task-inspector-title"
      tabIndex={-1}
      className="absolute inset-y-0 right-0 z-30 m-0 flex h-full w-full flex-col border-0 border-l border-black/10 bg-[#fbfbfc]/96 p-0 text-[#1d1d1f] shadow-[-18px_0_48px_rgba(31,38,33,.09)] backdrop-blur-2xl sm:w-[360px]"
    >
      <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-black/8 px-4">
        <span
          id="task-inspector-title"
          className="text-[12px] font-medium text-[#707572]"
        >
          任务详情
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="关闭任务详情"
          className="rounded-lg text-[#727774] hover:bg-black/5"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onComplete}
            aria-label={task.status === 'done' ? '重新打开任务' : '标记为完成'}
            className={cn(
              'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f755f] focus-visible:ring-offset-2',
              task.status === 'done'
                ? 'border-[#4f755f] bg-[#4f755f] text-white'
                : 'border-[#a8afa9] bg-white text-transparent hover:border-[#4f755f] hover:text-[#4f755f]',
            )}
          >
            <Check className="size-3" strokeWidth={2.4} />
          </button>
          <textarea
            aria-label="任务标题"
            value={task.title}
            onChange={(event) => onUpdate({ title: event.target.value })}
            rows={2}
            className="min-h-14 flex-1 resize-none bg-transparent text-[19px] leading-7 font-semibold tracking-[-0.025em] text-[#1f2220] outline-none"
          />
        </div>

        <div className="mt-5 divide-y divide-black/7 rounded-xl border border-black/8 bg-white/75 px-3.5">
          <label className="grid min-h-11 grid-cols-[92px_1fr] items-center gap-3">
            <span className="flex items-center gap-2 text-[12px] text-[#7d827f]">
              <Clock3 className="size-3.5" /> 状态
            </span>
            <select
              data-testid="inspector-status"
              value={task.status}
              onChange={(event) => {
                const status = event.target.value as Status;
                onUpdate({
                  status,
                  checklist:
                    status === 'done'
                      ? task.checklist.map((item) => ({ ...item, done: true }))
                      : task.checklist,
                });
              }}
              className="w-full appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2212%22%20height=%2212%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%236e746f%22%20stroke-width=%222%22%3E%3Cpath%20d=%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')] bg-[length:12px] bg-[right_2px_center] bg-no-repeat py-2 text-[12px] font-medium text-[#363b37] outline-none"
            >
              {COLUMNS.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid min-h-11 grid-cols-[92px_1fr] items-center gap-3">
            <span className="flex items-center gap-2 text-[12px] text-[#7d827f]">
              <Flag className="size-3.5" /> 优先级
            </span>
            <select
              value={task.priority}
              onChange={(event) =>
                onUpdate({ priority: event.target.value as Priority })
              }
              className="w-full appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2212%22%20height=%2212%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%236e746f%22%20stroke-width=%222%22%3E%3Cpath%20d=%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')] bg-[length:12px] bg-[right_2px_center] bg-no-repeat py-2 text-[12px] font-medium text-[#363b37] outline-none"
            >
              {(Object.keys(PRIORITIES) as Priority[]).map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITIES[priority].label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid min-h-11 grid-cols-[92px_1fr] items-center gap-3">
            <span className="flex items-center gap-2 text-[12px] text-[#7d827f]">
              <CalendarDays className="size-3.5" /> 日期
            </span>
            <input
              type="date"
              value={task.due}
              onChange={(event) => onUpdate({ due: event.target.value })}
              className="w-full bg-transparent py-2 text-[12px] font-medium text-[#363b37] outline-none"
            />
          </label>

          <div className="grid min-h-11 grid-cols-[92px_1fr] items-center gap-3">
            <span className="flex items-center gap-2 text-[12px] text-[#7d827f]">
              <Tag className="size-3.5" /> 标签
            </span>
            <div className="flex flex-wrap gap-1.5 py-2">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-[#edf2ee] px-2 py-0.5 text-[11px] font-medium text-[#5e6f64]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#4d534f]">
              说明
            </span>
            <span className="text-[10px] text-[#999e9a]">刷新后重置</span>
          </div>
          <Textarea
            value={task.description}
            onChange={(event) => onUpdate({ description: event.target.value })}
            placeholder="添加说明…"
            className="min-h-24 resize-none rounded-[10px] border-black/8 bg-white/75 px-3 py-2.5 text-[13px] leading-5 text-[#444945] focus-visible:border-[#6f8f7b] focus-visible:ring-[#4f755f]/15"
          />
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#4d534f]">
              检查清单
            </span>
            <span className="text-[11px] tabular-nums text-[#8a8f8b]">
              {progress.done}/{progress.total}
            </span>
          </div>
          <div className="space-y-1.5">
            {task.checklist.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleChecklist(item.id)}
                aria-pressed={item.done}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[12px] text-[#4b514d] transition-colors hover:bg-black/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f755f]/60"
              >
                <span
                  className={cn(
                    'flex size-[18px] shrink-0 items-center justify-center rounded-full border transition-colors',
                    item.done
                      ? 'border-[#4f755f] bg-[#4f755f] text-white'
                      : 'border-[#b7bdb8] bg-white text-transparent',
                  )}
                >
                  <Check className="size-3" />
                </span>
                <span
                  className={cn(item.done && 'text-[#8b918d] line-through')}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-black/8 bg-[#f6f7f6]/90 p-3.5">
        <Button
          type="button"
          data-testid="complete-task-button"
          onClick={onComplete}
          className={cn(
            'h-9 w-full rounded-[9px] text-[13px] shadow-sm',
            task.status === 'done'
              ? 'bg-white text-[#4f755f] ring-1 ring-black/8 hover:bg-[#f2f5f3]'
              : 'bg-[#4f755f] text-white hover:bg-[#426650]',
          )}
        >
          {task.status === 'done' ? (
            <>
              <RotateCcw className="size-4" /> 重新打开任务
            </>
          ) : (
            <>
              <Check className="size-4" /> 标记为完成
            </>
          )}
        </Button>
      </div>
    </dialog>
  );
}

export function MuwaBoard() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [view, setView] = useState<ViewMode>('board');
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const newTaskButtonRef = useRef<HTMLButtonElement>(null);
  const lastTaskTriggerRef = useRef<HTMLElement | null>(null);

  const selectedTask = tasks.find((task) => task.id === selectedId) ?? null;
  const filteredTasks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return tasks;
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(normalized) ||
        task.tags.some((tag) => tag.toLowerCase().includes(normalized)),
    );
  }, [query, tasks]);

  const completedCount = tasks.filter((task) => task.status === 'done').length;
  const completion = Math.round((completedCount / tasks.length) * 100);

  const openTask = (taskId: string) => {
    lastTaskTriggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setSelectedId(taskId);
  };

  const closeTask = () => {
    setSelectedId(null);
    window.requestAnimationFrame(() => lastTaskTriggerRef.current?.focus());
  };

  const closeComposer = () => {
    setComposerOpen(false);
    window.requestAnimationFrame(() => newTaskButtonRef.current?.focus());
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const updateTask = (id: string, patch: Partial<Task>) => {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, ...patch } : task)),
    );
  };

  const createTask = (draft: typeof FRESH_DRAFT) => {
    const id = `task-${Date.now()}`;
    const task: Task = {
      id,
      title: draft.title.trim(),
      description:
        draft.description.trim() || '完成交付前检查，确认内容可以安全发布。',
      status: 'todo',
      priority: draft.priority,
      due: draft.due,
      tags: ['发布', '检查'],
      checklist: [
        { id: `${id}-1`, label: '检查账号与姓名', done: false },
        { id: `${id}-2`, label: '检查图片与文件路径', done: false },
        { id: `${id}-3`, label: '确认内容可以发布', done: false },
      ],
    };
    setTasks((current) => [task, ...current]);
    lastTaskTriggerRef.current = newTaskButtonRef.current;
    setSelectedId(id);
    setComposerOpen(false);
    setToast('任务已创建');
  };

  const toggleComplete = (task: Task) => {
    const reopening = task.status === 'done';
    updateTask(task.id, {
      status: reopening ? 'doing' : 'done',
      checklist: reopening
        ? task.checklist
        : task.checklist.map((item) => ({ ...item, done: true })),
    });
    setToast(reopening ? '任务已重新打开' : '已移到「已完成」');
  };

  const resetDemo = () => {
    setTasks(INITIAL_TASKS);
    setSelectedId(null);
    setComposerOpen(false);
    setQuery('');
    setView('board');
    setToast('演示数据已重置');
  };

  return (
    <main
      className="flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#e9eaed] p-0 text-[#1d1d1f] sm:p-6"
      style={{
        backgroundImage:
          'radial-gradient(circle at 18% 14%, rgba(255,255,255,.9), transparent 30%), linear-gradient(145deg, #eef0f2 0%, #e4e8e5 48%, #e7e6eb 100%)',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Helvetica Neue", sans-serif',
      }}
    >
      <section className="relative flex h-[100dvh] w-full flex-col overflow-hidden border-white/80 bg-[#f8f8f9] shadow-[0_24px_70px_rgba(25,31,27,.16),0_2px_10px_rgba(25,31,27,.08)] sm:h-[min(820px,calc(100dvh-48px))] sm:w-[min(1380px,calc(100vw-48px))] sm:rounded-[18px] sm:border">
        <div
          className="contents"
          inert={selectedTask || composerOpen ? true : undefined}
          aria-hidden={selectedTask || composerOpen ? true : undefined}
        >
          <header className="relative z-20 flex h-[52px] shrink-0 items-center border-b border-black/10 bg-[#f4f4f6]/88 px-4 backdrop-blur-2xl">
            <div className="flex w-[180px] items-center gap-4 lg:w-[224px]">
              <TrafficLights />
            </div>

            <div className="pointer-events-none absolute inset-x-0 flex justify-center">
              <span className="text-[12px] font-medium tracking-[-0.01em] text-[#555a57]">
                内容发布
              </span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="hidden h-8 items-center gap-2 rounded-lg border border-black/8 bg-white/70 px-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.8)] md:flex">
                <Search className="size-3.5 text-[#8b908d]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索任务…"
                  aria-label="搜索任务"
                  className="w-28 bg-transparent text-[12px] text-[#343936] outline-none placeholder:text-[#9da19e] lg:w-36"
                />
                <span className="flex items-center gap-0.5 rounded border border-black/8 bg-[#f1f2f1] px-1 py-0.5 text-[9px] text-[#8b908d]">
                  <Command className="size-2.5" /> K
                </span>
              </div>

              <Button
                type="button"
                data-testid="reset-demo-button"
                variant="ghost"
                size="icon"
                onClick={resetDemo}
                aria-label="重置演示"
                className="size-10 rounded-lg text-[#6e746f] hover:bg-black/5 sm:size-8"
              >
                <RotateCcw className="size-4" />
              </Button>

              <Button
                ref={newTaskButtonRef}
                type="button"
                data-testid="new-task-button"
                onClick={() => setComposerOpen(true)}
                aria-label="新建任务"
                className="h-10 rounded-lg bg-[#4f755f] px-3 text-[12px] text-white shadow-[0_1px_2px_rgba(38,69,49,.18)] hover:bg-[#426650] sm:h-8"
              >
                <Plus className="size-3.5" />
                <span className="hidden sm:inline">新建任务</span>
              </Button>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[224px_minmax(0,1fr)]">
            <aside className="hidden min-h-0 flex-col border-r border-black/9 bg-[#f1f1f4]/80 px-3 py-4 backdrop-blur-xl lg:flex">
              <div className="flex items-center gap-2.5 px-2">
                <div className="flex size-8 items-center justify-center rounded-[9px] bg-[#4f755f] text-[14px] font-semibold text-white shadow-[0_2px_6px_rgba(44,76,55,.18)]">
                  木
                </div>
                <div>
                  <p className="text-[13px] font-semibold tracking-[-0.01em] text-[#2c302d]">
                    木瓦任务板
                  </p>
                  <p className="text-[10px] text-[#909490]">内容工作室</p>
                </div>
                <ChevronDown className="ml-auto size-3.5 text-[#8c918d]" />
              </div>

              <nav className="mt-6 space-y-1" aria-label="主要导航">
                {[
                  { label: '收件箱', icon: Inbox, count: 3 },
                  { label: '今天', icon: CalendarDays, count: 4 },
                  { label: '已完成', icon: Archive, count: completedCount },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setToast(`${item.label}为案例展示入口`)}
                    className="flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-[12px] text-[#5f6561] transition-colors hover:bg-black/[0.045]"
                  >
                    <item.icon className="size-4 text-[#747a76]" />
                    {item.label}
                    <span className="ml-auto text-[10px] tabular-nums text-[#9a9f9b]">
                      {item.count}
                    </span>
                  </button>
                ))}
              </nav>

              <div className="mt-7 px-2.5 text-[10px] font-semibold tracking-[0.08em] text-[#9a9f9b] uppercase">
                项目
              </div>
              <button
                type="button"
                className="mt-2 flex h-9 w-full items-center gap-2.5 rounded-lg bg-[#dfe7e1] px-2.5 text-[12px] font-medium text-[#3f5d49] shadow-[inset_0_0_0_1px_rgba(79,117,95,.08)]"
              >
                <span className="size-2 rounded-sm bg-[#4f755f]" />
                内容发布
                <span className="ml-auto text-[10px] tabular-nums text-[#708078]">
                  {tasks.length}
                </span>
              </button>

              <div className="mt-auto rounded-xl border border-black/7 bg-white/55 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#5f6561]">
                    本周进度
                  </span>
                  <span className="text-[11px] font-semibold tabular-nums text-[#4f755f]">
                    {completion}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/[0.055]">
                  <div
                    className="h-full rounded-full bg-[#4f755f] transition-[width] duration-300"
                    style={{ width: `${completion}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] leading-4 text-[#8a8f8b]">
                  {completedCount} 项完成 · {tasks.length - completedCount}{' '}
                  项待推进
                </p>
              </div>
            </aside>

            <section className="flex min-w-0 flex-col bg-[#fafafb]">
              <div className="flex shrink-0 flex-col gap-3 border-b border-black/7 px-4 py-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:py-5">
                <div>
                  <div className="flex items-center gap-2 text-[11px] text-[#8b908d]">
                    <span>项目</span>
                    <span>/</span>
                    <span>内容发布</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <h1 className="text-[25px] leading-8 font-semibold tracking-[-0.035em] text-[#202321] sm:text-[28px]">
                      公众号发布
                    </h1>
                    <span className="rounded-md bg-[#eaf0ec] px-2 py-1 text-[10px] font-medium text-[#587063]">
                      自有案例
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-[#7d827f]">
                    从终稿检查到发布归档，保持每一步清楚可追踪。
                  </p>
                  <label className="mt-3 flex h-10 items-center gap-2 rounded-[10px] border border-black/8 bg-white px-3 shadow-[inset_0_1px_0_rgba(255,255,255,.8)] md:hidden">
                    <Search className="size-4 text-[#8b908d]" />
                    <span className="sr-only">搜索任务</span>
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="搜索任务…"
                      className="min-w-0 flex-1 bg-transparent text-[13px] text-[#343936] outline-none placeholder:text-[#9da19e]"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <div className="grid h-8 grid-cols-2 rounded-[9px] bg-[#eceeed] p-0.5">
                    <button
                      type="button"
                      onClick={() => setView('board')}
                      aria-pressed={view === 'board'}
                      className={cn(
                        'flex items-center gap-1.5 rounded-[7px] px-2.5 text-[11px] font-medium transition-all',
                        view === 'board'
                          ? 'bg-white text-[#3f4541] shadow-[0_1px_3px_rgba(0,0,0,.1)]'
                          : 'text-[#787e7a]',
                      )}
                    >
                      <LayoutGrid className="size-3.5" /> 看板
                    </button>
                    <button
                      type="button"
                      onClick={() => setView('list')}
                      aria-pressed={view === 'list'}
                      className={cn(
                        'flex items-center gap-1.5 rounded-[7px] px-2.5 text-[11px] font-medium transition-all',
                        view === 'list'
                          ? 'bg-white text-[#3f4541] shadow-[0_1px_3px_rgba(0,0,0,.1)]'
                          : 'text-[#787e7a]',
                      )}
                    >
                      <List className="size-3.5" /> 列表
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setToast('筛选条件已是默认状态')}
                    aria-label="筛选任务"
                    className="size-8 rounded-[9px] border-black/8 bg-white text-[#6d736f] shadow-none hover:bg-[#f4f5f4]"
                  >
                    <Settings2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              {view === 'board' ? (
                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 md:overflow-x-auto md:overflow-y-hidden lg:p-6">
                  <div className="grid h-auto grid-cols-1 gap-4 md:h-full md:min-w-[820px] md:grid-cols-3">
                    {COLUMNS.map((column) => {
                      const columnTasks = filteredTasks.filter(
                        (task) => task.status === column.id,
                      );
                      const ColumnIcon = column.icon;
                      return (
                        <section
                          key={column.id}
                          className="flex min-h-[240px] min-w-0 flex-col overflow-hidden rounded-[14px] border border-black/[0.065] bg-[#f2f3f2] md:min-h-0"
                        >
                          <div className="flex shrink-0 items-center gap-2.5 px-3.5 py-3">
                            <ColumnIcon
                              className={cn(
                                'size-4',
                                column.id === 'done'
                                  ? 'text-[#4f755f]'
                                  : column.id === 'doing'
                                    ? 'text-[#b17a2e]'
                                    : 'text-[#7f8681]',
                              )}
                            />
                            <div>
                              <p className="text-[12px] font-semibold text-[#484e4a]">
                                {column.label}
                              </p>
                              <p className="text-[9px] text-[#929792]">
                                {column.hint}
                              </p>
                            </div>
                            <span className="ml-auto rounded-md bg-white/70 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-[#7b817c] shadow-[inset_0_0_0_1px_rgba(0,0,0,.04)]">
                              {columnTasks.length}
                            </span>
                          </div>
                          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-2.5 pb-3">
                            {columnTasks.map((task) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                selected={task.id === selectedId}
                                onSelect={() => openTask(task.id)}
                              />
                            ))}
                            {columnTasks.length === 0 && (
                              <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-black/10 text-[11px] text-[#9ca19d]">
                                暂无任务
                              </div>
                            )}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
                  <div className="overflow-hidden rounded-[14px] border border-black/8 bg-white">
                    <div className="hidden grid-cols-[minmax(220px,1fr)_110px_110px_100px] border-b border-black/8 bg-[#f5f6f5] px-4 py-2.5 text-[10px] font-semibold tracking-[0.04em] text-[#898e8a] uppercase sm:grid">
                      <span>任务</span>
                      <span>状态</span>
                      <span>优先级</span>
                      <span>日期</span>
                    </div>
                    {filteredTasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => openTask(task.id)}
                        className="hidden w-full grid-cols-[minmax(220px,1fr)_110px_110px_100px] items-center border-b border-black/[0.055] px-4 py-3 text-left text-[12px] text-[#4a504c] transition-colors last:border-b-0 hover:bg-[#f7f9f7] sm:grid"
                      >
                        <span className="truncate font-medium text-[#303531]">
                          {task.title}
                        </span>
                        <span>{STATUS_LABELS[task.status]}</span>
                        <span className={PRIORITIES[task.priority].text}>
                          {PRIORITIES[task.priority].label}
                        </span>
                        <span className="tabular-nums text-[#7d827f]">
                          {formatDue(task.due)}
                        </span>
                      </button>
                    ))}
                    {filteredTasks.map((task) => (
                      <button
                        key={`${task.id}-mobile`}
                        type="button"
                        onClick={() => openTask(task.id)}
                        className="block min-h-16 w-full border-b border-black/[0.055] px-4 py-3 text-left last:border-b-0 hover:bg-[#f7f9f7] sm:hidden"
                      >
                        <span className="block truncate text-[13px] font-medium text-[#303531]">
                          {task.title}
                        </span>
                        <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#737a75]">
                          <span>{STATUS_LABELS[task.status]}</span>
                          <span className={PRIORITIES[task.priority].text}>
                            {PRIORITIES[task.priority].label}
                          </span>
                          <span>{formatDue(task.due)}</span>
                        </span>
                      </button>
                    ))}
                    {filteredTasks.length === 0 && (
                      <div className="px-4 py-12 text-center text-[12px] text-[#909590]">
                        没有匹配的任务
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {selectedTask && (
          <>
            <button
              type="button"
              aria-label="关闭任务详情"
              onClick={closeTask}
              className="absolute inset-0 z-20 bg-black/5"
            />
            <TaskInspector
              task={selectedTask}
              onClose={closeTask}
              onUpdate={(patch) => updateTask(selectedTask.id, patch)}
              onComplete={() => toggleComplete(selectedTask)}
            />
          </>
        )}

        {composerOpen && (
          <NewTaskDialog onClose={closeComposer} onCreate={createTask} />
        )}

        {toast && (
          <output
            aria-live="polite"
            className="absolute bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-[10px] border border-white/15 bg-[#262b28]/94 px-3.5 py-2 text-[12px] font-medium text-white shadow-[0_12px_32px_rgba(0,0,0,.22)] backdrop-blur-xl"
          >
            <Check className="size-3.5 text-[#b9d4c3]" />
            {toast}
          </output>
        )}
      </section>
    </main>
  );
}
