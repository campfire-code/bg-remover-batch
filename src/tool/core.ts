// 纯函数：模型输入输出处理、主体范围计算、排版，不依赖界面和本机能力。

/** U²-Net 输入边长 */
export const MODEL_SIZE = 320;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

/**
 * RGBA 像素（已缩放到 320×320）转模型输入：按整图最大值归一化，再按 ImageNet 均值方差标准化，排成 1×3×H×W。
 * 与 rembg 的预处理一致。
 */
export function toInput(rgba: Uint8ClampedArray, size = MODEL_SIZE): Float32Array {
  const n = size * size;
  let max = 1;
  for (let i = 0; i < n; i++) max = Math.max(max, rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]);
  const out = new Float32Array(3 * n);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 3; c++) out[c * n + i] = (rgba[i * 4 + c] / max - MEAN[c]) / STD[c];
  }
  return out;
}

/** 模型输出（主体概率）按最小最大值拉伸到 0–255 */
export function toMask(pred: Float32Array): Uint8ClampedArray {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of pred) { if (v < lo) lo = v; if (v > hi) hi = v; }
  const range = hi - lo || 1;
  const out = new Uint8ClampedArray(pred.length);
  for (let i = 0; i < pred.length; i++) out[i] = Math.round(((pred[i] - lo) / range) * 255);
  return out;
}

export interface Box { x: number; y: number; w: number; h: number }

/** 透明度高于阈值的像素所占的最小矩形；没有主体时返回 null */
export function alphaBox(alpha: (i: number) => number, w: number, h: number, threshold = 24): Box | null {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alpha(y * w + x) > threshold) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/**
 * 主体放进方形画布：等比缩放，四周按 margin（百分比）留白，居中。
 * canvas 为 0 时不改尺寸，返回原图大小、原位置。
 */
export function placeSquare(box: Box, canvas: number, marginPct: number) {
  const inner = canvas * (1 - (2 * Math.max(0, Math.min(40, marginPct))) / 100);
  const k = inner / Math.max(box.w, box.h);
  const w = Math.max(1, Math.round(box.w * k));
  const h = Math.max(1, Math.round(box.h * k));
  return { w, h, x: Math.round((canvas - w) / 2), y: Math.round((canvas - h) / 2) };
}

/** #RGB / #RRGGBB 校验与补全，不合法返回 null */
export function normalizeColor(s: string): string | null {
  const t = s.trim();
  if (/^#[0-9a-f]{6}$/i.test(t)) return t.toUpperCase();
  if (/^#[0-9a-f]{3}$/i.test(t)) return ('#' + [...t.slice(1)].map((c) => c + c).join('')).toUpperCase();
  return null;
}

/** 输出文件名：白底 / 纯色背景加「-白底」，透明背景加「-抠图」 */
export const outName = (name: string, ext: string, transparent: boolean) => `${name.replace(/\.[^.]+$/, '')}-${transparent ? '抠图' : '白底'}.${ext}`;
