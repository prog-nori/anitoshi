import { convertAge, type Age, type Direction, type ConversionResult } from '@anitoshi/age-core';
import type { Persona } from '../data/personas';
export const disclaimer =
  'この換算は参考用の目安です。医学的なライフステージや生物学的年齢を厳密に算出したものではありません。';
const warnings: Record<string, string> = {
  'reference-estimate':
    '公開された慣用換算表に基づく目安です。掲載点の間は直線で補間しており、医学的・生物学的な同等性は示しません。',
  'table-extension':
    '掲載範囲外の仮の計算です。表を補完・延長した数値で、科学的な年齢対応や実在・生存可能性を示しません。',
  'table-origin-assumption':
    'この若齢域は表にありません。0年と最初の掲載点を結ぶ直線を便宜的に仮定しています。出生・孵化時や成長速度が人間と対応するという根拠はありません。',
  'numeric-overflow': '計算結果が扱える数値の上限を超えます。年齢の入力をご確認ください。',
  'research-estimate': 'DNAメチル化の研究式に基づく参考推定です。',
  'shared-dog-model': '犬5体格は共通の式を使うため、同じ入力の結果は同じです。',
  'population-extrapolation':
    'ラブラドールを中心とした研究です。選択した犬種・体格で検証された値ではありません。',
  'outside-display-range': '動物→人間で数値を表示できる犬の年齢は1〜16歳です。',
  'outside-human-input-range':
    '人間の年齢は0歳0か月〜128歳0か月（0〜1536か月）で入力してください。',
  'mathematical-extension':
    '通常参考範囲（人間31〜約75.36歳）を外れて式を延長した仮の計算です。研究で確認された年齢対応ではなく、その年齢の犬が実在・生存できることも意味しません。',
  'birth-not-aligned':
    'この式は出生時同士を対応させません。人間0歳に対して犬約1.7か月が出るのは式の性質であり、新生児の発達が同じという意味ではありません。',
  'needs-research':
    'この動物の人間年齢への対応と、全生涯の段階区分を確定できる根拠がまだ揃っていません。',
  'no-human-equivalent':
    '猫の実年齢からわかるライフステージです。人間の年齢を示すものではありません。',
  'reverse-unavailable':
    '人間の年齢から、この動物の年齢やライフステージを推定することはできません。動物→人間に切り替えると、動物の実年齢による区分を確認できます。',
};
const stages: Record<string, string> = {
  kitten: '子猫期',
  'young-adult': '若い成猫期',
  'mature-adult': '成熟した成猫期',
  senior: 'シニア期',
};
export function inputError(value: string): string | null {
  if (value.trim() === '') return '年齢を入力してください。空欄は0歳として扱いません。';
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim()) || !Number.isFinite(Number(value)))
    return '0以上の数値を入力してください。小数も使えます（例：2.5）。';
  return null;
}
export function calculate(
  persona: Persona,
  direction: Direction,
  value: string,
  unit: Age['unit'],
): ConversionResult | null {
  if (inputError(value)) return null;
  return convertAge({
    animalId: persona.animalId,
    profileId: persona.profileId,
    direction,
    age: { value: Number(value), unit },
  });
}
export function toViewModel(result: ConversionResult) {
  const isMathematicalExtension =
    result.warnings.includes('mathematical-extension') ||
    result.warnings.includes('table-extension');
  const inMonths = result.convertedAge !== null && result.convertedAge.value < 1;
  const label =
    result.status === 'converted'
      ? isMathematicalExtension
        ? result.modelType === 'reference-table'
          ? '表の範囲外の仮の計算'
          : '式を延長した仮の計算'
        : result.modelType === 'reference-table'
          ? '慣用換算表による目安'
          : '研究に基づく参考推定'
      : result.status === 'stage-only'
        ? 'ライフステージのみ'
        : result.status === 'out-of-range'
          ? '表示範囲について'
          : '数値換算は未対応';
  return {
    label,
    isMathematicalExtension,
    unit: inMonths ? 'か月' : '歳',
    age: result.convertedAge
      ? new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 1 }).format(
          result.convertedAge.value * (inMonths ? 12 : 1),
        )
      : null,
    stage: result.lifeStage ? (stages[result.lifeStage] ?? result.lifeStage) : null,
    warnings: result.warnings.map((w) => warnings[w] ?? '入力と換算条件をご確認ください。'),
  };
}
