import type { ModelMetadata } from '../domain/types.js';
// [animal years, human years]. Only published anchors belong in these arrays.
export const referenceTables = {
  cat: [[0.5, 10], [1, 15], [2, 24], ...Array.from({ length: 19 }, (_, i) => [i + 3, 28 + i * 4])],
  rabbit: [
    [1 / 12, 2],
    [3 / 12, 7],
    [6 / 12, 13],
    [1, 20],
    [2, 28],
    [3, 34],
    [4, 40],
    [5, 46],
    [6, 52],
    [7, 58],
    [8, 64],
    [9, 70],
    [10, 76],
    [11, 82],
    [12, 88],
    [13, 91],
  ],
  hamster: [
    [21 / 365.25, 3],
    [1 / 12, 14],
    [2 / 12, 18],
    [6 / 12, 21],
    [9 / 12, 24],
    [1, 26],
    [1.25, 33],
    [1.5, 35],
    [1.75, 43],
    [2, 51],
    [2.25, 59],
    [2.5, 67],
    [2.75, 74],
    [3, 80],
    [3.5, 86],
    [4, 92],
  ],
  budgerigar: [
    [1, 20],
    [2, 27],
    [3, 33],
    [4, 38],
    [5, 44],
    [6, 51],
    [7, 58],
    [8, 61],
    [9, 72],
    [10, 80],
    [11, 87],
    [12, 94],
    [13, 100],
  ],
  ferret: [
    [1 / 12, 1],
    [3 / 12, 5],
    [6 / 12, 9],
    [1, 17],
    [2, 28],
    [3, 36],
    [4, 44],
    [5, 52],
    [6, 60],
    [7, 68],
    [8, 76],
    [9, 84],
    [10, 92],
  ],
} as const;
export type TableSpecies = keyof typeof referenceTables;
export const referenceModels: ModelMetadata[] = (
  Object.keys(referenceTables) as TableSpecies[]
).map((speciesId) => {
  const points = referenceTables[speciesId];
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return {
    id: `${speciesId}-reference`,
    version: '1.0.0',
    type: 'reference-table',
    speciesId,
    profileIds: [],
    population: {
      cat: '家庭猫',
      rabbit: 'カイウサギ（品種差は未補正）',
      hamster: 'ゴールデンハムスター（ジャンガリアンとは別表）',
      budgerigar: 'セキセイインコ（他のインコ・オウムには使用しない）',
      ferret: '家畜化されたフェレット',
    }[speciesId],
    animalAgeRange: { min: first[0]!, max: last[0]! },
    sourceIds:
      speciesId === 'cat'
        ? ['aaha-cat-table', 'aaha-cat-2021']
        : speciesId === 'budgerigar'
          ? ['petpedia-budgerigar-table']
          : ['kyoto-exotic-table'],
    verification: 'verified',
    meaning:
      '公開された慣用換算表の目安です。掲載点の間は区分線形補間し、逆方向は同じ直線を逆算します。研究で検証された生物学的年齢ではありません。',
    noticeKeys: ['reference-estimate', 'table-extension', 'table-origin-assumption'],
    limitations: [
      `掲載範囲：動物${first[0]!.toFixed(4)}〜${last[0]}年、人間${first[1]}〜${last[1]}歳。原表の範囲は研究の検証範囲を意味しません。`,
      '掲載値の存在を確認したもので、算定根拠・医学的妥当性を検証したものではありません。資料間で値が異なる場合があります。',
      '最初の掲載値より若い入力は、原点（0年,0年）と最初の掲載点を結ぶ仮の直線で補完します。原点はアプリの便宜的な仮定で、資料の掲載点でも発達の対応を保証するものでもありません。',
      '最後の掲載値を超えた入力は、末尾2点の傾きを延長する仮の計算です。掲載範囲外は必ず警告し、実在・生存可能性を示しません。',
      '人間入力は0〜128歳。寿命比による独自の係数や、犬の式は使用しません。',
      ...(speciesId === 'hamster'
        ? [
            '3週間は21/365.25年として扱い、月は1/12年とします。原表の非一様な増え方もそのまま保持します。',
          ]
        : []),
      ...(speciesId === 'cat'
        ? ['併記する猫のライフステージは2021 AAHA/AAFPの別の区分で、人間換算表とは別に計算します。']
        : []),
      ...(speciesId === 'budgerigar'
        ? [
            '出典は山口明日香獣医師監修のPetpedia記事です。記事中で諸説ある目安とされており、検証研究や統一基準の表ではありません。',
          ]
        : []),
    ],
    table: points.map((p) => ({ animalYears: p[0]!, humanYears: p[1]! })),
  };
});
export function interpolateTable(
  points: readonly { animalYears: number; humanYears: number }[],
  value: number,
  forward: boolean,
) {
  const x = (p: (typeof points)[number]) => (forward ? p.animalYears : p.humanYears);
  const y = (p: (typeof points)[number]) => (forward ? p.humanYears : p.animalYears);
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const below = value < x(first);
  const above = value > x(last);
  if (below)
    return { value: (value / x(first)) * y(first), extrapolated: true, originAssumption: true };
  const end = points.findIndex((p) => x(p) >= value);
  const right = points[Math.max(1, end === -1 ? points.length - 1 : end)]!;
  const left = points[Math.max(0, (end === -1 ? points.length - 1 : Math.max(1, end)) - 1)]!;
  return {
    value: y(left) + ((value - x(left)) / (x(right) - x(left))) * (y(right) - y(left)),
    extrapolated: above,
    originAssumption: false,
  };
}
