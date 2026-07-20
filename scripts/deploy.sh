#!/bin/bash
# ビルドして dist/ を gh-pages ブランチとして GitHub Pages に公開する。
# 使い方: npm run deploy
set -euo pipefail
cd "$(dirname "$0")/.."

npm run build

cd dist
rm -rf .git
git init -q -b gh-pages
git add -A
git -c core.hooksPath=/dev/null commit -q -m "deploy $(date '+%Y-%m-%d %H:%M')"
git push -f "$(git -C .. remote get-url origin)" gh-pages:gh-pages
rm -rf .git
echo "✅ デプロイ完了: https://teacoffewater.github.io/henteko-website/"
