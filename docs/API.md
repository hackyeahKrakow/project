# API

Kontrakt API backendu (FastAPI). Wszystkie identyfikatory to UUID7. Ciała żądań i odpowiedzi są w JSON.
Dokumentacja generowana automatycznie: `/docs` (OpenAPI).

## Obiekt: Card (karta wydarzenia)

| Pole | Typ | Opis |
|------|-----|------|
| `id` | string (UUID7) | Unikalny identyfikator karty |
| `event_name` | string | Nazwa wydarzenia |
| `color_code` | string | Kolor karty w formacie hex, np. `#FF8800` |
| `description` | string | Opis wydarzenia |
| `image_url` | string \| null | Ścieżka względna do API lub `null` (frontend pokazuje grafikę zastępczą kategorii) |
| `starts_at` | string | ISO 8601 w UTC (`Z`), np. `2026-11-15T17:00:00Z` |
| `ends_at` | string \| null | ISO 8601 w UTC (`Z`); może być `null` |
| `address` | string | Pokazywany użytkownikowi |
| `lat` | number | Do pinezki; z geokodowania adresu (Nominatim) albo kliknięcia na mapie |
| `lng` | number | Do pinezki; z geokodowania adresu (Nominatim) albo kliknięcia na mapie |
| `price` | number | PLN, `0` = darmowe |

Przykład:

```json
{
  "id": "018f3b5e-8a10-7c3d-b1f2-5d4e6a7b8c9d",
  "event_name": "Krakowski Nocny Market",
  "color_code": "#FF8800",
  "description": "Street food i muzyka na żywo.",
  "image_url": "/images/night-market.png",
  "starts_at": "2026-11-15T17:00:00Z",
  "ends_at": null,
  "address": "Rynek Główny 1, Kraków",
  "lat": 50.0617,
  "lng": 19.9373,
  "price": 0
}
```

## Obiekt: CardResponse (decyzja użytkownika)

| Pole | Typ | Opis |
|------|-----|------|
| `card_id` | string (UUID7) | Karta, na którą użytkownik odpowiada |
| `user_id` | string (UUID7) | Użytkownik, który odpowiada |
| `decision` | string | `right` (zainteresowany) lub `left` (niezainteresowany) |
| `created_at` | string | ISO 8601 w UTC (`Z`); czas zapisu ustawia serwer, nie można go podać w żądaniu |

Użytkownik może odpowiedzieć na daną kartę tylko raz.

Odpowiedź jest zapisywana w tabeli `card_swipes` jako `card_id`, `user_id`, `swipe` (wartość logiczna: `right` = `true`, `left` = `false`) i `created_at`.

## Endpointy

### GET /health — `health`

Sprawdzenie, czy usługa działa.

- **200**: `{ "status": "ok" }`

### GET /card/new/{user_id} — `card_new`

Zwraca następną z sześciu predefiniowanych kart (numerowanych 1–6) dla użytkownika, po kolei. Serwer zapamiętuje postęp każdego użytkownika, więc ta sama karta nie wraca drugi raz. Po karcie 6 zwraca 404.

- **Ścieżka**: `user_id` (UUID7), np. `018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e90`
- **Przykładowe żądanie**: `GET /card/new/018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e90`
- **200**: obiekt `Card`
- **404**: `{ "detail": "No more cards" }` — użytkownik dostał już wszystkie karty
- **422**: `{ "detail": "..." }` — niepoprawny `user_id`

### GET /card/recommendations/{user_id} — `card_recommendations`

Zwraca do 10 poleconych kart. Serwer losuje do 50 kart, na które użytkownik jeszcze nie odpowiedział, ocenia je modelem Jev (TypeSafe AI, przez OpenCode) na podstawie wcześniejszych odpowiedzi `right` i `left` i zwraca 10 najlepszych w kolejności rankingu. Gdy jest mniej kandydatów, zwraca mniej kart albo pustą listę. Gdy AI jest niedostępne, zwraca do 10 losowych kandydatów zamiast błędu.

- **Ścieżka**: `user_id` (UUID7)
- **Przykładowe żądanie**: `GET /card/recommendations/018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e90`
- **200**: lista obiektów `Card` (0–10 elementów), np. `[]` gdy brak kandydatów
- **422**: `{ "detail": "..." }` — niepoprawny `user_id`

### GET /card/{user_id} — `card_fetch`

Zwraca dokładnie jedną kartę, na którą użytkownik jeszcze nie odpowiedział.

- **Ścieżka**: `user_id` (UUID7), np. `018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e90`
- **Przykładowe żądanie**: `GET /card/018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e90`
- **200**: obiekt `Card` (przykład powyżej)
- **404**: `{ "detail": "..." }` — brak kolejnych kart dla tego użytkownika
- **422**: `{ "detail": "..." }` — niepoprawny `user_id`
- **501**: endpoint jeszcze nie zaimplementowany (szkielet)

### POST /card/{user_id} — `card_response`

Zapisuje decyzję użytkownika (swipe w prawo lub w lewo) dla karty razem z czasem zapisu. Użytkownik może odpowiedzieć na daną kartę tylko raz.

- **Ścieżka**: `user_id` (UUID7)
- **Ciało**:

```json
{
  "card_id": "018f3b5e-8a10-7c3d-b1f2-5d4e6a7b8c9d",
  "decision": "right"
}
```

- **Przykładowe żądanie**: `POST /card/018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e90` z powyższym ciałem
- **201**:

```json
{
  "card_id": "018f3b5e-8a10-7c3d-b1f2-5d4e6a7b8c9d",
  "user_id": "018f3b5e-7c1a-7d2b-9a4e-3f6c2b1d5e90",
  "decision": "right",
  "created_at": "2026-10-03T15:42:10.123456Z"
}
```

- **404**: `{ "detail": "Card not found" }` — karta nie istnieje, nic nie zapisano
- **409**: `{ "detail": "Card already answered" }` — użytkownik już odpowiedział na tę kartę, istniejący zapis się nie zmienia
- **422**: `{ "detail": "..." }` — niepoprawne identyfikatory lub `decision` inne niż `right`/`left`, nic nie zapisano

Pole `created_at` wysłane w ciele żądania jest ignorowane.

## Błędy

Wszystkie błędy mają ten sam kształt:

```json
{ "detail": "komunikat błędu" }
```
