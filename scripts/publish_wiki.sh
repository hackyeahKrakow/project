#!/usr/bin/env bash
# Publikuje strony z katalogu wiki/ do wiki GitHub.
# Wymaga: wiki włączone w Settings → Features oraz jednej pustej strony założonej w UI
# (GitHub tworzy repo wiki dopiero po pierwszej stronie). Uruchomienie: bash scripts/publish_wiki.sh
set -euo pipefail
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
TMP=$(mktemp -d)
git clone "https://github.com/$REPO.wiki.git" "$TMP"
cp wiki/*.md "$TMP"/
cd "$TMP"
git add -A
git diff --cached --quiet && { echo "Brak zmian"; exit 0; }
git commit -m "docs: aktualizacja wiki z katalogu wiki/"
git push
