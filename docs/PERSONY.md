# Persony i user stories

Materiał do prezentacji (slajd 3 w [PITCH.md](PITCH.md)) i do backlogu. Zakres i priorytety są zgodne z [SPEC.md](SPEC.md).

> Persony są fikcyjne. Opierają się na problemie z [RESEARCH.md](RESEARCH.md), a nie na wynikach ankiety. Gdy P5 uzupełni ankietę, podmieńcie cytaty na prawdziwe.

## Role w aplikacji

| Rola | Jak się zaczyna | Co może |
| --- | --- | --- |
| **Gość** (anonim) | Otwiera aplikację, przechodzi personalizację | Przegląda, swipe'uje, obserwuje, filtruje, buduje **lokalną bazę wydarzeń na urządzeniu**. Nie może tworzyć wydarzeń, być obserwowany ani polecać. |
| **Użytkownik** (konto) | Zakłada konto, jego lokalna baza przenosi się na konto | Wszystko co gość, plus: tworzy wydarzenia, ma publiczny profil, jest obserwowany, buduje community, poleca wydarzenia obserwującym, synchronizuje dane między urządzeniami. |
| **Organizacja** (profil firmowy) | Użytkownik tworzy profil koła, biblioteki, uczelni itd. i zaprasza innych użytkowników | Publikuje wydarzenia „oficjalne” ze znaczkiem zweryfikowanej organizacji, ma obserwujących, statystyki swipe'ów, może promować wydarzenia. Działają w jej imieniu zarejestrowani członkowie z rolami. |

