# Studencka mapa wydarzeń (nazwa robocza)

Aplikacja webowa (PWA) dla studentów w Krakowie: mapa pokazująca wyłącznie wydarzenia i miejsca dla studentów oraz „swipe” jak w Tinderze, który uczy się, co cię interesuje, i wyróżnia to na twojej mapie.

Projekt na HackYeah 2026, kategoria **Smart City**.

## Szybki start

**Backend** (Python 3.11+, [uv](https://docs.astral.sh/uv/)), z katalogu głównego repo:

```bash
cp apps/backend/.env.example apps/backend/.env
uv run fastapi dev apps/backend/app/main.py
```

API działa na `http://localhost:8000`, dokumentacja Swagger na `http://localhost:8000/docs`. Szczegóły w [docs/start-backend.md](docs/start-backend.md).

**Frontend** (Vite + React + TypeScript + Tailwind + shadcn/ui), po zadaniu F1:

```bash
cd apps/frontend
cp .env.example .env
npm install
npm run dev
```

Aplikacja działa na `http://localhost:5173`.

## Dokumentacja

| Plik | Co zawiera | Dla kogo |
| --- | --- | --- |
| [docs/SPEC.md](docs/SPEC.md) | Problem, użytkownicy, funkcje, zakres MVP, roadmapa | Wszyscy, wejście do `/speckit-specify` |
| [docs/API.md](docs/API.md) | Kontrakt JSON wydarzenia i wszystkie endpointy | Frontend, backend |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Stack, diagram, model danych, scoring, decyzje | Frontend, backend |
| [docs/DESIGN.md](docs/DESIGN.md) | Kategorie, karta wydarzenia, ekrany, zasady mapy | Design, frontend |
| [docs/PLAN.md](docs/PLAN.md) | Plan 24h, kamienie milowe, zadania na pierwsze 3h, przerwy | Wszyscy |
| [docs/LEGAL.md](docs/LEGAL.md) | Dane, licencje, prywatność, ujawnienie AI | PM + legal |
| [docs/RESEARCH.md](docs/RESEARCH.md) | Dane o rynku, konkurencja, źródła | Pitch |
| [docs/PITCH.md](docs/PITCH.md) | Model biznesowy, 10 slajdów, wymagania zgłoszenia | Pitch |
| [data/](data/) | Przykładowe wydarzenia i kategorie | Wszyscy |

Zadania są w GitHub Issues. Skrypt [scripts/create_github_issues.sh](scripts/create_github_issues.sh) tworzy etykiety, kamienie milowe i issues na pierwsze 3 godziny.

## Struktura repo

```
apps/
  backend/     FastAPI + SQLite (uv), spec-kit w .specify/
  frontend/    Vite + React + TypeScript + Tailwind + shadcn/ui
data/          dane demo (events.json) i kategorie
docs/          dokumentacja projektu
scripts/       skrypty pomocnicze (np. tworzenie issues)
```

## Zespół i role

| Rola | Zakres |
| --- | --- |
| Frontend | Mapa, piny, karta wydarzenia, talia swipe, formularz |
| Backend | API, baza SQLite, seed, rekomendacje, autofill AI |
| Design | Kategorie, makiety (Claude Design, Figma), grafiki (Canva), slajdy |
| PM + legal | GitHub Issues, Discord, dane demo, legal, ankieta, pitch, pilnowanie czasu |

## github repo  rules:
- use prefixes like fix feat chore docs etc for commits and for branches for example feature/sqlite_schemas
- do all the work on branches and then open pull requests also use squash and if possible ask another person to check and approve before merging 
- in the pr try to describe in atleast 1 sentence what you did 
- try to commit from branches frequently not longer than about 2 hours so main will be up to date
- pull often from the main brainch 
- dont directly commit to main

## add this to your config:
- git config --global pull.rebase true

## Licencja

MIT, zob. [LICENSE](LICENSE). Dane mapy © współtwórcy OpenStreetMap (ODbL).
