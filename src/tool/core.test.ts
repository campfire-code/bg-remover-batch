import { describe, expect, it } from 'vitest';
import { alphaBox, normalizeColor, outName, placeSquare, toInput, toMask } from './core';

describe('模型输入输出', () => {
  it('按整图最大值归一化后标准化，排成通道优先', () => {
    const x = toInput(new Uint8ClampedArray([200, 100, 0, 255]), 1); // 1×1 图验证公式
    expect(x[0]).toBeCloseTo((200 / 200 - 0.485) / 0.229, 5);
    expect(x[1]).toBeCloseTo((100 / 200 - 0.456) / 0.224, 5);
    expect(x[2]).toBeCloseTo((0 - 0.406) / 0.225, 5);
  });
  it('遮罩拉伸到 0–255', () => expect([...toMask(new Float32Array([0.2, 0.6, 1.0]))]).toEqual([0, 128, 255]));
  it('全一样的输出不会除以 0', () => expect([...toMask(new Float32Array([0.5, 0.5]))]).toEqual([0, 0]));
});

describe('主体范围与排版', () => {
  it('找出不透明像素的最小矩形', () => {
    const w = 5, h = 4, a = new Array(w * h).fill(0);
    a[1 * w + 2] = 255; a[2 * w + 3] = 200;
    expect(alphaBox((i) => a[i], w, h)).toEqual({ x: 2, y: 1, w: 2, h: 2 });
  });
  it('全透明返回 null', () => expect(alphaBox(() => 0, 3, 3)).toBeNull());
  it('横图放进 800 方图，四周留白 10%', () => expect(placeSquare({ x: 0, y: 0, w: 400, h: 200 }, 800, 10)).toEqual({ w: 640, h: 320, x: 80, y: 240 }));
  it('留白上限 40%', () => expect(placeSquare({ x: 0, y: 0, w: 100, h: 100 }, 1000, 90).w).toBe(200));
});

describe('其他', () => {
  it('颜色', () => { expect(normalizeColor('#f5f5f5')).toBe('#F5F5F5'); expect(normalizeColor('#abc')).toBe('#AABBCC'); expect(normalizeColor('白色')).toBeNull(); });
  it('文件名', () => { expect(outName('杯子.PNG', 'jpg', false)).toBe('杯子-白底.jpg'); expect(outName('杯子.jpg', 'png', true)).toBe('杯子-抠图.png'); });
});
