// 截图与预览用的示例数据（不会进入正式运行）
import type { Row } from '../kit/runner';

function product(hue: number, done: boolean) {
  const S = 360;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  // 原图：木纹桌面加杂物，商品偏左下；结果图：纯白底，商品居中放大
  if (done) { g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, S, S); } else {
    g.fillStyle = `hsl(${(hue + 30) % 360} 32% 48%)`; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 26; i++) { g.fillStyle = i % 2 ? 'rgb(255 255 255 / .07)' : 'rgb(0 0 0 / .08)'; g.fillRect(0, i * 15, S, 7); }
    g.fillStyle = `hsl(${(hue + 120) % 360} 35% 55% / .8)`; g.beginPath(); g.arc(290, 70, 40, 0, 7); g.fill();
    g.fillStyle = 'rgb(240 230 200 / .85)'; g.fillRect(24, 40, 70, 54);
  }
  const k = done ? 1.55 : 1;
  const ox = done ? S / 2 - 52 * k : 70;
  const oy = done ? S / 2 - 70 * k : 130;
  g.save(); g.translate(ox, oy); g.scale(k, k);
  g.fillStyle = 'rgb(0 0 0 / .16)'; g.beginPath(); g.ellipse(50, 134, 42, 7, 0, 0, 7); g.fill();
  g.fillStyle = `hsl(${hue} 55% 42%)`; g.beginPath(); g.roundRect(18, 20, 64, 114, 14); g.fill();
  g.fillStyle = '#E4E6EA'; g.beginPath(); g.roundRect(22, 6, 56, 18, 6); g.fill();
  g.fillStyle = 'rgb(255 255 255 / .3)'; g.fillRect(28, 44, 9, 70);
  g.restore();
  return c.toDataURL('image/png');
}
const files: [string, number, Row['status'], string?][] = [
  ['保温杯-蓝-主图.jpg', 210, 'ok'], ['保温杯-红-主图.jpg', 5, 'ok'], ['运动水壶-侧面.png', 130, 'ok'], ['陶瓷马克杯.jpg', 30, 'ok'],
  ['玻璃杯-套装.jpg', 190, 'run'], ['咖啡杯-礼盒.jpg', 280, 'wait'], ['杯盖-细节图.jpg', 45, 'wait'], ['旧图-缩略.jpg', 0, 'err', '图片太小（48×48），至少要 64 像素'],
];
export const rows = (state: string): Row[] =>
  state === 'empty' ? [] : files.map(([name, hue, status, err], i) => {
    const st = state === 'done' && status !== 'err' ? 'ok' : status;
    return {
      item: { id: `p${i}`, name, path: product(hue, false), size: 400_000 + i * 50_000 },
      status: st, progress: st === 'run' ? 0.6 : st === 'ok' ? 1 : 0, error: st === 'err' ? err : undefined,
      result: st === 'ok' ? { preview: product(hue, true), outputPath: '/示例', summary: '800×800 · 白底' } : undefined,
    };
  });
