import { useEffect, useRef, useState } from 'react';
import type { ConversionResult, Direction } from '@anitoshi/age-core';
import type { Persona } from '../data/personas';
import { createShareImage, publicShareUrl, shareContent } from '../sharing/share';
export function ShareResults({
  result,
  persona,
  direction,
}: {
  result: ConversionResult;
  persona: Persona;
  direction: Direction;
}) {
  const url = publicShareUrl(import.meta.env.VITE_PUBLIC_SITE_URL, window.location.href);
  const content = shareContent(result, persona, direction, url);
  const [image, setImage] = useState<{ file: File; url: string } | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.url);
    },
    [image],
  );
  async function generate() {
    setBusy(true);
    setMessage('');
    try {
      const blob = await createShareImage(content, persona.icon);
      if (!mounted.current) return;
      setImage({
        file: new File([blob], 'anitoshi-result.png', { type: 'image/png' }),
        url: URL.createObjectURL(blob),
      });
    } catch {
      if (mounted.current) setMessage('画像を作成できませんでした。もう一度お試しください。');
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(url!);
      setMessage('リンクをコピーしました。');
    } catch {
      setMessage('コピーできませんでした。下のURLを選択してコピーしてください。');
    }
  }
  async function nativeShare() {
    if (!image) return;
    try {
      await navigator.share({ files: [image.file] });
      setMessage('共有先に画像を渡しました。投稿の完了は共有先で確認してください。');
    } catch (error) {
      setMessage(
        error instanceof DOMException && error.name === 'AbortError'
          ? '共有をキャンセルしました。'
          : 'この端末では画像を共有できませんでした。「画像を保存」をお使いください。',
      );
    }
  }
  let canShare = false;
  try {
    canShare = !!image && !!navigator.share && !!navigator.canShare?.({ files: [image.file] });
  } catch {
    canShare = false;
  }
  return (
    <details className="share-details">
      <summary>
        結果を共有する <span aria-hidden="true">↗</span>
      </summary>
      <div className="share-body">
        <p>
          共有内容を確認してから、送り先を選んでください。LINEはスマートフォンのアプリで利用できます。
        </p>
        <p className="share-preview">
          {content.text}
          {url && `\n${url}`}
        </p>
        <p className="input-hint">
          入力した年齢そのものは含めませんが、換算結果から推測できる場合があります。SNSを選ぶと、上の内容がそのサービスに渡ります。
        </p>
        <div className="share-actions">
          <a href={content.xUrl} target="_blank" rel="noopener noreferrer">
            Xで共有
          </a>
          <a href={content.lineUrl} target="_blank" rel="noopener noreferrer">
            LINEで送る
          </a>
          <button type="button" disabled={!url} onClick={copy}>
            リンクをコピー
          </button>
          <button type="button" onClick={generate} disabled={busy}>
            {busy ? '画像を作成中…' : image ? '画像を作り直す' : 'Instagram用の画像を作る'}
          </button>
        </div>
        {!url && (
          <p className="input-hint">
            公開URLが未設定のため、共有文にリンクは含めません。画像・文章の共有は利用できます。
          </p>
        )}
        {url && <input className="share-url" aria-label="共有するサイトURL" value={url} readOnly />}
        {image && (
          <div className="share-image">
            <img src={image.url} alt="共有する結果画像のプレビュー" />
            <div className="share-actions">
              <a href={image.url} download="anitoshi-result.png">
                画像を保存
              </a>
              {canShare && (
                <button type="button" onClick={nativeShare}>
                  画像をアプリに共有
                </button>
              )}
            </div>
            <p className="input-hint">
              Instagramは画像を保存して投稿・ストーリーズへ添付してください。対応端末では共有メニューも使えます。投稿先の候補は端末によって異なります。
            </p>
          </div>
        )}
        <p className="share-message" aria-live="polite">
          {message}
        </p>
      </div>
    </details>
  );
}
