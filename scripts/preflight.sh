#!/usr/bin/env bash
# preflight.sh — push前のセキュリティ・整合性チェック
#
# 使い方:
#   ./scripts/preflight.sh        # ワーキングツリー全体をチェック
#
# 終了コード:
#   0: 全チェックpass（push してOK）
#   1: 1つ以上のチェックがfail（pushを止める）

set -uo pipefail

cd "$(dirname "$0")/.."

# 色（端末が対応してなければ無視される）
if [ -t 1 ]; then
  RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; BOLD=$'\033[1m'; RESET=$'\033[0m'
else
  RED=""; GREEN=""; YELLOW=""; BOLD=""; RESET=""
fi

fail_count=0
pass() { echo "${GREEN}✅ $1${RESET}"; }
fail() { echo "${RED}❌ $1${RESET}"; fail_count=$((fail_count+1)); }
warn() { echo "${YELLOW}⚠️  $1${RESET}"; }
section() { echo; echo "${BOLD}── $1 ──${RESET}"; }

# 検査対象: gitに追跡されてるファイル + 新規untracked（.gitignore除外済み）
# ただしこのスクリプト自身と手順書類は「検出パターンを書いてある」ので除外。
SELF_EXEMPT_REGEX='^(scripts/preflight\.sh|DEPLOY\.md)$'
tracked_files() {
  {
    git ls-files
    git ls-files --others --exclude-standard
  } | sort -u | grep -vE "$SELF_EXEMPT_REGEX" || true
}

# ─────────────────────────────────────────
section "1. コミット作者メアド（noreplyか）"
current_email=$(git config user.email || echo "")
if [[ "$current_email" == *"@users.noreply.github.com" ]]; then
  pass "user.email は noreply: $current_email"
else
  fail "user.email が noreply ではない: $current_email"
  echo "   → 修正: git config user.email '<ID>+<username>@users.noreply.github.com'"
fi

# 既存コミットも全てnoreplyか
non_noreply=$(git log --all --format='%ae' 2>/dev/null | grep -v "@users.noreply.github.com$" | sort -u || true)
if [ -z "$non_noreply" ]; then
  pass "全コミットの作者メアドが noreply"
else
  fail "noreply 以外のメアドを使ったコミットがある:"
  echo "$non_noreply" | sed 's/^/   /'
fi

# ─────────────────────────────────────────
section "2. 個人Gmail（kumapu.1017@gmail.com）の混入"
gmail_hits=$(tracked_files | xargs -I{} grep -l "kumapu\.1017@gmail" {} 2>/dev/null || true)
if [ -z "$gmail_hits" ]; then
  pass "個人Gmail の混入なし"
else
  fail "個人Gmail を含むファイル:"
  echo "$gmail_hits" | sed 's/^/   /'
fi

# ─────────────────────────────────────────
section "3. 秘密情報らしき実値（APIキー・トークン等）"
# 「key=実際の値」のパターン。単なる単語ではなく、16文字以上の実値が割り当てられてるかを見る
secret_pattern='(api[_-]?key|secret|password|token|bearer|private[_-]?key|access[_-]?token)[[:space:]]*[:=][[:space:]]*['\''"]?[A-Za-z0-9_/+=-]{16,}'
secret_hits=$(tracked_files | xargs grep -EnIi "$secret_pattern" 2>/dev/null || true)
if [ -z "$secret_hits" ]; then
  pass "実値の秘密情報の検出なし"
else
  fail "秘密情報らしき文字列が見つかった:"
  echo "$secret_hits" | sed 's/^/   /'
fi

# ─────────────────────────────────────────
section "4. .env ファイルの混入（あってはならない）"
env_files=$(tracked_files | grep -E '(^|/)\.env(\.|$)' || true)
if [ -z "$env_files" ]; then
  pass ".env ファイルなし"
else
  fail ".env が追跡対象に入っている:"
  echo "$env_files" | sed 's/^/   /'
fi

# ─────────────────────────────────────────
section "5. .gitignore の必須項目"
required_patterns=(".env" "node_modules" ".DS_Store")
missing=()
for p in "${required_patterns[@]}"; do
  if ! grep -qxF "$p" .gitignore 2>/dev/null && ! grep -qxF "${p}*" .gitignore 2>/dev/null && ! grep -qxF "${p}/" .gitignore 2>/dev/null; then
    missing+=("$p")
  fi
done
if [ ${#missing[@]} -eq 0 ]; then
  pass ".gitignore に必須項目すべてあり"
else
  fail ".gitignore に欠けてる必須項目: ${missing[*]}"
fi

# ─────────────────────────────────────────
section "6. .nojekyll の存在（Pages配信に必要）"
if [ -f .nojekyll ]; then
  pass ".nojekyll あり"
else
  warn ".nojekyll がない（Jekyll処理されて _ で始まるファイル等が無視される可能性）"
fi

# ─────────────────────────────────────────
section "結果"
if [ "$fail_count" -eq 0 ]; then
  echo "${GREEN}${BOLD}全チェック pass。push して OK だよ！${RESET}"
  exit 0
else
  echo "${RED}${BOLD}${fail_count} 件の問題が見つかった。push を止めるよ。${RESET}"
  exit 1
fi
