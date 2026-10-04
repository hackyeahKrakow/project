# spootted — Brand Identity

## Nazwa i motto

- **Nazwa:** spootted
- **Motto:** „zmatchuj się z eventami w Krakowie"
- **Opis:** Aplikacja webowa (PWA) dla studentów w Krakowie: mapa pokazująca wyłącznie wydarzenia i miejsca dla studentów oraz „swipe" jak w Tinderze, który uczy się, co cię interesuje, i wyróżnia to na twojej mapie.

## Logo

Plik: `apps/frontend/public/logo.svg`

Koncepcja: pinezka mapowa z iskra w środku — „spotted" = wykryte wydarzenie. Litera „s" jako element marki.

## Kolory

### Kolory marki

| Rola | Kolor | HEX | Użycie |
| --- | --- | --- | --- |
| Ink 900 | Navy | `#0A1F44` | Tekst główny, tło ciemne |
| Brand 600 | Blue | `#1D5CFF` | Przyciski CTA, linki, akcenty |
| Brand 700 | Dark Blue | `#174BD9` | Tekst na jasnoniebieskim tle (5.9:1) |
| Spark 500 | Orange | `#FF8A3D` | CTA „Dodaj wydarzenie", promowane |
| Sky 300 | Light Blue | `#7DB8FF` | Liczniki na powitaniu |
| Violet 600 | Purple | `#6B4EE6` | Typ użytkownika, elementy AI |
| Surface | White/Navy | `#FFFFFF` / `#12264B` | Tło kart (jasny/ciemny) |
| Canvas | Light Blue | `#F3F7FF` | Tło strony |
| Muted | Gray | `#4A5B7D` | Tekst drugorzędny (6.3:1) |
| Line | Light Gray | `#D9E2F2` | Obramowania |

### Kolory kategorii (znaczniki na mapie)

| id | Nazwa | Kolor | Ikona Lucide |
| --- | --- | --- | --- |
| `nauka` | Nauka i koła naukowe | `#2563EB` | `graduation-cap` |
| `sport` | Sport i ruch | `#DC2626` | `dumbbell` |
| `muzyka` | Muzyka i sztuka | `#7C3AED` | `music` |
| `gry` | Gry i planszówki | `#EA580C` | `gamepad-2` |
| `imprezy` | Imprezy i integracja | `#DB2777` | `party-popper` |
| `kultura` | Kultura | `#0D9488` | `theater` |
| `warsztaty` | Warsztaty i rozwój | `#CA8A04` | `wrench` |

Wymagania: kontrast pinu min. 3:1 względem podkładu mapy, kolory rozróżnialne przy najczęstszych typach daltonizmu, ikona zawsze obok koloru.

## Typografia

- **Interfejs:** Outfit Variable (font-sans, Tailwind default)

## Ton głosu

- Język: polski
- Styl: przyjazny, energiczny, bez żargonu
- Forma: krótkie zdania, mówiące do użytkownika („Ty")
- Przykłady: „Bo lubisz: planszówki", „Dziś 19:00", „Za darmo"

## Zasady wizualne

- Mobile-first, szerokość 390 px
- Kolor nigdy nie jest jedynym nośnikiem informacji (kategorie mają też ikony)
- Ikony z `lucide-react` (Preline UI)
- Komponenty: Preline UI + Tailwind CSS
- Mapa: MapLibre GL JS + kafelki OSM, ukryte warstwy POI

## Pliki zasobów

| Plik | Opis |
| --- | --- |
| `apps/frontend/public/logo.svg` | Logo marki |
| `apps/frontend/src/lib/categories.ts` | Kolory i ikony kategorii (frontend) |
| `data/categories.json` | Kolory i ikony kategorii (backend, seed) |
| `apps/backend/static/img/` | Grafiki wydarzeń (WebP, 16:9) |
