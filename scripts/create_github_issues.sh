#!/usr/bin/env bash
# Tworzy etykiety, kamienie milowe M1–M4 i issues na pierwsze 3 godziny (docs/PLAN.md).
# Wymaga GitHub CLI (https://cli.github.com) zalogowanego przez: gh auth login
# Uruchomienie z katalogu głównego repo: bash scripts/create_github_issues.sh
# Skrypt można uruchomić ponownie: pomija istniejące etykiety, kamienie milowe i issues o tym samym tytule.
set -euo pipefail

gh auth status >/dev/null
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Repozytorium: $REPO"

label() { gh label create "$1" --color "$2" --description "$3" --force >/dev/null && echo "etykieta: $1"; }
label frontend      1D76DB "Vite, React, shadcn/ui, mapa"
label backend       0E8A16 "FastAPI, SQLite"
label design        D93F0B "Makiety, grafiki, kategorie"
label legal         5319E7 "Dane, licencje, prywatność"
label pitch         FBCA04 "Slajdy, opis, ankieta"
label pm            C5DEF5 "Organizacja pracy"
label contract      B60205 "Zmiana kontraktu API (docs/API.md)"
label must          000000 "Rdzeń MVP"
label nice-to-have  BFD4F2 "Tylko jeśli starczy czasu"

milestone() {
  if gh api "repos/$REPO/milestones?state=all&per_page=100" -q '.[].title' | grep -Fxq "$1"; then
    echo "kamień milowy istnieje: $1"
  else
    gh api "repos/$REPO/milestones" -f title="$1" -f description="$2" >/dev/null && echo "kamień milowy: $1"
  fi
}
M1="M1 · Fundamenty (3h)"
M2="M2 · End-to-end (8h)"
M3="M3 · Zamrożenie funkcji (21h)"
M4="M4 · Wysyłka (23h)"
milestone "$M1" "Mapa z pinami z pliku, API zwraca wydarzenia z SQLite, kategorie ustalone"
milestone "$M2" "Frontend pobiera wydarzenia z API, karta i talia swipe działają"
milestone "$M3" "Rdzeń gotowy, od teraz tylko poprawki"
milestone "$M4" "Zgłoszenie na Challenge Rocket"

issue() {
  local title="$1" labels="$2" body="$3"
  if gh issue list --state all --limit 200 --json title -q '.[].title' | grep -Fxq "$title"; then
    echo "issue istnieje: $title"
  else
    gh issue create --title "$title" --label "$labels" --milestone "$M1" --body "$body" >/dev/null && echo "issue: $title"
  fi
}

issue "B1 · Szkielet API" "backend,must" "Termin: 0:45 od startu.

