# Architektura

Jeden backend (FastAPI), jedna baza SQLite i trzy usługi zewnętrzne, bez kluczy Google i bez scrapingu. Frontend rozmawia tylko z naszym API, a LLM jest wołany wyłącznie przy dodawaniu wydarzenia.

```mermaid
flowchart LR
  FE["Web app (PWA)<br/>Vite + React + shadcn/ui<br/>MapLibre GL"]
  TILES["Podkład mapy OSM<br/>styl bez POI"]
  API["Backend API<br/>Python FastAPI"]
  DB[("SQLite")]
  LLM["LLM API<br/>autofill + kategoria"]
  GEO["Nominatim (OSM)<br/>adres → współrzędne"]
  FE -- kafelki --> TILES
  FE -- "HTTP / JSON" --> API
  API -- SQL --> DB
  API -- "tylko przy dodawaniu" --> LLM
  API -- geokodowanie --> GEO
```

## Stack

| Warstwa | Wybór | Uwagi |
| --- | --- | --- |
| Frontend | Vite + React + TypeScript, Tailwind CSS, shadcn/ui | Mobile-first, ikony z `lucide-react` |
| Mapa | MapLibre GL JS + kafelki OSM (np. styl „liberty” z OpenFreeMap) | Ukryte warstwy POI, widoczny podpis © OpenStreetMap |
| Backend | Python 3.11+, FastAPI, uv | CORS dla `localhost:5173`, grafiki jako pliki statyczne |
| Baza | SQLite (SQLModel lub SQLAlchemy) | Odległość liczona w Pythonie (haversine), przy kilkuset wydarzeniach wystarczy |
| AI | Dowolne LLM API z wyjściem JSON | Tylko autofill i kategoria |
| Design | Claude Design, Figma, Canva | Makiety w Figmie, grafiki wydarzeń w Canvie |
| Organizacja | GitHub Issues + Projects, Discord | Kanał #decyzje jako dziennik ustaleń |

## Układ katalogów

```
apps/backend/app/
  main.py       aplikacja FastAPI, CORS, montowanie /static
  config.py     ustawienia z .env
  database.py   silnik SQLite i sesja
  models.py     tabele
  schemas.py    modele Pydantic zgodne z docs/API.md
  routes.py     endpointy
  init.py       tworzenie tabel przy starcie
apps/backend/seed.py        wczytuje data/events.json do bazy
apps/backend/static/img/    grafiki wydarzeń
apps/frontend/src/
  lib/api.ts         klient API (VITE_API_URL, zapas: plik mock)
  lib/categories.ts  kolory i ikony kategorii
  mock/events.json   kopia danych demo do pracy bez backendu
  components/        MapView, EventCard, SwipeDeck, ...
```

To propozycja zgodna z plikami, które już są w `apps/backend/app/`. Zmiany struktury zgłaszajcie na #decyzje.

## Model danych (SQLite)

| Tabela | Kolumny |
| --- | --- |
| `categories` | `id` TEXT PK, `name`, `color`, `icon` |
| `organizers` | `id` TEXT PK, `name`, `type` (kolo / samorzad / uczelnia / lokal / student), `university`, `verified` BOOL |
| `events` | `id` TEXT PK, `title`, `description`, `category` FK, `image_url`, `starts_at`, `ends_at`, `address`, `lat` REAL, `lng` REAL, `price` REAL, `type` (official / grassroots), `capacity`, `organizer_id` FK, `created_at` |
| `users` | `id` TEXT PK (UUID z frontendu), `university`, `created_at` |
| `category_weights` | `user_id`, `category`, `weight` REAL; PK (`user_id`, `category`) |
| `swipes` | `user_id`, `event_id`, `direction` (like / skip), `created_at`; PK (`user_id`, `event_id`) |
| `follows` | `user_id`, `organizer_id`; PK oba |
| `attendees` | `event_id`, `user_id`; PK oba |

Wydarzenia „wygasają” przez filtr w zapytaniu (`ends_at` lub `starts_at` w przeszłości), bez usuwania z bazy.

## Rekomendacje

Wynik wydarzenia dla użytkownika (0–1):

```
score = 0.45 · w_kategoria + 0.25 · bliskość + 0.20 · czas + 0.10 · obserwowany_organizator
```

- `w_kategoria`: waga kategorii użytkownika. Start z onboardingu: wybrane = 0.7, reszta = 0.3. Swipe w prawo +0.1, w lewo −0.05, zawsze w przedziale 0–1.
- `bliskość`: 1 przy 0 km, liniowo do 0 przy 5 km (haversine). Bez lokalizacji użytkownika: 0.5 dla wszystkich.
- `czas`: 1 dla wydarzeń dziś, 0.5 w tym tygodniu, 0.2 później.
- `obserwowany_organizator`: 1 albo 0.
- `reasons`: dwa składniki o największym wkładzie, po polsku („Bo lubisz: gry”, „600 m od ciebie”, „Dziś 19:00”).

Formuła jest celowo prosta i wyjaśnialna. Collaborative filtering jest na roadmapie.

## AI autofill

1. Organizator wkleja tekst posta.
2. Backend wysyła go do LLM z promptem, który wymaga wyłącznie JSON zgodnego z `draft` z [API.md](API.md#post-eventsparse), listą dozwolonych kategorii i dzisiejszą datą (do rozwiązywania „w czwartek”).
3. Backend waliduje odpowiedź Pydantic. Niepoprawny JSON = jedna ponowna próba, potem pusty szkic z `missing_fields`.
4. Organizator poprawia i zatwierdza w formularzu. Nic nie trafia do bazy bez zatwierdzenia.

Klucz API tylko w `apps/backend/.env`, nigdy we frontendzie.

## Decyzje

| Decyzja | Dlaczego | Alternatywa odrzucona |
| --- | --- | --- |
| Web app (PWA) zamiast natywnej | Jeden kod na telefon i desktop, szybciej w 24h | React Native, Flutter |
| SQLite | Zero konfiguracji, wystarczy na demo | Postgres + PostGIS |
| OSM + MapLibre | Darmowe, własny styl bez POI, brak klucza | Google Maps (warunki EOG zabraniają treści Places na mapie) |
| Brak scrapingu | Uwaga mentorów, ryzyko prawne | Agregacja stron i Facebooka |
| Brak push | Wymaga serwera wysyłającego, niska zgoda użytkowników | Web Push |
| Scoring zamiast ML | Wyjaśnialny, gotowy w kilka godzin | Model rekomendacyjny |
| Lokalizacja tylko na urządzeniu | Prywatność (RODO), brak potrzeby zapisu | Zapis pozycji na serwerze |
