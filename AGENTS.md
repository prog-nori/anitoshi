# あにとし 開発ルール

- age-coreにReact・DOM・Vite・HTTP・ストレージ依存を導入しない。Webは公開APIだけを使用する。
- 出典確認なしの数値モデルを有効化しない。平均寿命比・架空の係数を使わない。
- モデルを変えたらversion・制約・出典と境界テストを更新する。
- 日本語UI、参考用の注意書き、キーボード操作、320px対応を維持する。
- 検証: pnpm test、pnpm build。UI変更時はpnpm test:e2e。
- 未確認の情報はdocs/scientific-policy.mdに記録する。
