# Design

Właściciel: design. Narzędzia: Claude Design (szybkie warianty), Figma (wersja finalna), Canva (grafiki wydarzeń, slajdy).

## Kategorie

Kolory i ikony kategorii zgodne z [docs/BRAND.md](BRAND.md). Zadanie D1 ustala finalne wartości do 0:45; po zmianie zaktualizujcie [data/categories.json](../data/categories.json) i `apps/frontend/src/lib/categories.ts`.

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

Kolejność od góry: grafika 16:9 → tytuł → badge kategorii (kolor + ikona) → data i godzina („czw., 8 paź, 19:00”) → adres → cena („Za darmo” albo „15 zł”) → organizator ze znaczkiem „zweryfikowane” → dostępność dla wózka (status z ikoną, szczegóły rozwijane, źródło danych, „brak informacji” jako jawny stan) → opis (rozwijany).

Grafika: na razie poglądowe zdjęcie z Unsplash dobrane do kategorii (`apps/frontend/src/lib/photos.ts`, zob. LEGAL.md). Pod zdjęciem zawsze leży tło w kolorze kategorii z dużą ikoną: widać je, zanim zdjęcie się wczyta, i zostaje, gdy się nie wczyta. Piny na mapie mają tylko kolor i ikonę kategorii, bez zdjęć.

## Ekrany (mobile 390 px)

