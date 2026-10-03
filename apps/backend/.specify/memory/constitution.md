<!--
Sync Impact Report
- Version: template → 1.0.0
- Added principles: I–V (all new)
- Added sections: Ograniczenia technologiczne, Sposób pracy
- Templates: plan/spec/tasks templates do not require changes
-->
# Studencka mapa wydarzeń — Constitution

Projekt hackathonowy (HackYeah 2026, Smart City), 24 godziny, 4 osoby. Pełny kontekst produktu: `docs/SPEC.md` w katalogu głównym repo.

## Core Principles

### I. Prostota w 24 godziny

Każda funkcja musi dać się zbudować i pokazać w ramach planu z `docs/PLAN.md`. Wybieramy najprostsze działające rozwiązanie (YAGNI): SQLite zamiast serwera bazy, scoring zamiast modelu ML, link zamiast integracji API. 3 godziny przed końcem nie dodajemy żadnych nowych funkcji, tylko poprawki błędów.

### II. Kontrakt API jest źródłem prawdy

`docs/API.md` definiuje obiekty i endpointy. Backend zwraca dokładnie ten format (modele Pydantic w `schemas.py`), frontend korzysta tylko z niego. Zmiana kontraktu wymaga PR z etykietą `contract` i informacji dla zespołu na Discordzie (#decyzje) przed scaleniem.

### III. Legalność danych (NON-NEGOTIABLE)

Nie scrapujemy stron, Facebooka ani innych serwisów, także „przez AI”. Wydarzenia dodają ich właściciele albo pochodzą z danych demo pisanych własnymi słowami. Nie używamy treści z Google Places API. Mapa zawsze pokazuje podpis © OpenStreetMap contributors. Geokodowanie Nominatim: maks. 1 zapytanie na sekundę, wyniki zapisywane w bazie.

### IV. Prywatność

Brak kont i danych osobowych. Użytkownik to anonimowy UUID z frontendu (`X-User-Id`). Lokalizacja użytkownika może przyjść w parametrach zapytania, ale nigdy nie jest zapisywana ani logowana. Klucze API tylko w `.env`.

### V. AI pod kontrolą człowieka

LLM jest używany wyłącznie do zamiany tekstu organizatora na szkic wydarzenia (`POST /events/parse`). Wynik jest walidowany schematem, zawiera pewność kategorii i nigdy nie trafia do bazy bez zatwierdzenia przez człowieka. Rekomendacje liczy jawna formuła z `docs/ARCHITECTURE.md`, nie LLM.

## Ograniczenia technologiczne

- Backend: Python 3.11+, FastAPI, uv, SQLite (SQLAlchemy, async). Uruchomienie: `uv run fastapi dev apps/backend/app/main.py`.
- Frontend: Vite, React, TypeScript, Tailwind CSS, shadcn/ui, MapLibre GL JS, ikony `lucide-react`.
- Daty w ISO 8601 ze strefą Europe/Warsaw. Interfejs po polsku.
- CORS dozwolony dla `http://localhost:5173`.

## Sposób pracy

- Commity i gałęzie z prefiksami `feat`, `fix`, `chore`, `docs` (np. `feature/sqlite_schemas`).
- Praca tylko na gałęziach, PR ze squashem, opis min. 1 zdanie, review drugiej osoby, gdy to możliwe; bez commitów bezpośrednio do `main`.
- Commit i push co najwyżej co ok. 2 godziny; częsty pull z `main` (`git config --global pull.rebase true`).
- Każde zadanie to issue na GitHubie z kamieniem milowym M1–M4.
- Kod wygenerowany przez AI musi być zrozumiały dla autora PR, który potrafi wyjaśnić go jury.

## Jakość kodu i zasady pracy (dodane w 1.1.0)

- Kod ma być czysty, modularny i prosty w utrzymaniu: jedna odpowiedzialność na moduł, czytelne nazwy, komentarze wyjaśniają „dlaczego”.
- Przed implementacją sprawdzamy dobre praktyki (dokumentacja frameworka, bezpieczeństwo) i stosujemy je; nie robimy rozwiązań bardziej skomplikowanych niż trzeba.
- Gdy wymaganie lub podejście jest niejasne, pytamy zamiast zgadywać.
- Nigdy nie commitujemy kluczy API, tokenów ani haseł; sekrety tylko w `.env` (w repo wyłącznie `.env.example` z wartościami zastępczymi).
- Każda funkcja ma własną gałąź zdalną, np. `feature/card_swipe_endpoints`; praca jest commitowana i wypychana na koniec każdej tury.
- Zmiany dotyczą wyłącznie katalogu `apps/backend`; plików poza nim nie modyfikujemy.

## Governance

Ta konstytucja ma pierwszeństwo przed innymi ustaleniami technicznymi. Zmiany wymagają zgody zespołu na #decyzje i podbicia wersji. Przy konflikcie z `docs/PLAN.md` w sprawie zakresu decyduje PM.

**Version**: 1.1.0 | **Ratified**: 2026-10-03 | **Last Amended**: 2026-10-03
