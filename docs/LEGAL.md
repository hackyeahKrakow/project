# Legal i prywatność

Właściciel: PM + legal. To lista kontrolna zespołu, a nie porada prawna.

## Zasada danych

Nie scrapujemy. Wydarzenia dodają ich właściciele (koła, samorządy, uczelnie, lokale, studenci), a my używamy tylko danych otwartych. Automat, który „sam wchodzi na stronę i przepisuje”, to prawnie nadal scraping. AI może pomagać wyłącznie organizatorowi w wypełnieniu formularza jego własną treścią.

## Lista kontrolna

- [ ] **OpenStreetMap:** podpis „© OpenStreetMap contributors” widoczny na mapie (licencja ODbL).
- [ ] **Kafelki mapy:** sprawdzone warunki wybranego dostawcy (np. OpenFreeMap) i podany podpis, jeśli wymagany.
- [ ] **Geokodowanie (Photon, dane OSM):** podpowiedzi adresu idą przez backend (`GET /geocode`), nie z przeglądarki: maks. 1 zapytanie na sekundę z serwera, własny User-Agent, pamięć podręczna, tylko obszar Krakowa. Nominatim zabrania autouzupełniania przy pisaniu, dlatego podpowiedzi idą przez Photon (jednorazowe geokodowanie danych demo z `docs/PLAN.md` mieści się w zasadach Nominatim: 1 zapytanie na sekundę, wyniki zapisane). Przy większym ruchu: własna instancja Photona albo płatny dostawca.
- [ ] **Zdjęcia w kartach:** tylko darmowe zdjęcia z Unsplash na [licencji Unsplash](https://unsplash.com/license) (wolno używać bez zgody i podpisu, nie wolno sprzedawać ich bez zmian ani budować z nich konkurencyjnego serwisu), nigdy Unsplash+. Ładowane z `images.unsplash.com`, jak prosi Unsplash. Lista w `apps/frontend/src/lib/photos.ts`. To zdjęcia poglądowe według kategorii, nie zdjęcia z wydarzeń; docelowo organizator dodaje własne.
- [ ] **Google Maps:** nie używamy Places API. [Warunki dla EOG](https://cloud.google.com/terms/maps-platform/eea/maps-service-terms) zabraniają używania treści z Places z jakąkolwiek mapą (poza współrzędnymi i place_id) i zapisywania opinii. Opcjonalny przycisk „Pokaż w Google Maps” to zwykły link, bez API.
- [ ] **Dane demo:** opisy pisane własnymi słowami, organizatorzy fikcyjni z dopiskiem „(demo)”, żeby nie sugerować współpracy z prawdziwymi kołami. Wyjątek: `data/events_oneoff.json` to prawdziwe wydarzenia z Krakowa; bierzemy tylko fakty (nazwa, data, miejsce), opis własnymi słowami, bez zdjęć i plakatów (`image_url: null`), a organizator to „Organizator nieznany (demo)”. Na pitchu mówimy, że to dane demonstracyjne.
- [ ] **Grafiki:** własne lub wygenerowane, bez plakatów organizatorów; sprawdzona licencja elementów z Canvy.
- [ ] **Licencje bibliotek:** spisane w README lub `NOTICE` (MapLibre GL JS, Preline UI, Tailwind CSS, React, Vite, FastAPI, SQLModel/SQLAlchemy) i zgodne z licencją MIT repo.
- [ ] **Prywatność (RODO):** brak kont i danych osobowych; anonimowy UUID w `localStorage`; lokalizacja użytkownika używana tylko na urządzeniu i w parametrach `/feed`, nigdy nie zapisywana.
- [ ] **Typ użytkownika („Jakim typem jesteś?”):** liczony tylko na urządzeniu z zainteresowań i swipe'ów, nie trafia na serwer. Przy wydarzeniu pokazujemy go wyłącznie wtedy, gdy student sam zaznaczy to przy publikacji (domyślnie wyłączone, bez wcześniej zaznaczonego pola). To profilowanie w rozumieniu RODO, więc przed wersją z kontami: informacja w polityce prywatności i możliwość usunięcia typu z opublikowanych wydarzeń. Dopasowywanie osób do osób dopiero z kontami i osobną zgodą.
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
| OpenStreetMap, OpenFreeMap, Photon | Mapa i podpowiedzi adresu |
| Unsplash | Poglądowe zdjęcia w kartach wydarzeń |
| Canva, Figma | Grafiki i makiety |