Uzasadnienie wyboru profili organizacji w [SPEC.md](SPEC.md#konta-i-organizacje).

## Persony

### 1. Ola, 19 lat, 1. rok na AGH (persona główna, demo)

| | |
| --- | --- |
| **Sytuacja** | Przyjechała z mniejszego miasta, nikogo nie zna w Krakowie, mieszka w akademiku. |
| **Cel** | Poznać ludzi i znaleźć coś do roboty po zajęciach, najlepiej za darmo lub tanio. |
| **Frustracje** | Wydarzenia są na stronach wydziałów, w grupach na Facebooku i na Instagramach kół. Nie wie, gdzie szukać, więc nie wychodzi. |
| **Zachowanie** | Telefon w ręku cały dzień, nie chce zakładać kolejnego konta, rzuca aplikację, jeśli start trwa dłużej niż chwilę. Woli małe, kameralne wydarzenia niż duże imprezy. |
| **Czego oczekuje** | Start bez rejestracji, propozycje dopasowane do niej od pierwszego dnia, czytelna mapa, żeby wiedzieć, jak dojść. |
| **Etap** | Tydzień 1: gość z lokalną bazą. Tydzień 2: zakłada konto, żeby nie stracić bazy i zorganizować swoje „planszówki w akademiku”. |
| **Cytat (do zastąpienia z ankiety)** | „Wiem, że coś się dzieje, ale nie wiem gdzie.” |

### 2. Kuba, 21 lat, 3. rok na UJ, przewodniczący koła naukowego (organizator)

| | |
| --- | --- |
| **Sytuacja** | Ma konto i jest administratorem profilu koła. Organizuje wykłady, warsztaty i wyjazdy, promuje je postami na Instagramie i w grupach. |
| **Cel** | Zapełnić salę i zwerbować pierwszaków do koła. |
| **Frustracje** | Posty toną w feedzie, dotarcie do nowych osób wymaga ręcznego rozsyłania, a dodanie wydarzenia w wielu miejscach zabiera czas. Co roku zarząd się zmienia, a z nim dostęp do kont społecznościowych. |
| **Czego oczekuje** | Dodać wydarzenie w minutę, wklejając gotowy tekst posta, trafić do osób, które lubią taką tematykę, i móc przekazać profil następnemu zarządowi. |

### 3. Pan Marek, 52 lata, dyrektor miejskiej biblioteki (instytucja publiczna)

| | |
| --- | --- |
| **Sytuacja** | Zarządza biblioteką z czytelnią i salą na wydarzenia (spotkania autorskie, warsztaty, wystawy, noce bibliotek). Podobną rolę ma dyrektor muzeum czy domu kultury. |
| **Cel** | Pokazać studentom, że biblioteka to nie tylko wypożyczalnia, i zapełnić wydarzenia oraz czytelnię, zwłaszcza w sesji. |
| **Frustracje** | Młodzi ludzie nie śledzą kanałów instytucji, budżet na promocję jest minimalny, a oferta (czytelnie, wystawy, wstęp wolny) nie jest widoczna tam, gdzie studenci szukają zajęć po wykładach. |
| **Czego oczekuje** | Jeden profil biblioteki, na którym wydarzenia dodaje kilku jego pracowników, z oznaczeniem zweryfikowanej instytucji. Dobrze byłoby w przyszłości pokazać godziny otwarcia czytelni. |

### 4. Pani Anna, 42 lata, biuro promocji uczelni (instytucja)

| | |
| --- | --- |
| **Sytuacja** | Odpowiada za dni otwarte, konferencje i wydarzenia wydziałowe, w zespole kilku osób. |
| **Cel** | Dotrzeć do studentów i kandydatów w ramach ograniczonego budżetu. |
| **Frustracje** | Płatne formy dotarcia, jak reklama w komunikacji miejskiej, są drogie i trudno zmierzyć ich efekt. |
| **Czego oczekuje** | Tańszy i bardziej precyzyjny kanał do studentów oraz informacji, ile osób zainteresował wydarzenie. |

## User stories

Format: **Jako** [rola] **chcę** [cel], **żeby** [korzyść]. Priorytet: **Must** = rdzeń MVP, **Should** = „jeśli starczy czasu”, **Could** = roadmapa.

### Gość: personalizacja i odkrywanie (bez konta)

| ID | Story | Kryteria akceptacji | Priorytet |
| --- | --- | --- | --- |
| US-01 | Jako Ola przy pierwszym uruchomieniu chcę opowiedzieć aplikacji, co lubię i czego szukam, żeby od razu dostać trafne wydarzenia. | 4 krótkie kroki, każdy na jedno dotknięcie, z możliwością „Pomiń” (całość do ok. 30 s): (1) ulubione rzeczy i zainteresowania, (2) małe czy duże wydarzenia, (3) czego szukam, (4) czego potrzebuję (budżet, odległość, pora). Bez rejestracji. Odpowiedzi zapisują się tylko na urządzeniu. Szczegóły w [SPEC.md](SPEC.md#personalizacja-przy-pierwszym-uruchomieniu). | Must |
| US-02 | Jako Ola chcę później zmienić swoje preferencje, żeby aplikacja nadążała za moimi zainteresowaniami. | Ekran „Moje preferencje” z tymi samymi czterema pytaniami, zmiana od razu przelicza talię. | Should |
| US-03 | Jako Ola chcę przeglądać wydarzenia gestem swipe, żeby szybko odsiać to, co mnie nie interesuje. | Prawo = polubione, lewo = pominięte, przyciski ✕ i ♥ jako alternatywa dla gestu. | Must |
| US-04 | Jako Ola chcę widzieć na karcie, dlaczego ją dostaję, żeby ufać rekomendacjom. | Karta pokazuje uzasadnienie oparte na moich odpowiedziach, np. „Twój match: małe wydarzenia · planszówki · dziś 19:00”. | Must |
| US-05 | Jako Ola chcę mapę bez sklepów i stacji, żeby widzieć tylko wydarzenia i miejsca dla studentów. | Ukryte POI podkładu, widoczne tylko piny aplikacji, podpis OpenStreetMap. | Must |
| US-06 | Jako Ola chcę mieć własną bazę polubionych wydarzeń na urządzeniu, żeby korzystać z aplikacji bez konta. | Polubienia, pominięcia, obserwowani i preferencje są w pamięci przeglądarki, nic nie trafia na serwer. Widok „Moje” pokazuje tylko polubione, a ich piny są wyróżnione na mapie (większe, z obwódką). | Must |
| US-07 | Jako Ola chcę filtrować po dacie, kategorii i cenie, żeby znaleźć coś na dziś i za darmo. | Filtry: dziś / ten tydzień, kategoria, „darmowe”. | Must |
| US-08 | Jako Ola chcę otworzyć kartę wydarzenia, żeby sprawdzić godzinę, adres, cenę, organizatora i skalę wydarzenia. | Karta: grafika, tytuł, kategoria, data, adres, cena, organizator, wielkość (kameralne / średnie / duże), opis. | Must |
| US-09 | Jako Ola chcę kategorie z ikonami i kolorami, żeby rozróżniać je także bez rozpoznawania kolorów. | Każda kategoria ma kolor i ikonę, kolor nie jest jedynym nośnikiem informacji. | Must |
| US-10 | Jako Ola chcę obserwować organizacje i osoby, żeby ich wydarzenia pojawiały się wyżej w talii. | Obserwowanie zapisuje się lokalnie i podnosi wynik rekomendacji. | Should |
| US-11 | Jako Ola chcę otworzyć wydarzenie w Google Maps, żeby dojść na miejsce. | Link z lat/lng, bez klucza API. | Should |
| US-12 | Jako Ola chcę widzieć swoją lokalizację na mapie, żeby wiedzieć, co mam blisko. | Niebieska kropka, lokalizacja nie jest zapisywana na serwerze. | Should |
| US-13 | Jako Ola chcę dodać wydarzenie do kalendarza, żeby o nim nie zapomnieć. | Link do Google Calendar lub plik .ics. | Should |
| US-14 | Jako Ola chcę dostawać powiadomienia o wybranych kategoriach, żeby nic mnie nie ominęło. | Opt-in, limit dzienny, godziny ciszy. | Could |

### Użytkownik z kontem: tworzenie i community

| ID | Story | Kryteria akceptacji | Priorytet |
| --- | --- | --- | --- |
| US-15 | Jako Ola chcę założyć konto i nie stracić swojej lokalnej bazy, żeby korzystać z aplikacji na telefonie i laptopie. | Rejestracja bez haseł (np. link na e-mail), po zalogowaniu preferencje, polubienia i obserwowani przenoszą się na konto. | Should |
| US-16 | Jako Ola chcę dodać własne wydarzenie, np. „planszówki w akademiku, 4/6 osób”, żeby poznać ludzi z okolicy. | Ten sam formularz co u organizacji (z AI autofill), typ „community”, limit miejsc, wyraźne oznaczenie „od studenta”. | Should |
| US-17 | Jako Ola chcę dołączyć do cudzego wydarzenia z limitem miejsc, żeby nie szukać ekipy samodzielnie. | Licznik wolnych miejsc na karcie, zapis do limitu (wymaga konta). | Could |
| US-18 | Jako Ola chcę mieć publiczny profil i obserwujących, żeby budować wokół siebie community. | Profil z imieniem, krótkim opisem i listą moich wydarzeń, przycisk „Obserwuj”. Bez wyświetlania moich polubień innym. | Could |
| US-19 | Jako Ola chcę polecić wydarzenie moim obserwującym, żeby zaprosić ich na to, co mi się podoba. | Przycisk „Poleć” na karcie, polecenie trafia do talii obserwujących z podpisem „Poleca: Ola”. | Could |
| US-20 | Jako Ola chcę zgłosić nieodpowiednie wydarzenie, żeby treści tworzone przez użytkowników były bezpieczne. | Przycisk „Zgłoś”, zgłoszone wydarzenie jest ukrywane do sprawdzenia. | Should |

### Kuba: organizator w imieniu profilu koła

| ID | Story | Kryteria akceptacji | Priorytet |
| --- | --- | --- | --- |
| US-21 | Jako Kuba chcę wkleić tekst posta i dostać wypełniony formularz, żeby dodać wydarzenie w minutę. | AI uzupełnia tytuł, datę, miejsce, cenę, kategorię, wielkość i opis. | Must |
| US-22 | Jako Kuba chcę sprawdzić i poprawić to, co zaproponowała AI, żeby w aplikacji nie było błędów. | Pola do sprawdzenia są podświetlone, wydarzenie publikuje się dopiero po zatwierdzeniu przez człowieka. | Must |
| US-23 | Jako Kuba chcę, żeby moje wydarzenie trafiało do osób zainteresowanych daną tematyką i skalą wydarzenia, żeby sala się zapełniła. | Wydarzenie jest wyżej w talii u osób z pasującymi preferencjami i obserwujących koło. | Must |
| US-24 | Jako Kuba chcę założyć profil koła i zaprosić do niego innych członków, żeby wydarzenia dodawał cały zarząd. | Profil organizacji z nazwą, opisem, logo i listą członków (role: administrator, redaktor). Na MVP profile demo z danych seed, jeden administrator. | Should |
| US-25 | Jako Kuba chcę przekazać profil koła następnemu zarządowi, żeby obserwujący i historia nie przepadły przy zmianie osób. | Dodanie nowego administratora, usunięcie poprzedniego, obserwujący zostają przy profilu. | Could |
| US-26 | Jako Kuba chcę, żeby moje koło było oznaczone jako zweryfikowane, żeby studenci mi ufali. | Znaczek „zweryfikowane” (na demo mock, docelowo mail uczelniany). | Should |
| US-27 | Jako Kuba chcę widzieć statystyki swipe'owania moich wydarzeń, czyli ile razy zostały polubione (swipe w prawo), a ile odrzucone (swipe w lewo), żeby ocenić, czy temat i opis trafiają do studentów. | Dla każdego wydarzenia widać liczbę polubień i odrzuceń oraz ich proporcję, dane są zbiorcze i anonimowe. Statystyki widzą członkowie organizacji. | Should |

### Pan Marek i Pani Anna: instytucje

| ID | Story | Kryteria akceptacji | Priorytet |
| --- | --- | --- | --- |
| US-28 | Jako Pan Marek chcę mieć profil biblioteki z pracownikami, którzy dodają wydarzenia (spotkania, warsztaty, wystawy), żeby dotrzeć do studentów bez budżetu na reklamę. | Profil instytucji ze znaczkiem „zweryfikowane”, ten sam formularz z AI autofill, wydarzenia widoczne na mapie i w talii. | Should |
| US-29 | Jako Pan Marek chcę pokazać studentom godziny otwarcia czytelni i miejsc do nauki, żeby częściej z nich korzystali. | Warstwa „miejsca dla studenta” oparta na Otwartych Danych Krakowa i OSM. | Could |
| US-30 | Jako Pan Marek chcę wyróżnić ważne wydarzenie (np. noc bibliotek), żeby zwiększyć jego zasięg. | Oznaczenie „Promowane”, ranking organiczny pozostaje bez zmian. | Could |
| US-31 | Jako Pani Anna chcę promować dzień otwarty wśród studentów, żeby uniknąć drogiej reklamy zewnętrznej. | Wydarzenie uczelni z oznaczeniem organizatora, możliwość promowania. | Could |
| US-32 | Jako Pani Anna chcę nadawać członkom zespołu role w profilu uczelni, żeby redaktorzy dodawali wydarzenia, a ja je zatwierdzałam. | Role: administrator, redaktor; redaktor może przygotować wydarzenie, administrator publikuje. | Could |
| US-33 | Jako Pani Anna chcę zobaczyć statystyki wydarzenia, żeby ocenić zwrot z promocji. | Liczba polubień, odrzuceń i wyświetleń wydarzenia. | Could |

## Użycie w prezentacji

| Slajd w PITCH.md | Co pokazać |
| --- | --- |
| 2. Problem | Rozproszone źródła, które widzi Ola i Kuba. |
| 3. Persona Ola | Karta persony Ola i jej pierwszy tydzień: personalizacja → swipe → mapa → karta wydarzenia → założenie konta (US-01…US-09, US-15). |
| 4. Rozwiązanie | Trzy poziomy dostępu: gość, użytkownik, organizacja. |
| 6. Rola AI | Kuba wkleja post, AI wypełnia, człowiek zatwierdza (US-21, US-22). |
| 9. Model biznesowy | Profile organizacji (Pan Marek, Pani Anna) jako strona, która płaci, koło zamachowe (US-28…US-33). |

**Kolejność w demo:** US-01 (personalizacja) → US-03 → US-06 → US-08, a potem US-21 jako druga strona rynku (Kuba w imieniu profilu koła).
