# デプロイ手順

このリポジトリのデプロイ手順は**コード化されている**。AIやボクたち自身が毎回手順を再発明しないように、ここを正とすること。

## TL;DR — 日常運用

```bash
git add <変更ファイル>
git commit -m "..."
git push       # ← preflight.sh が自動実行され、その後GitHub Actionsが配信を更新する
```

これだけ。手動でPages設定をいじったり、AIに「公開して」と頼んでも、結局このフローを呼ぶだけ。

---

## 仕組み（3層構造）

```
ローカル                       GitHub
─────                       ──────
1. git push を実行
   ↓ pre-push フック
2. scripts/preflight.sh
   - 個人Gmail/秘密情報スキャン
   - noreplyメアド検証
   - 失敗したらpushを止める
   ↓ pass したら
3. main ブランチに push
                           ↓ on push トリガー
                         4. .github/workflows/pages.yml
                            - actions/checkout
                            - actions/configure-pages
                            - actions/upload-pages-artifact
                            - actions/deploy-pages
                           ↓
                         5. https://kumapu-1017.github.io/games/ が更新
```

## ファイル

| パス | 役割 |
|---|---|
| `.github/workflows/pages.yml` | GitHub Pages 自動デプロイ（pushトリガー） |
| `scripts/preflight.sh` | push前セキュリティ・整合性チェック |
| `scripts/setup-repo.sh` | clone直後の初期セットアップ（idempotent） |
| `.git/hooks/pre-push` | preflight.sh を自動実行するフック（setup-repo.shが登録） |

## 新しいマシンでcloneしたとき

```bash
git clone git@github.com:kumapu-1017/games.git
cd games
./scripts/setup-repo.sh   # ← これ1回だけ実行
```

`setup-repo.sh` は idempotent（何度実行しても安全）。やること：
- noreplyメアドをローカル設定
- pre-pushフックを登録

## トラブルシューティング

### push が止まる
`preflight.sh` の出力を読む。fail した項目を直してから再push。
本当にバイパスしたいときだけ `git push --no-verify`（**緊急時のみ**）。

### Pages が更新されない
Actions の実行状況を確認: `gh run list --workflow=pages.yml`
直近の実行ログ: `gh run view --log`

### Pages の配信モード
このリポジトリは **Actions 配信モード**（`build_type: workflow`）。
GitHub Web UI で「Deploy from a branch」に戻すと、Actions ワークフローは無視される。

## AIに頼むときの読み方

このプロジェクトに変更を依頼するときは、AIに以下を伝える（または CLAUDE.md に書いておく）：

> 「デプロイ手順は DEPLOY.md にコード化されている。手動でPagesの設定を変えたり、独自の手順を提案しないこと。`git push` がデプロイをトリガーする。」

これで「AIがセッションごとに手順を発明する」問題を防げる。
