#!/bin/bash
# 만신 회귀 스위트 — index.html에서 스크립트를 추출해 전 스모크 실행
set -e
cd "$(dirname "$0")"
sed -n '/^<script>$/,/^<\/script>$/p' ../index.html | sed '1d;$d' > _game.js
node --check _game.js && echo "SYNTAX_OK"
for f in smoke*.js; do
  echo "--- $f"
  node "$f"
done
echo "ALL_GREEN"
