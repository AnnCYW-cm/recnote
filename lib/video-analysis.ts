export type VideoAnalysisStage =
  | 'loading'
  | 'sampling'
  | 'selecting'
  | 'capturing'
  | 'complete';

export type VideoAnalysisProgress = {
  stage: VideoAnalysisStage;
  percent: number;
  detail: string;
  completed: number;
  total: number;
};

export type AnalyzedVideoFrame = {
  id: number;
  timestampSeconds: number;
  time: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  score: number;
};

export type VideoAnalysisResult = {
  fileName: string;
  duration: number;
  width: number;
  height: number;
  sampleCount: number;
  frames: AnalyzedVideoFrame[];
};

type AnalyzeVideoOptions = {
  signal?: AbortSignal;
  onProgress?: (progress: VideoAnalysisProgress) => void;
};

type Sample = {
  timestampSeconds: number;
  score: number;
  pixels: Uint8Array;
};

const MAX_FILE_BYTES = 500 * 1024 * 1024;
const MAX_DURATION_SECONDS = 5 * 60;
const MAX_SAMPLE_COUNT = 120;
const ANALYSIS_WIDTH = 160;
const MAX_CAPTURE_WIDTH = 1600;
const MIN_CHANGE_SCORE = 0.008;
const MIN_DISTINCT_PIXEL_DIFFERENCE = 0.006;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function abortError() {
  return new DOMException('视频处理已取消', 'AbortError');
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw abortError();
}

export function validateVideoFile(file: File) {
  const supported =
    ['video/mp4', 'video/quicktime', 'video/webm'].includes(file.type) ||
    /\.(mov|mp4|webm)$/i.test(file.name);
  if (!supported) return '暂不支持这个格式，请选择 MP4、MOV 或 WebM 录屏';
  if (file.size === 0) return '这个视频文件是空的，请重新选择';
  if (file.size > MAX_FILE_BYTES)
    return '首个开源版本暂时只处理 500 MB 以内的视频';
  return null;
}

function waitForVideoReady(video: HTMLVideoElement, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('读取视频超时，请换一段更短的 H.264 MP4 重试'));
    }, 20_000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener('loadeddata', handleReady);
      video.removeEventListener('error', handleError);
      signal?.removeEventListener('abort', handleAbort);
    };
    const handleReady = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(
        new Error('浏览器无法解码这段视频；建议转成 H.264 编码的 MP4 后再试'),
      );
    };
    const handleAbort = () => {
      cleanup();
      reject(abortError());
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      cleanup();
      resolve();
      return;
    }
    video.addEventListener('loadeddata', handleReady, { once: true });
    video.addEventListener('error', handleError, { once: true });
    signal?.addEventListener('abort', handleAbort, { once: true });
  });
}

function seekVideo(
  video: HTMLVideoElement,
  timestampSeconds: number,
  signal?: AbortSignal,
) {
  return new Promise<void>((resolve, reject) => {
    throwIfAborted(signal);
    const target = clamp(
      timestampSeconds,
      0,
      Math.max(0, video.duration - 0.01),
    );
    if (
      Math.abs(video.currentTime - target) < 0.005 &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      resolve();
      return;
    }

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('读取视频画面超时，请换一段更短的视频重试'));
    }, 12_000);
    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
      signal?.removeEventListener('abort', handleAbort);
    };
    const handleSeeked = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error('读取视频画面失败，请确认视频文件可以正常播放'));
    };
    const handleAbort = () => {
      cleanup();
      reject(abortError());
    };

    video.addEventListener('seeked', handleSeeked, { once: true });
    video.addEventListener('error', handleError, { once: true });
    signal?.addEventListener('abort', handleAbort, { once: true });
    video.currentTime = target;
  });
}

function readGrayscaleFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
) {
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const grayscale = new Uint8Array(canvas.width * canvas.height);
  for (let source = 0, target = 0; source < rgba.length; source += 4) {
    grayscale[target] = Math.round(
      rgba[source] * 0.299 +
        rgba[source + 1] * 0.587 +
        rgba[source + 2] * 0.114,
    );
    target += 1;
  }
  return grayscale;
}

