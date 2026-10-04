# Dane

- `categories.json`: kategorie (tymczasowe kolory i ikony, finalne z zadania D1).
- `events.example.json`: 5 przykładowych wydarzeń zgodnych z kontraktem z [docs/API.md](../docs/API.md).
- `events.json`: pełne dane demo (30–50 wydarzeń), tworzy PM w zadaniu P3 na wzór pliku przykładowego.
- `events_oneoff.json`: 36 prawdziwych wydarzeń w Krakowie (paź 2026–sty 2027) w schemacie kart (`event_name`, `starts_at`, `address`…) plus `category` z `categories.json`. Daty i godziny ze stron samych miejsc, uczelni i organizatorów (TAURON Arena, Klub Studio, Alchemia, NCK, ICE Kraków, EXPO, AGH, Festiwal Conrada, Karnet) oraz bileterii (eventim, ebilet, biletyna); odwołane i przełożone (Hello Roxette?, T.Love) usunięte. `color_code` pasuje do kategorii, `lat` i `lng` z geokodowania (Photon / Nominatim, dane OpenStreetMap). `price` to `0` tylko przy potwierdzonym wolnym wstępie, poza tym `null` (nieznana). `image_url` jest `null`: zdjęcia z krakow.travel nie mają wyjaśnionej licencji (zob. [docs/LEGAL.md](../docs/LEGAL.md)). Pierwsze 6 w pliku to talia startowa (po jednej z różnych kategorii). Po zmianie pliku: skopiuj go do `apps/backend/app/seed_events.json` i `apps/frontend/src/lib/events_oneoff.json`, a bazę zaktualizuj `uv run python scripts/replace_cards.py`.

Poza `events_oneoff.json` (prawdziwe wydarzenia, tylko fakty) wszystkie wydarzenia i organizatorzy w danych demo są fikcyjni i oznaczeni „(demo)”. Opisy piszemy własnymi słowami.
