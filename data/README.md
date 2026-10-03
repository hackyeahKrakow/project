# Dane

- `categories.json`: kategorie (tymczasowe kolory i ikony, finalne z zadania D1).
- `events.example.json`: 5 przykładowych wydarzeń zgodnych z kontraktem z [docs/API.md](../docs/API.md).
- `events.json`: pełne dane demo (30–50 wydarzeń), tworzy PM w zadaniu P3 na wzór pliku przykładowego.
- `events_oneoff.json`: 20 jednorazowych wydarzeń w Krakowie (paź–gru 2026) w schemacie kart (`event_name`, `starts_at`, `address`…) plus `category` z `categories.json`. `color_code` pasuje do kategorii, `lat` i `lng` pochodzą z geokodowania adresu (Photon, dane OpenStreetMap), a `price` jest jeszcze `null`, `ends_at` prawie zawsze. `image_url` jest `null`: zdjęcia z krakow.travel nie mają wyjaśnionej licencji (zob. [docs/LEGAL.md](../docs/LEGAL.md)). `image_url` to oryginalne zdjęcia z media.krakow.travel (licencja niepotwierdzona, patrz [docs/LEGAL.md](../docs/LEGAL.md)); frontend pokazuje je zamiast zdjęć z Unsplash.

Poza `events_oneoff.json` (prawdziwe wydarzenia, tylko fakty) wszystkie wydarzenia i organizatorzy w danych demo są fikcyjni i oznaczeni „(demo)”. Opisy piszemy własnymi słowami.
