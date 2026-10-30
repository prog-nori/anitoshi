import type { ConversionResult as Result, Direction } from '@anitoshi/age-core';
import { disclaimer, toViewModel } from '../adapters/conversion';
import type { Persona } from '../data/personas';
import { AnimalIcon } from './ui/AnimalIcon';
import { ShareResults } from './ShareResults';
import { ModelExplanation } from './ModelExplanation';
export function ConversionResult({
  result,
  persona,
  direction,
}: {
  result: Result | null;
  persona: Persona;
  direction: Direction;
}) {
  const vm = result ? toViewModel(result) : null;
  return (
    <section className="result-panel panel" aria-labelledby="result-heading">
      <div className="panel-heading">
        <h2 id="result-heading">
          <span className="step">03</span> 比べてみる
        </h2>
        <span className="micro">参考結果</span>
      </div>
      <div className="result-stage">
        <div className="result-art">
          <AnimalIcon key={persona.id} src={persona.icon} />
          <span>
            No.{persona.number} / {persona.name}
          </span>
        </div>
        <div className="result-copy">
          <span className="evidence-tag">{vm?.label ?? '入力を待っています'}</span>
          <div role="status" aria-live="polite" aria-atomic="true">
            {vm?.age != null ? (
              <>
                <p className="result-lead">
                  {vm.isMathematicalExtension
                    ? result?.modelType === 'reference-table'
                      ? '表を補完・延長して計算すると'
                      : '式の上だけで計算すると'
                    : direction === 'human-to-animal'
                      ? `もしも、${persona.name}だったら`
                      : '人間の年齢にたとえると'}
                </p>
                <p
                  className={`result-number ${vm.age.length > 4 || vm.unit === 'か月' ? 'compact' : ''}`}
                >
                  <span className="approx">約</span> {vm.age}
                  <span className="years">{vm.unit}</span>
                </p>
                {vm.stage && <p className="stage-subtitle">動物の実年齢による区分：{vm.stage}</p>}
                {vm.isMathematicalExtension && (
                  <p className="stage-subtitle">
                    科学的な年齢対応・生存可能性を示す値ではありません。
                  </p>
                )}
              </>
            ) : (
              <>
                <h3 className="stage-title">
                  {vm?.stage ??
                    (result?.status === 'out-of-range'
                      ? 'この年齢は、表示範囲外。'
                      : result
                        ? 'まだ、数字では表せません。'
                        : '年齢を入力してみよう。')}
                </h3>
                <p className="stage-subtitle">
                  {vm?.stage
                    ? '人間年齢への数値換算は行いません。'
                    : result
                      ? 'わかることと、まだわからないことを大切に。'
                      : '選んだ動物との年齢の関係を見てみましょう。'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      <p className="disclaimer">
        <strong>参考としてお楽しみください</strong>
        {disclaimer}
      </p>
      {vm && (
        <ul className="result-notes">
          {vm.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
      {result && <ModelExplanation result={result} />}
      {result?.status === 'converted' && (
        <ShareResults
          key={JSON.stringify([result, persona.id, direction])}
          result={result}
          persona={persona}
          direction={direction}
        />
      )}
    </section>
  );
}
