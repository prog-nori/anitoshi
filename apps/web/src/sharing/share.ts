import type { ConversionResult, Direction } from '@anitoshi/age-core';
import { toViewModel } from '../adapters/conversion';
import type { Persona } from '../data/personas';
export function publicShareUrl(configured: string | undefined, current: string): string | null {
  try {
    const url = new URL(configured || current);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      /^(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[|.*\.local$)/.test(
        url.hostname,
      )
    )
      return null;
    url.search = '';
    url.hash = '';
    return url.href;
  } catch {
    return null;
  }
}
export function shareContent(
  result: ConversionResult,
  persona: Persona,
  direction: Direction,
  url: string | null,
) {
  const vm = toViewModel(result);
  const headline = vm.isMathematicalExtension
    ? `${persona.name}との年齢比較（仮の計算）`
    : direction === 'human-to-animal'
      ? `もしも${persona.name}だったら`
      : `${persona.name}を人間の年齢にたとえると`;
  const amount = `約${vm.age}${vm.unit}`;
  const caution = vm.isMathematicalExtension
    ? '掲載範囲外の仮の計算。科学的な年齢対応・生存可能性を示しません。'
    : '参考用の目安です。医学的・生物学的な同等性を示しません。';
  const text = `${headline}、${amount}でした。\n${vm.label}\n※${caution}\nあなたも比べてみよう！ #あにとし`;
  const x = new URL('https://x.com/intent/tweet');
  x.searchParams.set('text', text);
  if (url) x.searchParams.set('url', url);
  const line = new URL('https://line.me/R/share');
  line.searchParams.set('text', `${text}${url ? '\n' + url : ''}`);
  return {
    headline,
    amount,
    caution,
    label: vm.label,
    text,
    url,
    xUrl: x.href,
    lineUrl: line.href,
    model: `${result.modelId} v${result.modelVersion}`,
  };
}
export type ShareContent = ReturnType<typeof shareContent>;
export async function createShareImage(content: ShareContent, icon: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas-unavailable');
  ctx.fillStyle = '#f3efdf';
  ctx.fillRect(0, 0, 1080, 1080);
  ctx.strokeStyle = '#262a26';
  ctx.lineWidth = 8;
  ctx.strokeRect(30, 30, 1020, 1020);
  ctx.fillStyle = '#262a26';
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('あにとし  /  ANITOSHI', 70, 115);
  ctx.fillStyle = '#c2d6a4';
  ctx.fillRect(70, 165, 940, 430);
  try {
    const img = new Image();
    img.src = icon;
    await img.decode();
    ctx.drawImage(img, 100, 245, 240, 240);
  } catch {
    ctx.fillStyle = '#262a26';
    ctx.font = '100px sans-serif';
    ctx.fillText('◇', 160, 400);
  }
  ctx.fillStyle = '#262a26';
  const wrap = (text: string, x: number, y: number, width: number, size: number) => {
    ctx.font = `${size}px sans-serif`;
    let line = '';
    let row = y;
    for (const char of text) {
      if (ctx.measureText(line + char).width > width) {
        ctx.fillText(line, x, row);
        row += size * 1.5;
        line = '';
      }
      line += char;
    }
    ctx.fillText(line, x, row);
    return row + size * 1.5;
  };
  wrap(content.headline, 380, 245, 570, 32);
  ctx.font = 'bold 72px sans-serif';
  ctx.fillText(content.amount, 380, 430, 570);
  wrap(content.label, 380, 500, 570, 28);
  let y = wrap(content.caution, 75, 665, 925, 30);
  y = wrap('換算方法・出典は「あにとし」の結果詳細から確認できます。', 75, y + 20, 925, 25);
  wrap(content.model, 75, y + 10, 925, 20);
  if (content.url) wrap(content.url, 75, 945, 925, 20);
  else wrap('あにとし — もしも、動物だったら何歳？', 75, 945, 925, 24);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('image-failed'))),
      'image/png',
    ),
  );
}
