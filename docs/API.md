# API

Kontrakt jest źródłem prawdy dla frontendu i backendu. Zmiana kontraktu = PR z etykietą `contract` i informacja na Discordzie na #decyzje.

- Bazowy URL lokalnie: `http://localhost:8000`
- Format: JSON, UTF-8
- Daty: ISO 8601 z przesunięciem strefy, np. `2026-10-08T19:00:00+02:00` (Europe/Warsaw)
- Błędy: domyślny format FastAPI `{"detail": "..."}` z odpowiednim kodem HTTP
- CORS: dozwolony `http://localhost:5173` (Vite)
- Użytkownik: bez rejestracji. Frontend przy pierwszym uruchomieniu generuje UUID, trzyma go w `localStorage` i wysyła w nagłówku `X-User-Id` przy endpointach personalizowanych.

## Obiekt Event

```json
{
  "id": "evt_001",
  "title": "Quiz planszówkowy",
  "description": "Drużyny do 4 osób, wstęp wolny.",
  "category": "gry",
  "image_url": "/static/img/evt_001.webp",
  "starts_at": "2026-10-08T19:00:00+02:00",
  "ends_at": "2026-10-08T22:00:00+02:00",
  "address": "ul. Przykładowa 1, Kraków",
  "lat": 50.0614,
  "lng": 19.9366,
  "price": 0,
  "type": "official",
  "capacity": null,
  "attendees_count": 0,
  "organizer": { "id": "org_01", "name": "Koło Naukowe X (demo)", "verified": true }
}
```

| Pole | Typ | Uwagi |
| --- | --- | --- |
| `id` | string | Stałe ID, np. `evt_001`; nazwa grafiki = ID |
| `title` | string | Maks. 80 znaków |
| `description` | string | Maks. 600 znaków, własne słowa (nie kopiujemy cudzych opisów) |
| `category` | string | `id` z `GET /categories` |
| `image_url` | string \| null | Ścieżka względna do API lub `null` (frontend pokazuje grafikę zastępczą kategorii) |
| `starts_at`, `ends_at` | string | ISO 8601; `ends_at` może być `null` |
| `address` | string | Pokazywany użytkownikowi |
| `lat`, `lng` | number | Do pinezki; z geokodowania adresu (Nominatim) albo kliknięcia na mapie |
| `price` | number | PLN, `0` = darmowe |
| `type` | `"official"` \| `"grassroots"` | Oficjalne (koło, uczelnia, lokal) albo oddolne mikro-wydarzenie |
| `capacity` | number \| null | Limit miejsc, tylko dla `grassroots` |
| `attendees_count` | number | Liczba osób, które dołączyły |
| `organizer` | object | `id`, `name`, `verified` |

## Obiekt Category

```json
{ "id": "gry", "name": "Gry i planszówki", "color": "#EA580C", "icon": "gamepad-2" }
```

`icon` to nazwa ikony z [Lucide](https://lucide.dev/icons) (używana przez shadcn/ui jako `lucide-react`). Aktualna lista: [data/categories.json](../data/categories.json).

## Endpointy

| Metoda i ścieżka | Co robi | Zadanie | Status |
| --- | --- | --- | --- |
| `GET /health` | Sprawdzenie, czy API działa | B1 | Pierwsze 3h |
| `GET /categories` | Lista kategorii | B4 | Pierwsze 3h |
| `GET /events` | Wydarzenia na mapę, z filtrami | B4 | Pierwsze 3h |
| `GET /events/{id}` | Jedno wydarzenie | B4 | Pierwsze 3h |
| `GET /feed` | Talia do swipe'a z wynikiem i uzasadnieniem | — | Do 8h |
| `POST /swipes` | Zapis swipe'a i aktualizacja wag | — | Do 8h |
| `GET /me/events` | „Moja mapa”: polubione wydarzenia | — | Do 13h |
| `POST /events/parse` | AI: tekst → szkic wydarzenia | — | Do 13h |
| `POST /events` | Zapis wydarzenia po zatwierdzeniu | — | Do 17h |
| `POST /events/{id}/join` | Dołączenie do mikro-wydarzenia | — | Opcja |
| `POST /organizers/{id}/follow` | Obserwowanie organizacji | — | Opcja |
| `GET /events/{id}/calendar.ics` | Plik do kalendarza | — | Opcja |

### GET /health

`200 {"status": "ok"}`

### GET /categories

`200 [Category, ...]`

### GET /events

Parametry zapytania (wszystkie opcjonalne):

| Parametr | Przykład | Znaczenie |
| --- | --- | --- |
| `category` | `gry` | Można powtórzyć: `?category=gry&category=sport` |
| `from` | `2026-10-05T00:00:00+02:00` | Wydarzenia zaczynające się od |
| `to` | `2026-10-11T23:59:59+02:00` | Wydarzenia zaczynające się do |
| `free` | `true` | Tylko `price == 0` |

Domyślnie zwraca wydarzenia, które jeszcze się nie skończyły, posortowane po `starts_at`.

`200 [Event, ...]`

### GET /events/{id}

`200 Event` albo `404 {"detail": "Event not found"}`

### GET /feed

Nagłówek `X-User-Id`. Parametry: `lat`, `lng` (opcjonalne, nie są zapisywane), `limit` (domyślnie 10).

Zwraca wydarzenia, których użytkownik jeszcze nie swipe'ował, posortowane po wyniku ([ARCHITECTURE.md](ARCHITECTURE.md#rekomendacje)).

```json
[
  {
    "event": { "...": "Event" },
    "score": 0.82,
    "reasons": ["Bo lubisz: gry", "Dziś 19:00"]
  }
]
```

### POST /swipes

Nagłówek `X-User-Id`.

```json
{ "event_id": "evt_001", "direction": "like" }
```

`direction`: `"like"` (w prawo) albo `"skip"` (w lewo). Odpowiedź `201 {"ok": true}`.

### GET /me/events

Nagłówek `X-User-Id`. `200 [Event, ...]` polubionych wydarzeń.

### POST /events/parse

```json
{ "text": "Zapraszamy na quiz planszówkowy w czwartek 8.10 o 19:00, ul. Przykładowa 1..." }
```

Odpowiedź `200`: szkic do formularza, bez zapisu w bazie.

```json
{
  "draft": {
    "title": "Quiz planszówkowy",
    "description": "...",
    "category": "gry",
    "starts_at": "2026-10-08T19:00:00+02:00",
    "ends_at": null,
    "address": "ul. Przykładowa 1, Kraków",
    "price": 0
  },
  "category_confidence": 0.86,
  "missing_fields": ["ends_at"]
}
```

Przy `category_confidence < 0.7` frontend podświetla pole kategorii do sprawdzenia.

### POST /events

Body: Event bez `id`, `attendees_count` i z `organizer_id` zamiast obiektu `organizer`. Jeśli brak `lat`/`lng`, backend geokoduje `address` (Nominatim). Odpowiedź `201 Event`.
