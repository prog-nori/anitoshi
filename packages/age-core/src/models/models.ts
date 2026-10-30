import { referenceModels } from './reference-tables.js';
import type { ModelMetadata } from '../domain/types.js';
export const dogProfiles = ['toy', 'small', 'medium', 'large', 'giant'] as const;
export const dogToHuman = (years: number): number => 16 * Math.log(years) + 31;
export const humanToDog = (years: number): number => Math.exp((years - 31) / 16);
// Product display boundary, not a newly claimed scientific validation interval.
export const dogRange = { min: 1, max: 16 } as const;
export const models: readonly ModelMetadata[] = [
  {
    id: 'dog-wang',
    version: '1.1.0',
    type: 'research-formula',
    speciesId: 'dog',
    profileIds: dogProfiles,
    population: 'ラブラドール・レトリーバーを中心とする104頭（採血時0.1〜16歳）',
    animalAgeRange: dogRange,
    sourceIds: ['wang-2020'],
    verification: 'verified',
    meaning: 'DNAメチル化の変化を比較した研究式による参考推定。逆方向は式の数学的な逆算です。',
    noticeKeys: [
      'research-estimate',
      'mathematical-extension',
      'birth-not-aligned',
      'shared-dog-model',
      'population-extrapolation',
    ],
    limitations: [
      '犬5体格は同じ式です。代表犬種・体格別の妥当性は検証されていません。',
      '研究対象と選択したペルソナが異なるため、対象集団を越えた参考適用です。',
      '動物→人間は犬1〜16歳のみ表示。人間→動物は0〜128歳（0〜1536か月）を受け付けます。通常参考範囲の人間31〜約75.36歳から外れる場合は、式を延長した仮の計算として表示します。通常参考範囲は製品上の区切りであり、論文の検証済み範囲ではありません。',
      '人間0歳でも式は犬約1.7か月を返します。出生時同士を対応させる式ではありません。高齢側では非現実的な犬年齢にもなり、実在・生存可能性を示しません。',
      '範囲内であっても個体の健康・余命・医学的年齢を示しません。',
    ],
  },
  {
    id: 'cat-stages',
    version: '1.0.0',
    type: 'stage-only',
    speciesId: 'cat',
    profileIds: [],
    population: '家庭猫（品種差を補正しない）',
    animalAgeRange: null,
    sourceIds: ['aaha-cat-2021'],
    verification: 'verified',
    meaning: '猫の実年齢をAAHA/AAFPのライフステージ区分で表示します。',
    noticeKeys: ['stage-only'],
    limitations: [
      '人間年齢への換算表ではありません。人間年齢から猫の年齢・段階は推定できません。',
      '小数年齢は1歳未満、1歳以上7歳未満、7歳以上10歳以下、10歳超に区分します。',
      '年齢による分類であり、健康状態や終末期を判定しません。',
    ],
  },
  ...referenceModels,
];
export function catStage(years: number): string {
  return years < 1 ? 'kitten' : years < 7 ? 'young-adult' : years <= 10 ? 'mature-adult' : 'senior';
}
