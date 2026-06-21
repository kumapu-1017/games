# デプロイ手順

このリポジトリのデプロイ手順は**コード化されている**。AIやボクたち自身が毎回手順を再発明しないように、ここを正とすること。

## TL;DR — 日常運用

```bash
git add <変更ファイル>
git commit -m "..."
git push       # ← preflight.sh が自動実行され、その後GitHub Actionsが配信を更新する
```

これだけ。手動でPages設定をいじったり、AIに「公開して」と頼んでも、結局このフローを呼ぶだけ。

### PRプレビュー（仲間内で先に試したいとき）

mainに入れる前にプレビューURLを発行できる。手順は普通のPR作成だけ：

```bash
git checkout -b feat/foo
# ...変更...
git push -u origin feat/foo
gh pr create --title "..." --body "..."
```

PRが作られると bot が自動でコメントしてくれる：

```
🚀 PRプレビュー
- 一覧トップ: https://kumapu-1017.github.io/games/pr/{番号}/
- bakugeki-kun: https://kumapu-1017.github.io/games/pr/{番号}/games/bakugeki-kun/
```

⚠️ **public 公開なのでURLが推測されるリスクはゼロにできない。** 仲間に渡すときは Slack/LINE 等のクローズドな経路を使う。厳密な認証付きプライベートプレビューが必要なら別ホスティング（Cloudflare Pages等）を検討。

PRをマージ/クローズしたら、次の main push 時に `_site/pr/{番号}/` も自動で消える（gh pr list --state open に出てこなくなるため）。

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
                            - main を _site/ に展開
                            - オープン中の全PRを _site/pr/{番号}/ に展開
                            - actions/upload-pages-artifact
                            - actions/deploy-pages
                           ↓
                         5. https://kumapu-1017.github.io/games/             が更新
                            https://kumapu-1017.github.io/games/pr/{番号}/   も同時更新
```

PRトリガー（push to PR branch）でも同じワークフローが走り、当該PR分の `_site/pr/{番号}/` が最新化される。

## ファイル

| パス | 役割 |
|---|---|
| `.github/workflows/pages.yml` | GitHub Pages 自動デプロイ（main push + PR トリガー） |
| `.github/workflows/pages-pr-comment.yml` | PR作成/更新時にプレビューURLをコメントで通知 |
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

### PRプレビューが出てこない
- ボットコメントが付かない: `pages-pr-comment.yml` の実行ログを `gh run list --workflow=pages-pr-comment.yml` で確認。
- URLにアクセスして 404: `pages.yml` の最新実行（main push or PR push のどちらか直近）を待つ。PR pushしてから1〜2分でだいたい反映される。
- マージ後もURLが残る: 次の main push で消える。即時消したい場合は空commitして `git push`。

## AIに頼むときの読み方

このプロジェクトに変更を依頼するときは、AIに以下を伝える（または CLAUDE.md に書いておく）：

> 「デプロイ手順は DEPLOY.md にコード化されている。手動でPagesの設定を変えたり、独自の手順を提案しないこと。`git push` がデプロイをトリガーする。」

これで「AIがセッションごとに手順を発明する」問題を防げる。
