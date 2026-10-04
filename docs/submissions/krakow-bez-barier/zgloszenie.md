# Kraków bez barier — zgłoszenie „spootted"

**Zespół:** The Spoots · **Platforma:** HackTribe · **Język:** polski · **Team ID:** [DO UZUPEŁNIENIA]

Projekt: **spootted — zmatchuj się z eventami w Krakowie** (PWA, https://spootted.dawidm.com, repo: https://github.com/hackyeahKrakow/spootted).

Zgłoszenie obejmuje wymagania formalne wyzwania: opis rozwiązania i problemu, prototyp/demonstrację, grupę docelową, źródła danych z oceną aktualności i wiarygodności, model biznesowy i dalszy rozwój, prezentację PDF (maks. 10 slajdów) oraz film (maks. 3 minuty). Dokumenty uzupełniające: [`dane-i-wiarygodnosc.md`](dane-i-wiarygodnosc.md), [`model-biznesowy.md`](model-biznesowy.md), [`scenariusz-wideo.md`](scenariusz-wideo.md), [`deck.html`](deck.html).

---

## 1. Problem

Kraków odwiedza rocznie ok. 817 tys. mieszkańców i miliony turystów o bardzo różnych potrzebach. Dla osoby poruszającej się na wózku zwykłe wyjście na koncert, do biblioteki czy na warsztaty wiąże się z serią pytań, na które dziś nie ma jednej odpowiedzi:

1. **Czy wjadę do środka?** (schody, progi, szerokość wejścia, podjazd)
2. **Czy poruszę się w budynku?** (winda, szerokość korytarzy, nawierzchnia)
3. **Czy będzie toaleta i miejsce odpoczynku?**
4. **Czy dojadę komunikacją miejską?** (czy tramwaj jest niskopodłogowy, czy przystanek jest czynny)
5. **Gdzie zaparkuję z kartą parkingową?**

Dziś Kuba (persona niżej) odpowiada na nie sam: dzwoni do organizatora albo szuka informacji na trzech różnych stronach. Samo oznaczenie „dostępne / niedostępne" **nie wystarcza** — nie mówi, czy miejsce pasuje do konkretnej osoby i jej potrzeb. Brakuje informacji szczegółowych, aktualnych i ze wskazaniem źródła. Informacje niepotwierdzone bywają podawane jako pewnik, co jest gorsze niż ich brak.

**Konsekwencja:** osoby z niepełnosprawnością ruchową rezygnują z wydarzeń albo jadą „na ryzyko". Miasto traci uczestników, obiekty tracą gości, a studenci — możliwość wyjścia z pokoju.

## 2. Grupa docelowa

**Osoby poruszające się na wózkach** (elektrycznych i manualnych) — mieszkańcy Krakowa i turyści, oraz pośrednio ich opiekunowie i rodziny. Prototyp jest celowo zawężony do tej jednej grupy, zgodnie z wyzwaniem.

**Persona: Kuba**, 2. rok UJ, porusza się na wózku elektrycznym, mieszka w Bronowicach. Do miasta jeździ tramwajem, czasem podwozi go tata. Jego trzy pytania przed każdym wyjściem: *czy wjadę do środka, czy pojedzie tramwaj niskopodłogowy i gdzie zaparkować z kartą parkingową.*

## 3. Rozwiązanie: zasada „ustaw raz, działa wszędzie"

spootted to aplikacja webowa (PWA) pokazująca wydarzenia w Krakowie na mapie i w talii typu swipe. Dla potrzeb tego wyzwania kluczowa jest **ścieżka dostępności**: potrzebę „Miejsca i dojazd bez barier" ustawia się **raz** (na ekranie powitalnym, w onboardingu albo w Koncie), a potem **każdy ekran z niej korzysta** — nie trzeba za każdym razem włączać filtra.

Ścieżka Kuby w działającej aplikacji:

| Krok | Co robi Kuba | Co robi aplikacja |
| --- | --- | --- |
| 1. Ekran powitalny | Otwiera „Ułatwienia dostępu" i włącza „Miejsca i dojazd bez barier" | Ustawienie działa od razu, przed onboardingiem; onboarding od razu w większym i kontrastowym tekście |
| 2. Onboarding | Widzi zaznaczony chip „Potrzebuję miejsc i dojazdu bez barier" | To samo ustawienie zapisane w profilu na telefonie |
| 3. Zgody | Włącza lokalizację | Przeglądarka pyta o zgodę; przy odmowie przełącznik sam się wyłącza i pokazuje, jak to naprawić |
| 4. Odkrywaj (swipe) | Swipe'uje wydarzenia | Miejsca z potwierdzonymi barierami nie trafiają do talii; miejsca bez barier są wyżej z uzasadnieniem „Bez barier"; miejsca o nieznanej dostępności zostają, ale są oznaczone jako nieznane |
| 5. Mapa | Otwiera mapę | Ta sama zasada; chip **„Potwierdzone bez barier"** zawęża mapę do miejsc z potwierdzoną dostępnością |
| 6. Karta wydarzenia | Otwiera koncert w TAURON Arenie | Znaczek „Bez barier" i **rozwijany panel „Szczegóły dostępności"**: wejście bez schodów, podjazd, winda, progi, toaleta, parking dla ON, miejsca odpoczynku, pętla indukcyjna — każde ze **źródłem, datą i wiarygodnością** |
| 7. Dojazd | Ustawia „Na miejscu o" i klika „Zaplanuj dojazd" | Trasa z zapasem czasu, odcinki piesze bez schodów (profil wózka), przy każdym tramwaju „niskopodłogowy" albo „wysokopodłogowy, stopnie przy wejściu", opóźnienia na żywo |
| 8. Utrudnienia | — | Jeśli przystanek przy wydarzeniu jest nieczynny, karta pokazuje komunikat ZTP, zanim Kuba wyjdzie z domu |
| 9. Autem | Rozwija „Autem: parkingi i miejsca dla osób z niepełnosprawnością" | Najpierw miejsca dla ON przy ulicy, potem parkingi z takimi miejscami (OpenStreetMap), link do mapy ZDMK |
| 10. Konto | Zmienia wszystko w jednym miejscu | Lokalizacja, miejsca i dojazd bez barier, większy tekst, wysoki kontrast, motyw |

### Szczegółowe dane o barierach (serce wyzwania)

Zamiast „dostępne/niedostępne" aplikacja pokazuje konkretne udogodnienia i bariery, a przy każdym informuje, **skąd pochodzi, kiedy została sprawdzona i jak wiarygodna jest**:

- wejście bez schodów i progu, podjazd lub pochylnia, winda, progi,
- szerokość wejścia i rodzaj nawierzchni,
- toaleta dla osób z niepełnosprawnością, miejsca odpoczynku,
- miejsce parkingowe dla osób z niepełnosprawnością, pętla indukcyjna.

Każda wartość może być „tak / nie / **brak danych**". **Brak danych nigdy nie jest prezentowany jako dostępność** — aplikacja wprost zachęca, żeby dopytać organizatora. Dane potwierdzone (np. z deklaracji dostępności obiektu) są oddzielone od niepotwierdzonych zgłoszeń użytkowników. Szczegóły modelu: [`dane-i-wiarygodnosc.md`](dane-i-wiarygodnosc.md).

### Dlaczego to jest użyteczne dla wskazanej grupy

- **Odpowiada na realne pytania Kuby**, nie na abstrakcyjne „czy jest dostępne".
- **Ustawienie raz** zamiast filtrowania przy każdym wejściu.
- **Trasa z niską podłogą i bez schodów** oraz parkingi dla ON — cała podróż, nie tylko miejsce.
- **Uczciwość danych**: widać, co jest potwierdzone, a czego nie wiadomo.
- **Dostępność cyfrowa WCAG 2.2 AA** (patrz sekcja 7), bo narzędzie dla osób z niepełnosprawnościami samo musi być dostępne.

## 4. Prototyp i demonstracja

- **Demo (produkcja):** https://spootted.dawidm.com
- **Repozytorium:** https://github.com/hackyeahKrakow/spootted (publiczne, MIT)
- **Konta demo:** student `ola@demo`, organizacja `biblioteka@demo`, hasło `demo1234` (atrapa logowania, opisana na slajdzie)
- **Film (maks. 3 min):** scenariusz i lista ujęć w [`scenariusz-wideo.md`](scenariusz-wideo.md); nagranie umieszczone w otwartym repozytorium

Demonstracja pokazuje **co najmniej jedno miejsce lub trasę** i konkretne bariery oraz udogodnienia. Na filmie i na slajdach pokazujemy trzy realne obiekty Krakowa z **oficjalnymi deklaracjami dostępności**:

| Obiekt | Status | Kluczowe fakty | Źródło |
| --- | --- | --- | --- |
| TAURON Arena Kraków | bez barier | 52 miejsca dla wózków na poziomie A (+52 dla opiekunów), winda dostosowana, bezpłatne miejsca parkingowe, rampy z poręczami przy wejściu | tauronarenakrakow.pl |
| ICE Kraków | bez barier | drzwi bezprogowe i fotokomórka, windy z parkingu do foyer, toalety dostosowane na każdym poziomie, miejsca dla wózków w salach S1–S3 | icekrakow.pl |
| Nowohuckie Centrum Kultury | bez barier | 8 miejsc parkingowych dla ON, winda w budynku A, brak progów w korytarzach, pętla indukcyjna w Sali teatralnej | nck.krakow.pl |

Dodatkowo pokazujemy **przypadek danych niepotwierdzonych** (Klub Studio — zgłoszenie użytkownika) oraz **przypadek danych niepełnych** (obiekty bez znalezionego źródła pozostają „brak danych"). Aplikacja nie przedstawia braku informacji jako potwierdzenia dostępności.

## 5. Źródła danych oraz ocena aktualności i wiarygodności (skrót)

Pełny opis: [`dane-i-wiarygodnosc.md`](dane-i-wiarygodnosc.md).

- **Deklaracje dostępności obiektów** (TAURON Arena, ICE Kraków, NCK) — źródło: strony obiektów, data sprawdzenia 3–4.10.2026, wiarygodność: **potwierdzone przez obiekt**.
- **OpenStreetMap** (tag `wheelchair`) — dla miejsc bez deklaracji; wartości `yes / limited / no` są zgodne z OSM i Wheelmap, więc dane można synchronizować; licencja ODbL, podpis.
- **Zgłoszenia użytkowników** — wiarygodność: **niepotwierdzone**; wyraźnie odróżnione i nigdy nie pokazywane jako gwarancja.
- **Dane miejskie** — przystanki i utrudnienia z ZTP Kraków (GTFS, GTFS-Realtime), trasy przez Transitous/MOTIS, parkingi z Overpass/OSM. Rozwiązanie **nie zakłada dostępu do systemów wewnętrznych UMK ani MJO**.
- **Aktualizacja:** deklaracje obiektów odświeżane ręcznie przy zmianie; OSM synchronizowany cyklicznie; zgłoszenia użytkowników moderowane; każdej informacji towarzyszy `updated_at`.
- **Poprawianie błędów:** użytkownik może zgłosić nieścisłość, organizator może zaktualizować deklarację, a obiekt może przejąć swój profil dostępności.
- **Postępowanie przy niedostępnym źródle:** aplikacja pokazuje ostatnie znane dane z datą albo „brak danych" — nigdy nie zgaduje.

## 6. Model biznesowy, komercjalizacja i skalowanie (skrót)

Pełny opis: [`model-biznesowy.md`](model-biznesowy.md).

- **Dla użytkowników (osób z niepełnosprawnością, studentów): zawsze bezpłatnie.**
- **Pakiety dla organizatorów i obiektów** (od 19 zł/mc): więcej wydarzeń z AI, statystyki, wyróżnienie, opinie.
- **Profil dostępności obiektu** jako usługa B2B (dla hoteli, instytucji kultury, organizatorów, zarządców nieruchomości): utrzymanie i potwierdzanie danych o dostępności, które trafiają do systemów rezerwacyjnych i aplikacji turystycznych.
- **Biała etykieta i API danych o dostępności** dla dostawców map, systemów rezerwacyjnych i innych miast.
- **Skalowanie na inne miasta** przez „paczkę miasta" (GTFS, granice, dzielnice, kategorie) — bez przebudowy architektury.

## 7. Dostępność cyfrowa (WCAG 2.2 AA)

Pełny audyt: [`docs/ACCESSIBILITY.md`](../ACCESSIBILITY.md).

- Audyt WCAG 2.1/2.2 AA w trzech rundach: **21 problemów poprawionych**, po poprawkach **0 naruszeń axe-core** na 11 ekranach × 4 motywy (jasny, ciemny, wysoki kontrast, ciemny + kontrast) × 2 szerokości.
- Obsługa klawiaturą całego scenariusza (widoczny fokus, pułapka fokusu w panelu, Escape, link „Przejdź do treści").
- Czytnik ekranu: etykiety, `role="progressbar"` dla kroków, `aria-live` dla nowych kart, informacja o mapie jako tekście.
- Kontrast tekstu min. 4,5:1 (większość powyżej), kolor nigdy jedynym nośnikiem informacji (ikony obok kolorów).
- **Tekstowa alternatywa dla mapy**: te same wydarzenia są dostępne jako lista, a informacje o dostępności są tekstem na karcie, nie tylko kolorem pinu.
- Motyw ciemny, wysoki kontrast i większy tekst wbudowane.

## 8. Wdrożenie i utrzymanie poza infrastrukturą UMK

- **Hosting:** Vercel (frontend + backend FastAPI) + Turso/SQLite; domena własna. Całość działa bez dostępu do systemów UMK/MJO.
- **Podmiot odpowiedzialny:** zespół The Spoots prowadzi produkt (docelowo spółka lub fundacja); dla wdrożenia miejskiego możliwa umowa powierzenia przetwarzania danych z Gminą Miejską Kraków.
- **Utrzymanie danych:** samoobsługa obiektów (profil dostępności) + moderowane zgłoszenia użytkowników + cykliczna synchronizacja OSM. Miasto nie musi ręcznie prowadzić bazy.
- **Bezpieczeństwo:** HTTPS, klucze API tylko w zmiennych środowiskowych, brak danych osobowych w bazie dla użytkownika anonimowego.
- **Koszty:** hosting i utrzymanie rzędu kilkuset zł/mc na start (szczegóły w [`model-biznesowy.md`](model-biznesowy.md)).

## 9. Ochrona danych i bezpieczeństwo (RODO)

- **Nie zbieramy informacji o niepełnosprawności.** Potrzeba „bez barier" zostaje na urządzeniu użytkownika; do backendu trafia wyłącznie jako parametr trasy `wheelchair=true` (profil pieszy), bez identyfikatora użytkownika.
- Przeglądanie nie wymaga konta, e-maila ani numeru telefonu. Preferencje i swipe'y działają pod losowym identyfikatorem, bez danych osobowych.
- Lokalizacja jest używana na urządzeniu i **jednorazowo** w zapytaniu o trasę (po kliknięciu „Zaplanuj dojazd"); nie jest zapisywana ani logowana.
- Dane dostępności obiektów pochodzą z informacji publicznych obiektów (deklaracje) i OSM; przy każdym wpisie podajemy źródło i datę.
- Połączenia szyfrowane (HTTPS); klucze API poza repozytorium.

## 10. Przewaga (WOW)

1. **Dostępność z proweniencją** — każde udogodnienie ma źródło, datę i wiarygodność; brak danych nie udaje dostępności. Tego nie robi żadne z porównywanych narzędzi.
2. **Ustaw raz, działa wszędzie** — filtr dostępności przenika talię, mapę, trasy i parkingi, zamiast być osobną zakładką.
3. **Cała podróż, nie tylko miejsce** — trasa bez schodów, tramwaje niskopodłogowe, parkingi dla ON, ostrzeżenia o utrudnieniach ZTP.
4. **Dane bez utrzymywania bazy przez miasto** — deklaracje obiektów + OSM + zgłoszenia użytkowników, z jasnym rozdzieleniem wiarygodności.
5. **Otwarte i skalowalne** — repozytorium MIT, zgodność wartości z OSM/Wheelmap, „paczka miasta" do uruchomienia w kolejnych miastach.

## 11. Ograniczenia prototypu i plan ich usunięcia

Uczciwie wskazujemy, czego jeszcze nie ma:

- **Pojazd na żywo** (numer taborowy z `VehiclePositions` ZTP) zamiast planowanego kursu niskopodłogowego z rozkładu — w planach.
- **Pełniejsze dane o miejscach** (winda — wymiary, toaleta, pętla indukcyjna, tłumacz PJM, audiodeskrypcja) — organizator/obiekt wypełnia w formularzu, użytkownicy potwierdzają po wydarzeniu („Czy wejście było bez barier?").
- **Miejskie dane ZDMK** o miejscach dla ON bezpośrednio w aplikacji (dziś link do mapy) i wolne miejsca na P+R.
- **Zgłoszenie bariery organizatorowi jednym przyciskiem.**
- **Moderacja zgłoszeń użytkowników** i pełny cykl potwierdzania (na prototypie oznaczamy je jako niepotwierdzone).
