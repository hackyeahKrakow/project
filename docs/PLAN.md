# Plan pracy (24h)

Po 8 godzinach musi działać jeden przepływ od początku do końca (seed → API → mapa). Po 21 godzinach (3 godziny przed końcem) zamrażamy funkcje i zajmujemy się tylko poprawkami, demem i wysyłką.

## Kamienie milowe

| Kamień milowy | Godzina od startu | Kryterium |
| --- | --- | --- |
| M1 · Fundamenty | 3h | Mapa z pinami z pliku, API zwraca wydarzenia z SQLite, kategorie ustalone |
| M2 · End-to-end | 8h | Frontend pobiera wydarzenia z API, karta i talia swipe działają |
| M3 · Zamrożenie funkcji | 21h | Rdzeń gotowy; od teraz tylko poprawki |
| M4 · Wysyłka | 23h | Zgłoszenie na Challenge Rocket, godzina zapasu |

## Ścieżki pracy

| Rola | 0–3h | 3–8h | 8–13h | 13–17h | 17–21h |
| --- | --- | --- | --- | --- | --- |
| Frontend | Mapa, piny, karta | Talia swipe | Moja mapa, wyróżnienie | Formularz, integracja | Opcje: link Maps, GPS |
| Backend | API + seed | `/feed` i `/swipes` | `/events/parse` (AI) | `POST /events`, integracja | Poprawki |
| Design | Kategorie, makiety | Grafiki wydarzeń | Szlif UI | Slajdy i zrzuty ekranu | Slajdy |
| PM + legal | Repo, dane, legal | Ankieta, legal | Pitch, opis projektu | Pitch | Pilnowanie czasu |

Ostatnie 3 godziny: cały zespół testuje, nagrywa demo (GIF lub wideo), kończy slajdy i wysyła zgłoszenie.

## Pierwsze 3 godziny

Pierwsze 20 minut wszyscy razem (prowadzi PM) potwierdzają kontrakt JSON z [API.md](API.md), listę kategorii z [DESIGN.md](DESIGN.md) i strukturę repo. Potem frontend pracuje na `src/mock/events.json`, a backend równolegle stawia API, które zwraca dokładnie ten sam format.

Każdy punkt to jedno issue (skrypt [scripts/create_github_issues.sh](../scripts/create_github_issues.sh)). W nawiasie: czas, do którego ma być gotowe.

### Backend (FastAPI + SQLite)

- [ ] **B1 · Szkielet API** (0:45): FastAPI w istniejącym `apps/backend/app/main.py`, CORS dla `http://localhost:5173`, `GET /health`, katalog statyczny `/static` na grafiki. Gotowe: `GET /health` zwraca 200.
- [ ] **B2 · Modele i baza** (1:30): SQLModel lub SQLAlchemy w `models.py` i `database.py`, tabele z [ARCHITECTURE.md](ARCHITECTURE.md#model-danych-sqlite), modele odpowiedzi w `schemas.py` zgodne z [API.md](API.md). Gotowe: plik bazy powstaje przy starcie.
- [ ] **B3 · Seed** (2:00): `seed.py` wczytuje `data/events.json` i `data/categories.json`, można go uruchamiać wielokrotnie bez duplikatów. Gotowe: po uruchomieniu w bazie są wszystkie wydarzenia z pliku.
- [ ] **B4 · Endpointy odczytu** (3:00): `GET /categories`, `GET /events` z filtrami, `GET /events/{id}`. Gotowe: frontend przełącza się z pliku na API jedną zmienną `VITE_API_URL`.

### Frontend (Vite + React + Tailwind + shadcn/ui)

- [ ] **F1 · Setup** (0:45): Vite + React + TypeScript w `apps/frontend`, Tailwind, `shadcn init`, komponenty Card, Badge, Button, Sheet. Układ mobile-first z dolną nawigacją: Mapa / Odkrywaj / Moje. Gotowe: aplikacja startuje, nawigacja przełącza puste widoki.
- [ ] **F2 · Mapa** (1:30): MapLibre GL z kafelkami OSM, środek na Kraków, ukryte warstwy POI, widoczny podpis © OpenStreetMap. Gotowe: czysta mapa Krakowa bez POI.
- [ ] **F3 · Piny** (2:15): piny z `src/mock/events.json`, kolor i ikona według `src/lib/categories.ts`. Gotowe: wszystkie wydarzenia z pliku w kolorach kategorii.
- [ ] **F4 · Karta wydarzenia** (3:00): shadcn Card w Sheet po kliknięciu pinu, układ z [DESIGN.md](DESIGN.md#karta-wydarzenia). Klient `src/lib/api.ts` z `VITE_API_URL` i zapasowym plikiem mock. Gotowe: kliknięcie pinu otwiera kartę.

### Design (Claude Design, Figma, Canva)

- [ ] **D1 · Kategorie** (0:45): finalne kolory i ikony Lucide dla 6–8 kategorii. Gotowe: tabela w [DESIGN.md](DESIGN.md#kategorie) i [data/categories.json](../data/categories.json) zaktualizowane, info na #decyzje.
- [ ] **D2 · Makiety 3 ekranów** (2:00): mapa z kartą, talia swipe, onboarding; mobile 390 px. Gotowe: link do Figmy w issue.
- [ ] **D3 · Szablon grafik wydarzeń** (3:00): szablon w Canvie 16:9 z wariantem na kategorię, eksport WebP. Gotowe: min. 15 grafik w `apps/backend/static/img/`.
- [ ] **D4 · Nazwa i logo robocze** (3:00, z PM). Gotowe: nazwa w README i plik SVG logo.

### PM + legal (GitHub Issues, Discord)

- [ ] **P1 · Organizacja** (0:30): etykiety, kamienie milowe M1–M4, tablica GitHub Projects, kanały Discord #general, #frontend, #backend, #design, #decyzje. Gotowe: wszyscy mają dostęp.
- [ ] **P2 · Issues** (0:45): uruchomienie `scripts/create_github_issues.sh`, przypisanie osób. Gotowe: tablica wypełniona.
- [ ] **P3 · Dane demo** (2:30): 30–50 wydarzeń w Krakowie na najbliższy tydzień w `data/events.json` (wzór: `data/events.example.json`). Własne opisy, fikcyjni organizatorzy z dopiskiem „(demo)”, współrzędne z Nominatim (maks. 1 zapytanie na sekundę) albo z kliknięcia na mapie OSM. Gotowe: plik przechodzi przez `seed.py`; kopia w `apps/frontend/src/mock/events.json`.
- [ ] **P4 · Legal** (3:00): uzupełnienie i odhaczenie [LEGAL.md](LEGAL.md). Gotowe: wszystkie punkty sprawdzone albo z właścicielem.
- [ ] **P5 · Ankieta** (3:00): formularz z 3–5 pytaniami. Gotowe: link gotowy, odpowiedzi zbierane do 8h.
- [ ] **P6 · Checkpoint 3h**: 10-minutowy przegląd, przesunięcie niedokończonych issues, decyzje na #decyzje.

## Rytm pracy i przerwy

| Godzina od startu | Co |
| --- | --- |
| 0h | Start, wspólne potwierdzenie kontraktu (20 min) |
| 3h | Checkpoint 10 min (każdy pokazuje, co działa) + 10 min ruchu |
| 6h | 10 min ruchu |
| 8h | Wspólne demo end-to-end, potem 45 min na posiłek |
| 11h i 14h | 10 min ruchu |
| 17h | Checkpoint: decyzja, które opcje „jeśli starczy czasu” robimy |
| 21h | Zamrożenie funkcji |
| 23h | Wysyłka na Challenge Rocket |