1. **Personalizacja (pierwsze uruchomienie):** cztery ekrany, jedno pytanie na ekran, pasek postępu „1/4”, „Pomiń” i „Wstecz” zawsze widoczne, odpowiedzi jako duże chipy (min. 44 px) z ikonami. (1) „Co lubisz robić?”: 3–5 kategorii. (2) „Jakie wydarzenia wolisz?”: kameralne / średnie / duże / bez różnicy. (3) „Czego dziś szukasz?”: do 3 celów (poznać ludzi, nauczyć się czegoś, dobrze się bawić, ruszyć się, kultura i spokój, oszczędzić). (4) „Co jest dla ciebie ważne?”: budżet, odległość, pora. Przycisk „Dalej”, na końcu „Pokaż mi wydarzenia”. Ekran „Moje preferencje” używa tych samych komponentów. Szczegóły w [SPEC.md](SPEC.md#personalizacja-przy-pierwszym-uruchomieniu).
2. **Mapa:** pełnoekranowa mapa, filtry jako chipy u góry, karta w dolnym panelu (Sheet) po kliknięciu pinu, polubione piny wyróżnione (większe, z obwódką).
3. **Odkrywaj (swipe):** jedna karta na ekranie, przyciski ✕ i ♥ jako alternatywa dla gestu, uzasadnienie „Twój match: …” na karcie (np. „Twój match: kameralne · planszówki · za darmo”).
4. **Moje:** lista i mapa polubionych wydarzeń.
5. **Dodaj wydarzenie:** pole „wklej opis”, przycisk „Wypełnij z AI”, formularz z podświetleniem pól do sprawdzenia.

Nawigacja: Mapa / Odkrywaj / Moje / Konto. Telefon (do 600 px): pasek na dole. Tablet (600–900 px): wąska kolumna z ikonami po lewej. Laptop (od 900 px): boczny panel z logo i podpisami, lista wydarzeń obok mapy, karta wydarzenia jako panel po prawej. Dodawanie wydarzenia jako osobna akcja „+ Dodaj wydarzenie” dla zalogowanych. Boczny panel na laptopie można zwinąć do kolumny z ikonami (przycisk na dole panelu); na mapie startuje zwinięty. Mapa ma rozwijaną legendę (kolory kategorii, polubione, promowane), na laptopie otwartą od startu.

**Motywy.** Kolory, które zmieniają się z motywem, są zmiennymi `--c-*` w `src/index.css` (`surface`, `fg`, `link`, `canvas`, `line`, `muted`, `brand-50`, `brand-700`, `violet-50`, `spark-50`, `track`, `map`). Klasa `dark` na `<html>` włącza ciemny motyw (z ustawień albo z systemu), klasa `hc` wysoki kontrast: mocniejszy tekst pomocniczy i obramowania, grubszy fokus (4 px); `dark hc` to czarne tło i biały tekst. Kolory marki (`ink-900`, `brand-600`, `spark-500`) są stałe. Ciemna mapa to odwrócony jasny podkład (filtr CSS), piny zostają w swoich kolorach. Logo ma ciemny napis, więc w ciemnym motywie stoi na białej plakietce, dopóki nie będzie jasnej wersji z pomarańczowymi oczami.

**Ruch.** Ekrany pojawiają się z krótkim wygaszeniem (200 ms), panel wydarzenia wjeżdża z dołu (telefon) albo z prawej (tablet, laptop), nowa karta w talii lekko rośnie, a karta puszczona przed progiem wraca ze sprężystym odbiciem. Przy `prefers-reduced-motion` wszystkie animacje i przejścia trwają 1 ms.

Dostępność (WCAG 2.1 AA): raport i zasady w [ACCESSIBILITY.md](ACCESSIBILITY.md).

## Zasady mapy

- Ukryte wszystkie POI (sklepy, stacje, restauracje z podkładu). Widoczne tylko nasze piny.
- Środek: Kraków, Rynek Główny, zoom ok. 13.
- Podpis „© OpenStreetMap contributors” zawsze widoczny.

## Grafiki wydarzeń

- Szablon w Canvie 16:9 (np. 1200×675), wariant na każdą kategorię.
- Eksport do WebP, nazwa pliku = `id` wydarzenia (`evt_001.webp`), katalog `apps/backend/static/img/`.
- Tylko własne lub wygenerowane grafiki, bez plakatów organizatorów. Sprawdźcie licencję elementów z Canvy.

## Koncept UI: strona WWW (spootted)

Interaktywny podgląd całego konceptu (logo, 5 ekranów × desktop 1440 / tablet 820 / telefon 390 px, plansza Handoff): [design/spotted-koncept-ui.html](design/spotted-koncept-ui.html) (pobierz i otwórz w przeglądarce). Biblioteka komponentów: Preline UI na Tailwind.

**Nazwa i logo:** `spootted`. Logo to napis z dwojgiem oczu w „oo” (`apps/frontend/src/assets/logo-full.svg`), a ikona aplikacji i favicon to same oczy (`apps/frontend/src/assets/icon.svg`). Oba pliki to kwadratowe eksporty z Canvy, więc w aplikacji napis jest przycinany przez `object-fit`. Logo ma ciemny napis: na ciemnym tle stawiamy je na białej plakietce. Wcześniejsza wersja z flagą jest nieaktualna.

**Kolory marki:** Głęboka woda `#0A1F44`, Nurt `#1D5CFF`, Tafla `#7DB8FF`, Zmierzch `#6B4EE6`, Iskra `#FF8A3D` (CTA, tylko jako wypełnienie z granatowym tekstem). Tło `#F3F7FF`, obramowanie `#D9E2F2`, tekst pomocniczy `#4A5B7D`. Kolory kategorii bez zmian (tymczasowe, patrz wyżej).

**Tokeny Tailwind (`app.css`):**

```css
@import "tailwindcss";
@plugin "@tailwindcss/forms";
@source "../node_modules/preline/dist/*.js";
@import "preline/variants.css";

@theme {
  --font-sans: "Outfit", system-ui, sans-serif;
  --color-ink-900: #0A1F44;
  --color-brand-600: #1D5CFF;
  --color-brand-700: #174BD9; /* tekst na tle brand-50, kontrast 5.9:1 */
  --color-sky-300: #7DB8FF;
  --color-violet-600: #6B4EE6;
  --color-spark-500: #FF8A3D;
  --color-canvas: #F3F7FF;
  --color-line: #D9E2F2;
  --color-muted: #4A5B7D;
}
```

**Mapowanie na Preline:** filtry = Buttons (pill), karta wydarzenia = Card, badge kategorii = Badge, panel wydarzenia na mapie = Offcanvas (na telefonie od dołu), pytania personalizacji = Buttons (chipy) w układzie Stepper/Progress, Lista/Mapa = Tabs, formularz = Input/Textarea/Select, nawigacja = Navbar. W React po zmianie trasy wywołujcie `HSStaticMethods.autoInit()`.

**Responsywność:** breakpointy ≤900 px (marginesy 24 px, kolumny pod sobą, mapa nad listą) i ≤600 px (nagłówek dwurzędowy, filtry przewijane poziomo, karta na mapie jako panel dolny). Ekran Odkrywaj mieści się w jednym oknie (`100vh`), swipe: próg ≈ 90 px, obrót ≈ dx/18 °, pieczątki „POLUBIĘ” / „POMIŃ”. Cele dotykowe min. 44 px.
