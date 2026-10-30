import { useState } from 'react';
import type { Age, Direction } from '@anitoshi/age-core';
import { personas } from '../data/personas';
import { calculate, inputError } from '../adapters/conversion';
import { AnimalSelector } from '../components/AnimalSelector';
import { AgeInput } from '../components/AgeInput';
import { ConversionResult } from '../components/ConversionResult';
export function App() {
  const [selected, setSelected] = useState(personas[2]!);
  const [direction, setDirection] = useState<Direction>('human-to-animal');
  const [value, setValue] = useState('40');
  const [unit, setUnit] = useState<Age['unit']>('years');
  const result = calculate(selected, direction, value, unit);
  return (
    <>
      <a className="skip-link" href="#main">
        メインへ移動
      </a>
      <header className="site-header">
        <a className="brand" href="./">
          <span className="brand-symbol" aria-hidden="true">
            a<span>↗</span>
          </span>
          あにとし<span className="brand-en">ANITOSHI</span>
        </a>
        <a className="about-link" href="#about">
          あにとしについて <span aria-hidden="true">↗</span>
        </a>
      </header>
      <main id="main">
        <section className="intro">
          <div>
            <p className="eyebrow">
              <span aria-hidden="true">■</span> 年齢からひらく、動物の図鑑。
            </p>
            <h1>
              もしも、動物だったら<span>何歳？</span>
            </h1>
            <p className="intro-description">
              同じ時間でも、成長のしかたはそれぞれ。
              <br />
              あなたと動物の年齢を、研究を手がかりに比べてみよう。
            </p>
          </div>
          <div className="intro-stamp" aria-hidden="true">
            <span>ヒトと動物の</span>
            <strong>とし比べ</strong>
            <span>10 PERSONAS / 01 HUMAN</span>
          </div>
        </section>
        <div className="direction-bar">
          <span className="direction-caption">どちらから比べる？</span>
          <div className="direction-switch" role="group" aria-label="換算方向">
            <button
              aria-label="人間 → 動物"
              aria-pressed={direction === 'human-to-animal'}
              onClick={() => setDirection('human-to-animal')}
            >
              人間 <span aria-hidden="true">→</span> 動物
            </button>
            <button
              aria-label="動物 → 人間"
              aria-pressed={direction === 'animal-to-human'}
              onClick={() => setDirection('animal-to-human')}
            >
              動物 <span aria-hidden="true">→</span> 人間
            </button>
          </div>
          <span className="privacy-note">入力した年齢は外部に送信されません</span>
        </div>
        <div className="workspace">
          <AnimalSelector selected={selected} onSelect={setSelected} />
          <div className="conversion-column">
            <AgeInput
              direction={direction}
              name={selected.name}
              value={value}
              unit={unit}
              error={inputError(value)}
              onValue={setValue}
              onUnit={setUnit}
            />
            <ConversionResult result={result} persona={selected} direction={direction} />
          </div>
        </div>
        <section id="about" className="about-section">
          <div>
            <p className="eyebrow">数字の向こうに、それぞれの一生。</p>
            <h2>
              ちがう生きもの。
              <br />
              ちがう時間のものさし。
            </h2>
          </div>
          <div>
            <p>
              「あにとし」は動物と人間の成長・成熟・老化を比較するためのサービスです。換算結果は参考値であり、個体の健康状態や余命を示すものではありません。種類・品種・体格・飼育環境などによって実際の進み方は異なります。換算方法と参考資料は各結果の詳細から確認できます。
            </p>
            <p>
              根拠が十分でないときは、無理に数字にしません。ライフステージや、まだわかっていないこともお伝えします。
            </p>
          </div>
        </section>
      </main>
      <footer>
        <strong>
          あにとし <span>ANITOSHI</span>
        </strong>
        <span>ちがいを知ると、もっと近くなる。</span>
        <a href="#main">ページの先頭へ ↑</a>
      </footer>
    </>
  );
}
