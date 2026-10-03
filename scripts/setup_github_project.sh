#!/usr/bin/env bash
# Tworzy tablicę GitHub Projects (v2), pola i dodaje wszystkie issues repo.
# Wymaga: gh auth login oraz uprawnienia project: gh auth refresh -s project
# Uruchomienie z katalogu głównego repo: bash scripts/setup_github_project.sh
# Widoki (Board, Tabela, Roadmapa) gh nie tworzy: zob. docs/PROJECT_BOARD.md.
set -euo pipefail

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
OWNER=${REPO%%/*}
TITLE="Studencka mapa wydarzeń: 24h"

NUM=$(gh project list --owner "$OWNER" --format json -q ".projects[] | select(.title==\"$TITLE\") | .number" | head -1)
if [ -z "$NUM" ]; then
  NUM=$(gh project create --owner "$OWNER" --title "$TITLE" --format json -q .number)
  echo "projekt: #$NUM"
else
  echo "projekt istnieje: #$NUM"
fi
gh project link "$NUM" --owner "$OWNER" --repo "$REPO" 2>/dev/null || true

field() { gh project field-create "$NUM" --owner "$OWNER" "$@" >/dev/null 2>&1 && echo "pole: $2" || echo "pole istnieje: $2"; }
field --name "Kamień milowy" --data-type SINGLE_SELECT --single-select-options "M1 Fundamenty,M2 End-to-end,M3 Zamrożenie,M4 Wysyłka"
field --name "Rola" --data-type SINGLE_SELECT --single-select-options "Frontend,Backend,Design,PM"
field --name "Termin (h od startu)" --data-type NUMBER

gh issue list --repo "$REPO" --state all --limit 200 --json url -q '.[].url' | while read -r url; do
  gh project item-add "$NUM" --owner "$OWNER" --url "$url" >/dev/null && echo "dodano: $url"
done
echo "Gotowe: https://github.com/orgs/$OWNER/projects/$NUM (lub /users/$OWNER/projects/$NUM)"
