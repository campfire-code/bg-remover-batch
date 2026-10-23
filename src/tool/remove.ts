// 抠图流程：在应用内用 onnxruntime-web（WASM，单线程）跑 U²-Net 小模型 u2netp，离线可用。
import * as ort from 'onnxruntime-web/wasm';
import { MODEL_SIZE, alphaBox, placeSquare, toInput, toMask } from './core';
import wasmUrl from '../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm?url';
import mjsUrl from '../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs?url';

// 推理引擎文件随应用打包，离线可用
ort.env.wasm.wasmPaths = { wasm: wasmUrl, mjs: mjsUrl };
ort.env.wasm.numThreads = 1;

let session: Promise<ort.InferenceSession> | null = null;
const getSession = () =>
  (session ??= ort.InferenceSession.create('/models/u2netp.onnx', { executionProviders: ['wasm'], graphOptimizationLevel: 'all' }).catch((e) => {
    session = null;
    throw new Error(`抠图模型加载失败：${e instanceof Error ? e.message : e}`);
  }));

async function decode(bytes: Uint8Array): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart]));
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } catch {
    throw new Error('无法识别这张图片，可能已损坏或格式不受支持');
  } finally {
    URL.revokeObjectURL(url);
  }
  return img;
}

const canvas = (w: number, h: number) => Object.assign(document.createElement('canvas'), { width: w, height: h });

export interface RemoveOptions {
  /** 背景颜色，null 表示透明 */
  background: string | null;
  /** 输出方形边长，0 表示保持原图尺寸 */
  size: number;
  marginPct: number;
  mime: string;
  quality: number;
}

export async function removeBackground(bytes: Uint8Array, opt: RemoveOptions, progress: (r: number) => void) {
  const img = await decode(bytes);
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  if (Math.min(W, H) < 64) throw new Error(`图片太小（${W}×${H}），至少要 64 像素`);
  progress(0.15);

  // 1. 缩放到 320×320 送进模型
  const small = canvas(MODEL_SIZE, MODEL_SIZE);
  const sg = small.getContext('2d', { willReadFrequently: true })!;
  sg.drawImage(img, 0, 0, MODEL_SIZE, MODEL_SIZE);
  const input = toInput(sg.getImageData(0, 0, MODEL_SIZE, MODEL_SIZE).data);
  const s = await getSession();
  progress(0.35);
  const result = await s.run({ [s.inputNames[0]]: new ort.Tensor('float32', input, [1, 3, MODEL_SIZE, MODEL_SIZE]) });
  const pred = result[s.outputNames[0]].data as Float32Array;
  const mask = toMask(pred);
  progress(0.6);

  // 2. 遮罩放大回原图尺寸，作为透明度
  const m = canvas(MODEL_SIZE, MODEL_SIZE);
  const mg = m.getContext('2d')!;
  const md = mg.createImageData(MODEL_SIZE, MODEL_SIZE);
  for (let i = 0; i < mask.length; i++) {
    md.data[i * 4] = md.data[i * 4 + 1] = md.data[i * 4 + 2] = 255;
    md.data[i * 4 + 3] = mask[i];
  }
  mg.putImageData(md, 0, 0);
  const full = canvas(W, H);
  const fg = full.getContext('2d', { willReadFrequently: true })!;
  fg.imageSmoothingQuality = 'high';
  fg.drawImage(m, 0, 0, W, H);
  fg.globalCompositeOperation = 'source-in';
  fg.drawImage(img, 0, 0);
  fg.globalCompositeOperation = 'source-over';
  progress(0.75);

  // 3. 找主体范围，排版到输出画布
  const alpha = fg.getImageData(0, 0, W, H).data;
  const box = alphaBox((i) => alpha[i * 4 + 3], W, H);
  if (!box) throw new Error('没有识别到商品主体，可能整张图都是背景');
  let out: HTMLCanvasElement;
  if (opt.size > 0) {
    out = canvas(opt.size, opt.size);
    const p = placeSquare(box, opt.size, opt.marginPct);
    const og = out.getContext('2d')!;
    if (opt.background) { og.fillStyle = opt.background; og.fillRect(0, 0, opt.size, opt.size); }
    og.imageSmoothingQuality = 'high';
    og.drawImage(full, box.x, box.y, box.w, box.h, p.x, p.y, p.w, p.h);
  } else {
    out = canvas(W, H);
    const og = out.getContext('2d')!;
    if (opt.background) { og.fillStyle = opt.background; og.fillRect(0, 0, W, H); }
    og.drawImage(full, 0, 0);
  }
  const blob = await new Promise<Blob | null>((ok) => out.toBlob(ok, opt.mime, opt.mime === 'image/png' ? undefined : opt.quality / 100));
  if (!blob) throw new Error('编码失败，图片可能太大');
  progress(0.95);
  return { data: new Uint8Array(await blob.arrayBuffer()), width: out.width, height: out.height, box };
}
