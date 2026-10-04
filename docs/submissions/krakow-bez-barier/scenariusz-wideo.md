# Scenariusz filmu (maks. 3 minuty) — Kraków bez barier

**Tytuł:** spootted — Kraków bez barier. Zmatchuj się z eventami, do których wjedziesz.
**Długość:** ~2:45 (maks. 3:00). **Język:** polski, **napisy PL** (i opcjonalnie EN).
**Format:** 1920×1080 (16:9), 30 fps, H.264 MP4.
**Lektor:** opcjonalny (TTS). Napisy są obowiązkowe — film ma być dostępny dla osób niesłyszących.
**Hosting:** plik w otwartym repozytorium (`docs/submissions/krakow-bez-barier/spootted-krakow-bez-barier.mp4`) lub link do niego z repo.

Narracja jest krótka; kluczowe zdania pojawiają się też jako napisy i tekst na ekranie. Wszystkie ujęcia z **działającej aplikacji** (https://spootted.dawidm.com), nagrywane automatycznie przez Playwright.

---

## Ujęcia

| # | Czas | Ekran / akcja | Napis (PL) | Narracja (opcjonalna) |
| --- | --- | --- | --- | --- |
| 1 | 0:00–0:12 | Ekran powitalny, w tle mapa Krakowa z pinami; klik „Ułatwienia dostępu" | „Kraków. Wydarzenia, do których wjedziesz." | „Kraków to miasto wydarzeń. Ale dla osoby na wózku zwykłe wyjście to seria pytań." |
| 2 | 0:12–0:25 | Panel „Ułatwienia dostępu": włączony przełącznik „Miejsca i dojazd bez barier", większy tekst, wysoki kontrast | „Ustawiasz raz. Aplikacja robi resztę." | „W spootted potrzebę dostępności ustawiasz raz — i każdy ekran już ją zna." |
| 3 | 0:25–0:40 | Onboarding, krok 4 z zaznaczonym chipem „Potrzebuję miejsc i dojazdu bez barier", przycisk „Rozumiem, zaczynam" | „Bez konta. Bez maila. Ustawienia zostają na telefonie." | „Bez rejestracji. Twoje potrzeby zostają na twoim telefonie." |
| 4 | 0:40–1:00 | Talia „Odkrywaj": dwa swipe'y w prawo, na karcie uzasadnienie „Bez barier" | „Miejsca z barierami nie trafiają do talii." | „Talia pomija miejsca z potwierdzonymi barierami, a te bez barier pokazuje wyżej." |
| 5 | 1:00–1:18 | Mapa z chipem „Potwierdzone bez barier", polubione piny | „Chip: tylko miejsca z potwierdzoną dostępnością." | „Na mapie jednym dotknięciem zawężasz widok do miejsc potwierdzonych." |
| 6 | 1:18–1:45 | Karta wydarzenia: **TAURON Arena**, rozwinięcie „Szczegóły dostępności" (wejście bez schodów, winda, toaleta, parking, 52 miejsca), źródło z linkiem, data, „Potwierdzone przez obiekt" | „Źródło, data, wiarygodność. Bez zgadywania." | „Zamiast 'dostępne' — konkret: wejście, winda, toaleta, parking. Ze źródłem i datą." |
| 7 | 1:45–2:00 | Karta **Klub Studio**: etykieta „Niepotwierdzone (zgłoszenie)", adnotacja „dopytać organizatora" | „Czego nie wiemy, mówimy wprost." | „A jeśli nie mamy potwierdzenia — mówimy to wprost. Brak danych to nie dostępność." |
| 8 | 2:00–2:25 | „Zaplanuj dojazd": trasa bez schodów, odznaka „Tramwaj niskopodłogowy", opóźnienia na żywo | „Trasa bez schodów, tramwaj niskopodłogowy, na miejscu na czas." | „Trasa omija schody i podpowiada tramwaj niskopodłogowy, z opóźnieniami na żywo." |
| 9 | 2:25–2:35 | Sekcja „Autem": miejsca dla ON przy ulicy i parkingi, link do ZDMK | „Parkingi z miejscami dla osób z niepełnosprawnością." | „A jeśli jedziesz autem — najpierw miejsca dla osób z niepełnosprawnością." |
| 10 | 2:35–2:45 | Logo spootted + adres demo + repo + „Dane: deklaracje obiektów, OpenStreetMap, ZTP Kraków" | „spootted — zmatchuj się z eventami. Demo: spootted.dawidm.com" | „spootted. Zmatchuj się z eventami, do których wjedziesz." |

## Napisy

- Format: wypalone napisy w filmie **oraz** plik `.srt` w repo (`spootted-krakow-bez-barier.srt`).
- Styl: biały tekst, ciemne półprzezroczyste tło, min. 24 px, kontrast ≥ 4,5:1.
- Każda napis ≤ 2 linie, ≤ 42 znaki na linię.

## Automatyzacja nagrania (Playwright)

Skrypt `scripts/record-demo.mjs` (Playwright, Chromium) przechodzi tę samą ścieżkę i nagrywa ją w 1280×720 (16:9), tempo dopasowane do napisów (2:45). Osobne zrzuty telefonu (390×844) robimy do decku.

1. viewport 1280×720, tempo zsynchronizowane z napisami PL,
2. wejście na ekran powitalny, otwarcie „Ułatwień dostępu", włączenie trybu bez barier,
3. onboarding (4 kroki) i ekran zgody,
4. kilka swipe'ów w prawo,
5. mapa + chip „Potwierdzone bez barier",
6. karta TAURON Arena → rozwinięcie „Szczegóły dostępności",
7. karta Klub Studio → etykieta niepotwierdzona,
8. „Zaplanuj dojazd",
9. sekcja „Autem",
10. zrzut końcowy z logo.

Uruchomienie: `BASE=https://spootted.dawidm.com node scripts/record-demo.mjs`. Nagranie zapisuje się jako `docs/submissions/krakow-bez-barier/raw/*.webm`, a montaż (napisy, skala 1920×1080, H.264) robimy w ffmpeg (polecenie w komentarzu skryptu).

## Uwagi

- Na filmie **wyraźnie oznaczamy dane demonstracyjne**, jeśli takie wystąpią; prawdziwe obiekty (TAURON Arena, ICE Kraków, NCK) mają realne deklaracje.
- Nie pokazujemy danych osobowych ani lokalizacji użytkownika.
- Film nie przekracza 3 minut i jest dostępny z otwartego repozytorium, zgodnie z wymaganiami.
