#!/usr/bin/env bash
# setup-repo.sh — このリポジトリの初期セットアップ（idempotent）
#
# 別マシンで clone した直後や、設定が壊れたときに実行する。
# 何度実行しても安全に作れる設計（既に正しいなら何もしない）。

set -euo pipefail

cd "$(dirname "$0")/.."

if [ -t 1 ]; then
  GREEN=$'\033[32m'; YELLOW=$'\033[33m'; BOLD=$'\033[1m'; RESET=$'\033[0m'
else
  GREEN=""; YELLOW=""; BOLD=""; RESET=""
fi

echo "${BOLD}🔧 リポジトリ初期セットアップ${RESET}"

# ─────────────────────────────────────────
# 1. noreply メアドのローカル設定
# ─────────────────────────────────────────
GH_LOGIN="kumapu-1017"
GH_ID="260182616"
NOREPLY="${GH_ID}+${GH_LOGIN}@users.noreply.github.com"

current=$(git config user.email || echo "")
if [ "$current" = "$NOREPLY" ]; then
  echo "${GREEN}✅ user.email は既に noreply: $current${RESET}"
else
  git config user.email "$NOREPLY"
  echo "${GREEN}✅ user.email を noreply に設定: $NOREPLY${RESET}"
  if [ -n "$current" ]; then
    echo "   (前の値: $current)"
  fi
fi

# ─────────────────────────────────────────
# 2. pre-push フックの登録（preflight.sh を自動実行）
# ─────────────────────────────────────────
HOOK_PATH=".git/hooks/pre-push"
HOOK_MARKER="# managed-by: scripts/setup-repo.sh"

if [ -f "$HOOK_PATH" ] && grep -q "$HOOK_MARKER" "$HOOK_PATH" 2>/dev/null; then
  echo "${GREEN}✅ pre-push フックは既に登録済み${RESET}"
else
  if [ -f "$HOOK_PATH" ]; then
    echo "${YELLOW}⚠️  既存の pre-push フックがあるよ。上書きしていい？ [y/N]${RESET}"
    read -r answer
    if [ "$answer" != "y" ] && [ "$answer" != "Y" ]; then
      echo "   スキップした。"
      exit 0
    fi
  fi
  cat > "$HOOK_PATH" <<'EOF'
#!/usr/bin/env bash
# managed-by: scripts/setup-repo.sh
# push前に preflight.sh を実行し、fail したら push を止める。
# バイパスしたいときは: git push --no-verify
exec "$(git rev-parse --show-toplevel)/scripts/preflight.sh"
EOF
  chmod +x "$HOOK_PATH"
  echo "${GREEN}✅ pre-push フックを登録（push時に preflight.sh が自動実行される）${RESET}"
fi

echo
echo "${BOLD}🎉 セットアップ完了！${RESET}"
echo "  - 今後 'git push' すると、自動で preflight.sh が走るよ。"
echo "  - 手動でチェックしたいときは: ./scripts/preflight.sh"
echo "  - フックをバイパスしたいときは: git push --no-verify"