function frameDifference(
  current: Uint8Array,
  previous: Uint8Array,
  width: number,
  height: number,
) {
  const columns = 4;
  const rows = 4;
  const tileTotals = new Float64Array(columns * rows);
  const tileCounts = new Uint32Array(columns * rows);
  let total = 0;

  for (let index = 0; index < current.length; index += 1) {
    const difference = Math.abs(current[index] - previous[index]) / 255;
    total += difference;
    const x = index % width;
    const y = Math.floor(index / width);
    const tileX = Math.min(columns - 1, Math.floor((x / width) * columns));
    const tileY = Math.min(rows - 1, Math.floor((y / height) * rows));
    const tile = tileY * columns + tileX;
    tileTotals[tile] += difference;
    tileCounts[tile] += 1;
  }

  const globalDifference = total / current.length;
  let strongestLocalDifference = 0;
  for (let index = 0; index < tileTotals.length; index += 1) {
    strongestLocalDifference = Math.max(
      strongestLocalDifference,
      tileTotals[index] / Math.max(1, tileCounts[index]),
    );
  }
  return clamp(globalDifference * 0.48 + strongestLocalDifference * 0.52, 0, 1);
}

function averagePixelDifference(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length || left.length === 0) return 1;
  let total = 0;
  for (let index = 0; index < left.length; index += 1)
    total += Math.abs(left[index] - right[index]) / 255;
  return total / left.length;
}

function buildSampleTimes(duration: number) {
  const count = clamp(Math.ceil(duration / 0.45) + 1, 12, MAX_SAMPLE_COUNT);
  const start = Math.min(0.25, duration / 8);
  const end = Math.max(start, duration - Math.min(0.25, duration / 8));
  if (count <= 1 || end <= start) return [Math.max(0, duration / 2)];
  return Array.from(
    { length: count },
    (_, index) => start + ((end - start) * index) / (count - 1),
  );
}

function selectCandidateSamples(samples: Sample[], duration: number) {
  if (samples.length === 0) return [];
  const targetCount = clamp(Math.round(duration / 3) + 1, 4, 10);
  const observedMaxScore = Math.max(
    0,
    ...samples.slice(1).map((sample) => sample.score),
  );
  if (observedMaxScore < MIN_CHANGE_SCORE) return [samples[0]];

  const meaningfulScore = Math.max(MIN_CHANGE_SCORE, observedMaxScore * 0.12);
  const selected = new Set<number>([0]);
  const minimumGap = Math.max(0.65, duration / (targetCount * 3.5));

  const canSelect = (index: number) =>
    [...selected].every((selectedIndex) => {
      const separatedInTime =
        Math.abs(
          samples[selectedIndex].timestampSeconds -
            samples[index].timestampSeconds,
        ) >= minimumGap;
      const visuallyDistinct =
        averagePixelDifference(
          samples[selectedIndex].pixels,
          samples[index].pixels,
        ) >= MIN_DISTINCT_PIXEL_DIFFERENCE;
      return separatedInTime && visuallyDistinct;
    });

  const ranked = samples
    .map((sample, index) => ({ ...sample, index }))
    .slice(1)
    .filter((sample) => sample.score >= meaningfulScore)
    .sort((left, right) => right.score - left.score);

  for (const candidate of ranked) {
    if (selected.size >= targetCount) break;
    if (canSelect(candidate.index)) selected.add(candidate.index);
  }

  for (
    let slot = 1;
    selected.size < targetCount && slot < targetCount;
    slot += 1
  ) {
    const targetTime = (duration * slot) / Math.max(1, targetCount - 1);
    const fallback = samples
      .map((sample, index) => ({
        index,
        distance: Math.abs(sample.timestampSeconds - targetTime),
      }))
      .filter(
        ({ index }) =>
          !selected.has(index) &&
          samples[index].score >= MIN_CHANGE_SCORE / 2 &&
          canSelect(index),
      )
      .sort((left, right) => left.distance - right.distance)[0];
    if (fallback) selected.add(fallback.index);
  }

  const finalIndex = samples.length - 1;
  if (selected.size < targetCount && canSelect(finalIndex))
    selected.add(finalIndex);

  return [...selected]
    .sort(
      (left, right) =>
        samples[left].timestampSeconds - samples[right].timestampSeconds,
    )
    .slice(0, targetCount)
    .map((index) => samples[index]);
}

export function formatVideoTimestamp(timestampSeconds: number) {
  const totalSeconds = Math.max(0, Math.round(timestampSeconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, '0'))
      .join(':');
  }
  return [minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

function captureFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
) {
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.88);
}

