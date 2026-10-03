# Legal i prywatność

Właściciel: PM + legal. To lista kontrolna zespołu, a nie porada prawna.

## Zasada danych

Nie scrapujemy. Wydarzenia dodają ich właściciele (koła, samorządy, uczelnie, lokale, studenci), a my używamy tylko danych otwartych. Automat, który „sam wchodzi na stronę i przepisuje”, to prawnie nadal scraping. AI może pomagać wyłącznie organizatorowi w wypełnieniu formularza jego własną treścią.

## Lista kontrolna

- [ ] **OpenStreetMap:** podpis „© OpenStreetMap contributors” widoczny na mapie (licencja ODbL).
- [ ] **Kafelki mapy:** sprawdzone warunki wybranego dostawcy (np. OpenFreeMap) i podany podpis, jeśli wymagany.
- [ ] **Nominatim:** maks. 1 zapytanie na sekundę, własny nagłówek User-Agent z nazwą projektu, bez masowego geokodowania w pętli przy każdym żądaniu (wyniki zapisujemy w bazie).
- [ ] **Google Maps:** nie używamy Places API. [Warunki dla EOG](https://cloud.google.com/terms/maps-platform/eea/maps-service-terms) zabraniają używania treści z Places z jakąkolwiek mapą (poza współrzędnymi i place_id) i zapisywania opinii. Opcjonalny przycisk „Pokaż w Google Maps” to zwykły link, bez API.
- [ ] **Dane demo:** opisy pisane własnymi słowami, organizatorzy fikcyjni z dopiskiem „(demo)”, żeby nie sugerować współpracy z prawdziwymi kołami. Na pitchu mówimy, że to dane demonstracyjne.
- [ ] **Grafiki:** własne lub wygenerowane, bez plakatów organizatorów; sprawdzona licencja elementów z Canvy.
- [ ] **Licencje bibliotek:** spisane w README lub `NOTICE` (MapLibre GL JS, Preline UI, Tailwind CSS, React, Vite, FastAPI, SQLModel/SQLAlchemy) i zgodne z licencją MIT repo.
- [ ] **Prywatność (RODO):** brak kont i danych osobowych; anonimowy UUID w `localStorage`; lokalizacja użytkownika używana tylko na urządzeniu i w parametrach `/feed`, nigdy nie zapisywana.
- [ ] **Klucze API:** tylko w `.env` (ignorowany przez git), nigdy w repo ani we frontendzie.
- [ ] **Płatne promowanie (roadmapa):** zawsze oznaczone jako „Promowane”. Przepisy wdrażające dyrektywę Omnibus (w Polsce od 1.01.2023) wymagają ujawniania płatnego pozycjonowania.
- [ ] **Ujawnienie AI w zgłoszeniu:** lista użytych narzędzi AI, modeli i API (sekcja niżej), zgodnie z regulaminem HackYeah.
- [ ] **Praca sprzed hackathonu:** brak; jeśli coś istniało wcześniej, wyraźnie to oznaczamy.

## Do ujawnienia w zgłoszeniu (uzupełniać na bieżąco)

| Narzędzie / zasób | Do czego |
| --- | --- |
| Claude (claude.ai) | Research rynku, specyfikacja, dokumentacja |
| Claude Code + spec-kit | Wsparcie przy kodzie backendu |
| Claude Design | Warianty makiet |
| LLM API (który?) | Autofill formularza w aplikacji |
| OpenStreetMap, Nominatim | Mapa i geokodowanie |
| Canva, Figma | Grafiki i makiety |
