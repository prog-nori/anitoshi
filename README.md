# あにとし — もしも、動物だったら何歳？

日本語の動物年齢比較SPAと、UIから独立したTypeScript換算ライブラリです。入力はブラウザ内で処理し、保存・外部送信しません。バックエンド・ログイン・広告・解析はありません。

## 起動

Node.js 22.12以上（検証環境24.4）、pnpm 10.12.1を使用します。

```sh
pnpm install
pnpm dev
# http://127.0.0.1:5173/
```

```sh
pnpm build       # ライブラリとSPA。成果物 apps/web/dist
pnpm test        # コア・Reactテスト
pnpm test:core   # Webを使わずコアだけテスト
pnpm --filter @anitoshi/age-core build
pnpm test:e2e    # ローカルChromeを使用。サーバーは自動起動
```

E2EにはGoogle Chromeが必要です。未導入の環境ではPlaywrightのChromiumを導入し、playwright.config.ts の channel 指定を外してください。開発サーバーはローカルのみ公開します。配信は `apps/web/dist` を静的ホストへ配置できます（この作業では外部公開していません）。

## 独立したコア

```ts
import { convertAge, listAnimals, getModelDetails } from '@anitoshi/age-core';
const result = convertAge({
  animalId: 'dog',
  profileId: 'medium',
  direction: 'animal-to-human',
  age: { value: 24, unit: 'months' },
});
// result.convertedAge?.value = 42.0903548889591…（丸めはUIが担当）
```

公開APIは convertAge / listAnimals / listProfiles / getModelDetails / getSourceDetails / validateRegistry と型定義です。ESMと型宣言を出力します。Nodeで `import './packages/age-core/dist/index.js'` として利用でき、Webは不要です。コアはDOM型も依存パッケージも持ちません。

## 採用状況と科学的制約

- 犬5体格：Wang et al. (2020) の共通式。代表犬種別の式ではありません。動物→人間は犬1〜16歳のみ表示。人間→動物は0〜128歳（0〜1536か月）に対応し、人間31〜約75.36歳から外れる結果は「式を延長した仮の計算」と表示します。出生時同士の対応や生存可能性を意味しません。対象集団の外挿も警告します。
- 猫：AAHA掲載の慣用換算表。動物→人間では2021 AAHA/AAFPの猫の実年齢による段階も併記。
- カイウサギ・ゴールデンハムスター・家畜フェレット：京都中央動物病院の獣医師監修掲載表。
- セキセイインコ：Petpediaの山口明日香獣医師監修記事の掲載目安。学術的な算定根拠は示されていません。

追加5種は双方向の区分線形補間に対応。人間0〜128歳を受け付け、表の下限未満は原点と最初の掲載点を結ぶ便宜的な仮定、上限超は末尾区間の延長として警告付きで表示します。これらは掲載値・科学的対応と明確に区別します。

各結果の「換算方法について」から出典・対象集団・確認日・制約を確認できます。健康状態・余命の推定には使用しません。

## 動物を追加する

1. `packages/age-core/src/evidence/sources.ts` に原典と確認状況を登録。
2. `models/models.ts` にモデルを追加。換算表なら `models/reference-tables.ts` に掲載点と出典を追加すると共通エンジンで処理できます。新しい数式・段階ロジックは `conversion/convert.ts` に接続。未検証は `needs-research` として数値を無効化。
3. `animals/animals.ts` に種・プロファイルとモデル参照を登録。
4. `apps/web/src/data/personas.ts` に表示名・代表を追加し、対応IDのSVGを `assets/animals/` に追加。
5. 境界値・単調性・双方向・出典・Registryテストを追加。`pnpm test && pnpm build` を実行。

Registryを元にカードを生成するため、通常Reactコンポーネントの変更は不要です。詳細は [設計](docs/architecture.md)、[科学的ポリシー](docs/scientific-policy.md)、[アイコン](docs/icon-guidelines.md)、[検証記録](docs/verification.md) を参照してください。