export async function analyzeVideo(
  file: File,
  { signal, onProgress }: AnalyzeVideoOptions = {},
): Promise<VideoAnalysisResult> {
  const validationError = validateVideoFile(file);
  if (validationError) throw new Error(validationError);
  throwIfAborted(signal);

  const report = (
    stage: VideoAnalysisStage,
    percent: number,
    detail: string,
    completed = 0,
    total = 0,
  ) => onProgress?.({ stage, percent, detail, completed, total });

  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.src = objectUrl;

  try {
    report('loading', 3, '正在读取视频元数据');
    video.load();
    await waitForVideoReady(video, signal);
    throwIfAborted(signal);

    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0)
      throw new Error('没有读到有效的视频时长，请重新导出录屏后再试');
    if (duration > MAX_DURATION_SECONDS)
      throw new Error('首个开源版本暂时只处理 5 分钟以内的录屏');
    if (!video.videoWidth || !video.videoHeight)
      throw new Error('没有读到有效的视频尺寸，请重新导出录屏后再试');

    const analysisCanvas = document.createElement('canvas');
    analysisCanvas.width = Math.min(ANALYSIS_WIDTH, video.videoWidth);
    analysisCanvas.height = Math.max(
      1,
      Math.round(analysisCanvas.width * (video.videoHeight / video.videoWidth)),
    );
    const analysisContext = analysisCanvas.getContext('2d', {
      willReadFrequently: true,
    });
    if (!analysisContext) throw new Error('浏览器无法创建视频分析画布');

    const sampleTimes = buildSampleTimes(duration);
    const samples: Sample[] = [];
    let previousFrame: Uint8Array | null = null;
    for (let index = 0; index < sampleTimes.length; index += 1) {
      throwIfAborted(signal);
      await seekVideo(video, sampleTimes[index], signal);
      const currentFrame = readGrayscaleFrame(
        video,
        analysisCanvas,
        analysisContext,
      );
      const score = previousFrame
        ? frameDifference(
            currentFrame,
            previousFrame,
            analysisCanvas.width,
            analysisCanvas.height,
          )
        : 1;
      samples.push({
        timestampSeconds: sampleTimes[index],
        score,
        pixels: currentFrame,
      });
      previousFrame = currentFrame;
      report(
        'sampling',
        8 + Math.round(((index + 1) / sampleTimes.length) * 62),
        `正在比较第 ${index + 1} / ${sampleTimes.length} 个画面`,
        index + 1,
        sampleTimes.length,
      );
    }

    report('selecting', 75, '正在筛选变化明显且分布均匀的候选画面');
    const candidateSamples = selectCandidateSamples(samples, duration);
    const captureWidth = Math.min(MAX_CAPTURE_WIDTH, video.videoWidth);
    const captureHeight = Math.max(
      1,
      Math.round(captureWidth * (video.videoHeight / video.videoWidth)),
    );
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = captureWidth;
    captureCanvas.height = captureHeight;
    const captureContext = captureCanvas.getContext('2d');
    if (!captureContext) throw new Error('浏览器无法创建截图画布');

    const frames: AnalyzedVideoFrame[] = [];
    for (let index = 0; index < candidateSamples.length; index += 1) {
      throwIfAborted(signal);
      const candidate = candidateSamples[index];
      await seekVideo(video, candidate.timestampSeconds, signal);
      frames.push({
        id: index + 1,
        timestampSeconds: candidate.timestampSeconds,
        time: formatVideoTimestamp(candidate.timestampSeconds),
        image: captureFrame(video, captureCanvas, captureContext),
        imageWidth: captureWidth,
        imageHeight: captureHeight,
        score: candidate.score,
      });
      report(
        'capturing',
        78 + Math.round(((index + 1) / candidateSamples.length) * 21),
        `正在生成第 ${index + 1} / ${candidateSamples.length} 张候选截图`,
        index + 1,
        candidateSamples.length,
      );
    }

    report(
      'complete',
      100,
      `已从 ${samples.length} 个采样画面中保留 ${frames.length} 张候选截图`,
      frames.length,
      frames.length,
    );
    return {
      fileName: file.name,
      duration,
      width: video.videoWidth,
      height: video.videoHeight,
      sampleCount: samples.length,
      frames,
    };
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}
