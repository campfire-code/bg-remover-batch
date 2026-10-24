// 界面：空状态（讲清「杂乱背景 → 白底」）与单条结果（原图 / 白底前后对比滑块）
import { useState } from 'react';
import { ArrowRight, FolderOpen, MoveHorizontal, ShieldCheck, Square } from 'lucide-react';
import type { InputItem, ItemResult } from '../kit/types';
import { fileSrc } from '../kit/platform';
import './tool.css';

function Cup({ x, y, s = 1, tone }: { x: number; y: number; s?: number; tone: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="50" cy="132" rx="38" ry="6" fill="#000" opacity=".16" />
      <rect x="22" y="22" width="56" height="106" rx="12" fill={tone} />
      <rect x="26" y="8" width="48" height="16" rx="5" fill="#E7E9EE" />
      <rect x="32" y="48" width="8" height="64" rx="4" fill="#fff" opacity=".28" />
      <path d="M78 54 q22 6 0 40" fill="none" stroke={tone} strokeWidth="8" strokeLinecap="round" />
    </g>
  );
}

export function Empty({ hover }: { hover: boolean }) {
  return (
    <div className={`bg-empty${hover ? ' hover' : ''}`}>
      <div className="bg-flow" aria-hidden="true">
        <figure>
          <svg viewBox="0 0 150 150" role="img" aria-label="背景杂乱的商品图">
            <defs>
              <pattern id="bg-wood" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
                <rect width="14" height="14" fill="#B58A5E" /><rect width="7" height="14" fill="#A57A50" />
              </pattern>
            </defs>
            <rect width="150" height="150" fill="url(#bg-wood)" />
            <circle cx="28" cy="30" r="14" fill="#6B8F71" opacity=".85" />
            <rect x="104" y="96" width="30" height="30" rx="4" fill="#D9C27A" opacity=".9" transform="rotate(12 119 111)" />
            <Cup x={26} y={6} s={1.0} tone="#2F6FB4" />
          </svg>
          <figcaption>杂乱背景</figcaption>
        </figure>
        <span className="bg-flow-arrow"><ArrowRight size={22} /><small>一键抠图</small></span>
        <figure>
          <svg viewBox="0 0 150 150" role="img" aria-label="白底商品图">
            <rect width="150" height="150" fill="#FFFFFF" />
            <Cup x={26} y={6} s={1.0} tone="#2F6FB4" />
          </svg>
          <figcaption>纯白底，居中留白</figcaption>
        </figure>
      </div>
      <h2>把商品图或整个文件夹拖进来</h2>
      <p>自动抠出商品，换成白底、透明底或指定颜色，按电商主图尺寸居中排好。</p>
      <ul className="bg-points">
        <li><Square size={14} />800×800 起，四周留白可调</li>
        <li><FolderOpen size={14} />可拖整个文件夹，一次处理</li>
        <li><ShieldCheck size={14} />全程在本机，不上传</li>
      </ul>
      <p className="bg-hint">支持 JPG、PNG、WebP、BMP；也可以点右上角的添加按钮选择文件。</p>
    </div>
  );
}

function bgLabel(summary?: string) {
  if (!summary) return '结果';
  if (summary.includes('透明')) return '透明底';
  if (summary.includes('白底')) return '白底';
  return '新背景';
}

export function ResultBody({ item, result }: { item: InputItem; result: ItemResult }) {
  const [pos, setPos] = useState(50);
  const label = bgLabel(result.summary);
  const before = item.path ? fileSrc(item.path) : '';
  const after = result.preview ? fileSrc(result.preview) : '';
  return (
    <div className="bg-result">
      <div className={`bg-cmp${label === '透明底' ? ' checker' : ''}`}>
        {after && <img className="bg-after" src={after} alt={`${item.name} 处理后`} />}
        {before && <img className="bg-before" src={before} alt={`${item.name} 原图`} style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />}
        <span className="bg-line" style={{ left: `${pos}%` }}><i><MoveHorizontal size={14} /></i></span>
        <em className="bg-tag l">原图</em>
        <em className="bg-tag r">{label}</em>
        <input type="range" min={0} max={100} value={pos} aria-label="拖动对比原图和处理结果" onChange={(e) => setPos(Number(e.target.value))} />
      </div>
      {result.summary && <small className="bg-sum k-num">{result.summary}</small>}
    </div>
  );
}
