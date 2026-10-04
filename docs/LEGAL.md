# Legal i prywatność

Właściciel: PM + legal. To lista kontrolna zespołu, a nie porada prawna.

## Zasada danych

Nie scrapujemy. Wydarzenia dodają ich właściciele (koła, samorządy, uczelnie, lokale, studenci), a my używamy tylko danych otwartych. Automat, który „sam wchodzi na stronę i przepisuje”, to prawnie nadal scraping. AI może pomagać wyłącznie organizatorowi w wypełnieniu formularza jego własną treścią.

## Lista kontrolna

- [ ] **OpenStreetMap:** podpis „© OpenStreetMap contributors” widoczny na mapie (licencja ODbL).
- [ ] **Kafelki mapy:** sprawdzone warunki wybranego dostawcy (np. OpenFreeMap) i podany podpis, jeśli wymagany.
- [ ] **Geokodowanie (Photon, dane OSM):** podpowiedzi adresu idą przez backend (`GET /geocode`), nie z przeglądarki: maks. 1 zapytanie na sekundę z serwera, własny User-Agent, pamięć podręczna, tylko obszar Krakowa. Nominatim zabrania autouzupełniania przy pisaniu, dlatego podpowiedzi idą przez Photon (jednorazowe geokodowanie danych demo z `docs/PLAN.md` mieści się w zasadach Nominatim: 1 zapytanie na sekundę, wyniki zapisane). Przy większym ruchu: własna instancja Photona albo płatny dostawca.
- [ ] **Zdjęcia w kartach:** tylko darmowe zdjęcia z Unsplash na [licencji Unsplash](https://unsplash.com/license) (wolno używać bez zgody i podpisu, nie wolno sprzedawać ich bez zmian ani budować z nich konkurencyjnego serwisu), nigdy Unsplash+. Ładowane z `images.unsplash.com`, jak prosi Unsplash. Lista w `apps/frontend/src/lib/photos.ts`. To zdjęcia poglądowe według kategorii, nie zdjęcia z wydarzeń; docelowo organizator dodaje własne. Prawdziwe wydarzenia z `data/events_oneoff.json` mają w `image_url` zdjęcie z media.krakow.travel (licencja niepotwierdzona, przed komercjalizacją zapytać KBF) albo dobrane do wydarzenia zdjęcie z Unsplash; nigdy plakatów ani zdjęć promocyjnych organizatorów.
- [ ] **ZTP Kraków (GTFS, GTFS-Realtime):** przystanki i komunikaty o utrudnieniach z [gtfs.ztp.krakow.pl](https://gtfs.ztp.krakow.pl), pobierane przez backend (`GET /transit/near`), z pamięcią podręczną (przystanki na dobę, komunikaty na 2 minuty). Strona nie podaje osobnej licencji; dane publiczne udostępnione bez warunków wolno ponownie wykorzystywać (ustawa o otwartych danych i ponownym wykorzystywaniu informacji sektora publicznego z 2021 r.). Podajemy źródło przy komunikacie („ZTP Kraków”) i w zgłoszeniu. Przed komercjalizacją: potwierdzić warunki z ZTP.
- [ ] **Dostępność „Bez barier”:** dla 20 wydarzeń z Krakowa tylko fakty ze stron miejsc (stan na 3.10.2026): [TAURON Arena](https://www.tauronarenakrakow.pl/dla-osob-z-niepelnosprawnosciami), [ICE Kraków](https://icekrakow.pl/deklaracja-dostepnosci), [Nowohuckie Centrum Kultury](https://nck.krakow.pl/o-nck/deklaracja-dostepnosci). Miejsca bez znalezionego źródła (Klub Studio, Kwadrat, Zaścianek, Hype Park, Kino Kijów) zostają „nieznane”, nie zgadujemy. Przy nowych wydarzeniach dostępność deklaruje organizator. Wartości `yes / limited / no` są takie same jak w tagu OSM `wheelchair`, dane z OSM są na licencji ODbL.
- [ ] **Transitous (planer tras, `GET /route`):** darmowy tylko do użytku niekomercyjnego i dla projektów z otwartym kodem (nasze repo jest publiczne, MIT); każde zapytanie ma User-Agent z linkiem do repo; przed większym ruchem trzeba się z nimi skontaktować ([zasady](https://transitous.org/api)). Przy płatnych pakietach dla organizacji to już użytek komercyjny, więc przed komercjalizacją: własna instancja MOTIS (open source) na danych ZTP. Pozycja użytkownika trafia do Transitous tylko po kliknięciu „Zaplanuj dojazd” i tylko na to jedno zapytanie; nie zapisujemy jej i nie logujemy. Podpis „Trasy: Transitous” jest pod wynikiem.
- [ ] **Parkingi (Overpass, dane OSM):** `GET /parking/near` pyta publiczną instancję Overpass z serwera, jedno zapytanie na raz, wynik trzymany dobę; podpis „© współtwórcy OpenStreetMap” przy liście (ODbL). Przy większym ruchu: własna instancja Overpass. Miejska mapa miejsc dla osób z niepełnosprawnością (ZDMK) jest tylko linkiem.
- [ ] **Google Maps:** nie używamy Places API. [Warunki dla EOG](https://cloud.google.com/terms/maps-platform/eea/maps-service-terms) zabraniają używania treści z Places z jakąkolwiek mapą (poza współrzędnymi i place_id) i zapisywania opinii. Opcjonalny przycisk „Pokaż w Google Maps” to zwykły link, bez API.
- [ ] **Dane demo:** opisy pisane własnymi słowami, organizatorzy fikcyjni z dopiskiem „(demo)”, żeby nie sugerować współpracy z prawdziwymi kołami. Wyjątek: `data/events_oneoff.json` to prawdziwe wydarzenia z Krakowa; bierzemy tylko fakty (nazwa, data, miejsce), opis własnymi słowami, bez plakatów (zdjęcia: zob. „Zdjęcia w kartach”), a organizator to „Organizator nieznany (demo)”. Ten sam plik ma też fikcyjne wydarzenia w prawdziwych budynkach uczelni: ich koła i kluby są wymyślone i oznaczone „(demo)”, nigdy nie podpisujemy fikcyjnych wydarzeń nazwą istniejącej organizacji studenckiej. Na pitchu mówimy, że to dane demonstracyjne.
- [ ] **Grafiki:** własne lub wygenerowane, bez plakatów organizatorów; sprawdzona licencja elementów z Canvy.
- [ ] **Licencje bibliotek:** spisane w README lub `NOTICE` (MapLibre GL JS, Preline UI, Tailwind CSS, React, Vite, FastAPI, SQLModel/SQLAlchemy) i zgodne z licencją MIT repo.
- [ ] **Prywatność (RODO):** brak kont i danych osobowych; anonimowy UUID w `localStorage`; lokalizacja użytkownika używana na urządzeniu i jednorazowo w zapytaniu o trasę (`/route`, po kliknięciu), nigdy nie zapisywana ani logowana. Potrzeba „bez barier” to informacja o zdrowiu (dane szczególnej kategorii, art. 9 RODO), dlatego zostaje tylko na urządzeniu: na serwer idzie wyłącznie jako parametr trasy `wheelchair=true` (a dalej do Transitous jako profil pieszy), bez identyfikatora użytkownika.
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
| ZTP Kraków: GTFS i GTFS-Realtime | Najbliższe przystanki i utrudnienia przy wydarzeniu |
| gtfs-realtime-bindings (Apache 2.0) | Odczyt komunikatów GTFS-Realtime w backendzie |
| Transitous (MOTIS) | Planowanie trasy komunikacją miejską z godziną przybycia i niską podłogą |
| Overpass API (OpenStreetMap) | Parkingi i miejsca dla osób z niepełnosprawnością przy wydarzeniu |
| Canva, Figma | Grafiki i makiety |