FastAPI w istniejącym \`apps/backend/app/main.py\`, CORS dla \`http://localhost:5173\`, \`GET /health\`, katalog statyczny \`/static\` na grafiki.

**Gotowe, gdy:** \`GET /health\` zwraca 200 \`{\"status\": \"ok\"}\`.

Dokumentacja: docs/API.md, docs/ARCHITECTURE.md"

issue "B2 · Modele i baza SQLite" "backend,must" "Termin: 1:30.

SQLModel lub SQLAlchemy w \`models.py\` i \`database.py\`, tabele z docs/ARCHITECTURE.md (sekcja Model danych), modele odpowiedzi w \`schemas.py\` zgodne z docs/API.md.

**Gotowe, gdy:** plik bazy powstaje przy starcie aplikacji."

issue "B3 · Skrypt seed" "backend,must" "Termin: 2:00.

\`apps/backend/seed.py\` wczytuje \`data/events.json\` (do czasu P3: \`data/events.example.json\`) i \`data/categories.json\`. Można uruchamiać wielokrotnie bez duplikatów.

**Gotowe, gdy:** po uruchomieniu w bazie są wszystkie wydarzenia z pliku."

issue "B4 · Endpointy odczytu: /categories, /events, /events/{id}" "backend,must" "Termin: 3:00.

\`GET /categories\`, \`GET /events\` z filtrami \`category\`, \`from\`, \`to\`, \`free\`, \`GET /events/{id}\` (404 gdy brak). Format dokładnie jak w docs/API.md.

**Gotowe, gdy:** frontend przełącza się z pliku mock na API samą zmienną \`VITE_API_URL\`."

issue "F1 · Setup frontendu" "frontend,must" "Termin: 0:45.

Vite + React + TypeScript w \`apps/frontend\`, Tailwind, \`shadcn init\`, komponenty Card, Badge, Button, Sheet. Układ mobile-first z dolną nawigacją: Mapa / Odkrywaj / Moje.

**Gotowe, gdy:** aplikacja startuje, nawigacja przełącza puste widoki."

issue "F2 · Mapa Krakowa bez POI" "frontend,must" "Termin: 1:30.

MapLibre GL z kafelkami OSM, środek na Rynek Główny (zoom ok. 13), ukryte warstwy POI, widoczny podpis © OpenStreetMap contributors.

**Gotowe, gdy:** widać czystą mapę Krakowa bez sklepów i stacji.

Dokumentacja: docs/DESIGN.md (Zasady mapy)"

issue "F3 · Piny wydarzeń w kolorach kategorii" "frontend,must" "Termin: 2:15.

Piny z \`src/mock/events.json\` (kopia \`data/events.example.json\`), kolor i ikona Lucide według \`src/lib/categories.ts\` (z \`data/categories.json\`).

**Gotowe, gdy:** wszystkie wydarzenia z pliku są na mapie w kolorach kategorii."

issue "F4 · Karta wydarzenia + klient API" "frontend,must" "Termin: 3:00.

shadcn Card w Sheet po kliknięciu pinu, układ z docs/DESIGN.md (Karta wydarzenia). \`src/lib/api.ts\` z \`VITE_API_URL\` i zapasowym plikiem mock.

**Gotowe, gdy:** kliknięcie pinu otwiera kartę z grafiką (lub zastępczą), datą, adresem, ceną i organizatorem."

issue "D1 · Kolory i ikony kategorii" "design,must" "Termin: 0:45 (frontend na to czeka).

Finalne kolory i ikony Lucide dla 6–8 kategorii. Kontrast pinu min. 3:1 względem mapy, rozróżnialne przy daltonizmie.

**Gotowe, gdy:** zaktualizowane docs/DESIGN.md i data/categories.json, informacja na #decyzje."

issue "D2 · Makiety 3 ekranów" "design,must" "Termin: 2:00.

Mapa z kartą, talia swipe, onboarding; mobile 390 px. Warianty w Claude Design, wersja finalna w Figmie.

**Gotowe, gdy:** link do Figmy w komentarzu do tego issue."

issue "D3 · Szablon grafik wydarzeń" "design,must" "Termin: 3:00.

Szablon w Canvie 16:9 (np. 1200×675) z wariantem na kategorię, eksport WebP, nazwa pliku = id wydarzenia. Tylko własne lub wygenerowane grafiki.

**Gotowe, gdy:** min. 15 grafik w \`apps/backend/static/img/\`."

issue "D4 · Nazwa i logo robocze" "design,pitch" "Termin: 3:00, razem z PM.

**Gotowe, gdy:** nazwa w README i plik SVG logo w repo."

issue "P1 · Organizacja: tablica i Discord" "pm,must" "Termin: 0:30.

Tablica GitHub Projects z issues, kanały Discord #general, #frontend, #backend, #design, #decyzje.

**Gotowe, gdy:** wszyscy mają dostęp."

issue "P2 · Przypisanie issues" "pm,must" "Termin: 0:45.

Przypisanie osób do issues M1, sprawdzenie terminów.

**Gotowe, gdy:** każde issue ma właściciela."

issue "P3 · Dane demo: 30–50 wydarzeń" "pm,legal,must" "Termin: 2:30.

\`data/events.json\` na wzór \`data/events.example.json\`: wydarzenia w Krakowie na najbliższy tydzień, wszystkie kategorie i kilka mikro-wydarzeń. Własne opisy, fikcyjni organizatorzy z dopiskiem (demo). Współrzędne z Nominatim (maks. 1 zapytanie na sekundę) albo z kliknięcia na mapie OSM.

**Gotowe, gdy:** plik przechodzi przez \`seed.py\`, kopia w \`apps/frontend/src/mock/events.json\`."

issue "P4 · Lista kontrolna legal" "legal,must" "Termin: 3:00.

Przejście listy w docs/LEGAL.md i odhaczenie punktów.

**Gotowe, gdy:** każdy punkt jest sprawdzony albo ma właściciela."

issue "P5 · Ankieta wśród studentów" "pitch" "Termin: 3:00 (odpowiedzi do 8:00).

Formularz z 3–5 pytaniami, np. „Skąd wiesz, co się dzieje na uczelni i w mieście?”, „Czy włączyłbyś powiadomienia od swojego koła?”. Cel: 10–15 odpowiedzi na sali.

**Gotowe, gdy:** wyniki i 2–3 cytaty w docs/RESEARCH.md."

issue "P6 · Checkpoint 3h" "pm" "10-minutowy przegląd: każdy pokazuje, co działa. Przesunięcie niedokończonych issues, decyzje zapisane na #decyzje."

echo "Gotowe."
