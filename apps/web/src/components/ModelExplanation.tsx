import { getModelDetails, getSourceDetails, type ConversionResult } from '@anitoshi/age-core';
const types = {
  'research-formula': '研究式',
  'reference-table': '慣用換算表',
  'milestone-based': '成長指標',
  'stage-only': 'ライフステージ',
  unavailable: '資料調査中',
};
export function ModelExplanation({ result }: { result: ConversionResult }) {
  const model = result.modelId ? getModelDetails(result.modelId) : undefined;
  if (!model) return null;
  return (
    <details className="model-details">
      <summary>
        換算方法について<span aria-hidden="true">＋</span>
      </summary>
      <div className="model-body">
        <span className="evidence-tag">{types[model.type]}</span>
        <p>{model.meaning}</p>
        {model.id === 'dog-wang' && (
          <p className="formula">
            人間年齢 = 16 × ln（犬年齢）+ 31
            <br />
            犬年齢 = exp（（人間年齢 − 31）/ 16）
          </p>
        )}
        <h3>対象・適用条件</h3>
        <p>{model.population}</p>
        <ul>
          {model.limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <h3>参考資料</h3>
        {model.sourceIds.map((id) => {
          const source = getSourceDetails(id);
          return (
            source && (
              <p className="source" key={id}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.title} ↗
                </a>
                <br />
                <small>
                  {source.authors}
                  {source.year ? ` / ${source.year}` : ''}
                  <br />
                  確認日：{source.checkedAt} ·{' '}
                  {source.verification === 'verified'
                    ? '本文確認済み'
                    : '検索情報を確認・本文精査は未完了'}
                </small>
              </p>
            )
          );
        })}
        <p className="micro">
          モデル：{model.id} / v{model.version}
        </p>
      </div>
    </details>
  );
}
