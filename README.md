# games

ブラウザだけで遊べる、フロントエンド完結のミニゲーム集だよ。

## 公開URL

- ゲーム一覧トップ: https://kumapu-1017.github.io/games/
- サンプル（もぐら叩き）: https://kumapu-1017.github.io/games/games/sample/

## 構成

```
games/
├── index.html          # ゲーム一覧トップ（各ゲームへのリンク集）
├── .nojekyll           # GitHub Pages の Jekyll 処理を無効化
└── games/
    └── sample/
        └── index.html  # サンプルゲーム（もぐら叩き・依存ゼロ1ファイル完結）
```

## ローカルで動かす

```bash
# 一覧トップを確認（簡易サーバ推奨）
python3 -m http.server 8000
# → http://localhost:8000/ をブラウザで開く
```

単一ファイルを直接開くだけなら `open games/sample/index.html` でもOKだよ。

## 設計

本格的なゲーム開発は [cc-sdd](https://github.com/gotalab/cc-sdd)（Spec-Driven Development）で進める予定。
設計ドキュメントはゲーム本体とは別ディレクトリに併存する構成だよ。

## 注意

- このリポジトリは public（フロントエンド完結なのでコードは公開される性質のもの）。
- 秘密情報・APIキー・個人情報は一切コミットしない方針。
