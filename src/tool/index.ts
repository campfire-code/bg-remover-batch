// 工具声明：主图一键白底（批量）
import { Eraser as EraserAsIcon } from 'lucide-react';
import type { BatchTool } from '../kit/types';
import { normalizeColor, outName } from './core';
import { removeBackground } from './remove';
import { Empty, ResultBody } from './ui';

const MIME: Record<string, [string, string]> = { jpg: ['image/jpeg', 'jpg'], png: ['image/png', 'png'], webp: ['image/webp', 'webp'] };

const tool: BatchTool = {
  id: 'e03',
  name: '主图一键白底（批量）',
  tagline: '自动抠出商品主体，换成白底或透明底，按电商主图尺寸居中排好。全部在本机完成，不联网、不上传。',
  icon: EraserAsIcon,
  category: '电商运营',
  type: 'media',
  mode: 'batch',
  resultView: 'list',
  Empty,
  ResultBody,
  concurrency: 1,
  accept: { label: '商品图', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'] },
  params: [
    { key: 'bg', label: '背景', type: 'segment', options: [['white', '纯白'], ['transparent', '透明'], ['color', '其他颜色']], default: 'white' },
    { key: 'color', label: '背景颜色', type: 'text', default: '#F5F5F5', placeholder: '#F5F5F5', when: (p) => p.bg === 'color', help: '写颜色代码，例如浅灰 #F5F5F5' },
    { key: 'size', label: '输出尺寸', type: 'select', options: [['800', '800 × 800（最常用）'], ['1000', '1000 × 1000'], ['1200', '1200 × 1200'], ['1500', '1500 × 1500'], ['2000', '2000 × 2000'], ['0', '保持原图尺寸，不排版']], default: '800' },
    { key: 'margin', label: '商品四周留白', type: 'number', default: 8, min: 0, max: 40, unit: '%', when: (p) => p.size !== '0', help: '商品占满画面就填 0' },
    { key: 'format', label: '输出格式', type: 'segment', options: [['jpg', 'JPG'], ['png', 'PNG'], ['webp', 'WebP']], default: 'jpg', when: (p) => p.bg !== 'transparent' },
    { key: 'out', label: '保存到', type: 'folder', default: '' },
  ],
  async run(item, ctx) {
    const p = ctx.params;
    const transparent = p.bg === 'transparent';
    const background = transparent ? null : p.bg === 'color' ? normalizeColor(String(p.color)) : '#FFFFFF';
    if (!transparent && !background) throw new Error(`背景颜色「${p.color}」写法不对，请写成 #F5F5F5 这样的颜色代码`);
    const [mime, ext] = transparent ? MIME.png : MIME[String(p.format)] ?? MIME.jpg;
    const src = await ctx.readFile(item.path!);
    const r = await removeBackground(src, { background, size: Number(p.size), marginPct: Number(p.margin), mime, quality: 92 }, ctx.progress);
    const outputPath = await ctx.join(ctx.outputDir, outName(item.name, ext, transparent));
    await ctx.writeFile(outputPath, r.data);
    return { outputPath, preview: outputPath, summary: `${r.width}×${r.height} · ${transparent ? '透明背景' : background === '#FFFFFF' ? '白底' : `背景 ${background}`}` };
  },
};

export default tool;
