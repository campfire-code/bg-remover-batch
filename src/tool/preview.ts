// 截图与预览用的示例数据（不会进入正式运行）
import type { Row } from '../kit/runner';

function product(hue: number, done: boolean) {
  const c = document.createElement('canvas');
  c.width = c.height = 200;
  const g = c.getContext('2d')!;
  if (done) { g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, 200, 200); } else {
    const grd = g.createLinearGradient(0, 0, 200, 200);
    grd.addColorStop(0, `hsl(${(hue + 40) % 360} 25% 55%)`); grd.addColorStop(1, `hsl(${(hue + 90) % 360} 20% 35%)`);
    g.fillStyle = grd; g.fillRect(0, 0, 200, 200);
  }
  g.fillStyle = `hsl(${hue} 55% 42%)`;
  g.beginPath(); g.roundRect(done ? 66 : 70, done ? 34 : 50, done ? 68 : 60, done ? 132 : 110, 14); g.fill();
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
