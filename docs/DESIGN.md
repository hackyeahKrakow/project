# Design

Właściciel: design. Narzędzia: Claude Design (szybkie warianty), Figma (wersja finalna), Canva (grafiki wydarzeń, slajdy).

## Kategorie

**Wartości tymczasowe.** Zadanie D1 ustala finalne kolory i ikony do 0:45; po zmianie zaktualizujcie [data/categories.json](../data/categories.json) i `apps/frontend/src/lib/categories.ts`.

| id | Nazwa | Kolor (tymczasowy) | Ikona Lucide |
| --- | --- | --- | --- |
| `nauka` | Nauka i koła naukowe | `#2563EB` | `graduation-cap` |
| `sport` | Sport i ruch | `#DC2626` | `dumbbell` |
| `muzyka` | Muzyka i sztuka | `#7C3AED` | `music` |
| `gry` | Gry i planszówki | `#EA580C` | `gamepad-2` |
| `imprezy` | Imprezy i integracja | `#DB2777` | `party-popper` |
| `kultura` | Kultura | `#0D9488` | `theater` |
| `warsztaty` | Warsztaty i rozwój | `#CA8A04` | `wrench` |

Wymagania: kontrast pinu min. 3:1 względem podkładu mapy, kolory rozróżnialne przy najczęstszych typach daltonizmu, ikona zawsze obok koloru.

## Karta wydarzenia

Kolejność od góry: grafika 16:9 → tytuł → badge kategorii (kolor + ikona) → data i godzina („czw., 8 paź, 19:00”) → adres → cena („Za darmo” albo „15 zł”) → organizator ze znaczkiem „zweryfikowane” → opis (rozwijany).

Brak grafiki: tło w kolorze kategorii z dużą ikoną.

## Ekrany (mobile 390 px)

1. **Onboarding:** wybór uczelni i 3–5 zainteresowań, przycisk „Zaczynamy”.
2. **Mapa:** pełnoekranowa mapa, filtry jako chipy u góry, karta w dolnym panelu (Sheet) po kliknięciu pinu, polubione piny wyróżnione (większe, z obwódką).
3. **Odkrywaj (swipe):** jedna karta na ekranie, przyciski ✕ i ♥ jako alternatywa dla gestu, uzasadnienie „Bo lubisz…” na karcie.
4. **Moje:** lista i mapa polubionych wydarzeń.
5. **Dodaj wydarzenie:** pole „wklej opis”, przycisk „Wypełnij z AI”, formularz z podświetleniem pól do sprawdzenia.

Dolna nawigacja: Mapa / Odkrywaj / Moje, przycisk „+” do dodawania.

## Zasady mapy

- Ukryte wszystkie POI (sklepy, stacje, restauracje z podkładu). Widoczne tylko nasze piny.
- Środek: Kraków, Rynek Główny, zoom ok. 13.
- Podpis „© OpenStreetMap contributors” zawsze widoczny.

## Grafiki wydarzeń

- Szablon w Canvie 16:9 (np. 1200×675), wariant na każdą kategorię.
- Eksport do WebP, nazwa pliku = `id` wydarzenia (`evt_001.webp`), katalog `apps/backend/static/img/`.
- Tylko własne lub wygenerowane grafiki, bez plakatów organizatorów. Sprawdźcie licencję elementów z Canvy.
