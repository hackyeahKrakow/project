# Persony i user stories

Materiał do prezentacji (slajd 3 w [PITCH.md](PITCH.md)) i do backlogu. Zakres i priorytety są zgodne z [SPEC.md](SPEC.md).

> Persony są fikcyjne. Opierają się na problemie z [RESEARCH.md](RESEARCH.md), a nie na wynikach ankiety. Gdy P5 uzupełni ankietę, podmieńcie cytaty na prawdziwe.

## Persony

### 1. Ola, 19 lat, 1. rok na AGH (persona główna, demo)

| | |
| --- | --- |
| **Sytuacja** | Przyjechała z mniejszego miasta, nikogo nie zna w Krakowie, mieszka w akademiku. |
| **Cel** | Poznać ludzi i znaleźć coś do roboty po zajęciach, najlepiej za darmo lub tanio. |
| **Frustracje** | Wydarzenia są na stronach wydziałów, w grupach na Facebooku i na Instagramach kół. Nie wie, gdzie szukać, więc nie wychodzi. |
| **Zachowanie** | Telefon w ręku cały dzień, nie chce zakładać kolejnego konta, rzuca aplikację, jeśli start trwa dłużej niż chwilę. |
| **Czego oczekuje** | Start bez rejestracji, propozycje „na dziś”, czytelna mapa, żeby wiedzieć, jak dojść. |
| **Cytat (do zastąpienia z ankiety)** | „Wiem, że coś się dzieje, ale nie wiem gdzie.” |

### 2. Kuba, 21 lat, 3. rok na UJ, przewodniczący koła naukowego (organizator)

| | |
| --- | --- |
| **Sytuacja** | Organizuje wykłady, warsztaty i wyjazdy koła, promuje je postami na Instagramie i w grupach. |
| **Cel** | Zapełnić salę i zwerbować pierwszaków do koła. |
| **Frustracje** | Posty toną w feedzie, dotarcie do nowych osób wymaga ręcznego rozsyłania, a dodanie wydarzenia w wielu miejscach zabiera czas. |
| **Czego oczekuje** | Dodać wydarzenie w minutę, najlepiej wklejając gotowy tekst posta, i trafić do osób, które lubią taką tematykę. |

### 3. Pan Marek, 52 lata, dyrektor miejskiej biblioteki (instytucja publiczna)

| | |
| --- | --- |
| **Sytuacja** | Zarządza biblioteką z czytelnią i salą na wydarzenia (spotkania autorskie, warsztaty, wystawy, noce bibliotek). Podobną rolę ma dyrektor muzeum czy domu kultury. |
| **Cel** | Pokazać studentom, że biblioteka to nie tylko wypożyczalnia, i zapełnić wydarzenia oraz czytelnię, zwłaszcza w sesji. |
| **Frustracje** | Młodzi ludzie nie śledzą kanałów instytucji, budżet na promocję jest minimalny, a oferta (czytelnie, wystawy, wstęp wolny) nie jest widoczna tam, gdzie studenci szukają zajęć po wykładach. |
| **Czego oczekuje** | Darmowo dodawać wydarzenia i być widocznym na mapie obok wydarzeń studenckich, z oznaczeniem zweryfikowanej instytucji. Dobrze byłoby w przyszłości pokazać godziny otwarcia czytelni. |

### 4. Pani Anna, 42 lata, biuro promocji uczelni (instytucja)

| | |
| --- | --- |
| **Sytuacja** | Odpowiada za dni otwarte, konferencje i wydarzenia wydziałowe. |
| **Cel** | Dotrzeć do studentów i kandydatów w ramach ograniczonego budżetu. |
| **Frustracje** | Płatne formy dotarcia, jak reklama w komunikacji miejskiej, są drogie i trudno zmierzyć ich efekt. |
| **Czego oczekuje** | Tańszy i bardziej precyzyjny kanał do studentów oraz informacji, ile osób zainteresował wydarzenie. |

## User stories

Format: **Jako** [rola] **chcę** [cel], **żeby** [korzyść]. Priorytet: **Must** = rdzeń MVP, **Should** = „jeśli starczy czasu”, **Could** = roadmapa.

Wydarzenia mogą dodawać tylko organizacje studenckie (np. koła naukowe, samorządy) i instytucje publiczne (np. biblioteki, muzea, uczelnie). Studenci-użytkownicy przeglądają, swipe’ują i obserwują, ale nie tworzą wydarzeń.

### Ola: odkrywanie i mapa

| ID | Story | Kryteria akceptacji | Priorytet |
| --- | --- | --- | --- |
| US-01 | Jako Ola chcę wybrać 3–5 zainteresowań bez zakładania konta, żeby od razu zobaczyć trafne wydarzenia. | Onboarding trwa do 30 s, brak rejestracji i brak wyboru uczelni, po zatwierdzeniu widać talię kart. | Must |
| US-02 | Jako Ola chcę przeglądać wydarzenia gestem swipe, żeby szybko odsiać to, co mnie nie interesuje. | Prawo = polubione, lewo = pominięte, przyciski ✕ i ♥ jako alternatywa dla gestu. | Must |
| US-03 | Jako Ola chcę widzieć na karcie, dlaczego ją dostaję, żeby ufać rekomendacjom. | Karta pokazuje uzasadnienie, np. „Twój match: planszówki · dziś 19:00”. | Must |
| US-04 | Jako Ola chcę mapę bez sklepów i stacji, żeby widzieć tylko wydarzenia i miejsca dla studentów. | Ukryte POI podkładu, widoczne tylko piny aplikacji, podpis OpenStreetMap. | Must |
| US-05 | Jako Ola chcę, żeby polubione wydarzenia były wyróżnione na mapie, żeby od razu widzieć, co jest blisko. | Polubiony pin jest większy, z obwódką, a widok „Moje” pokazuje tylko takie wydarzenia. | Must |
| US-06 | Jako Ola chcę filtrować po dacie, kategorii i cenie, żeby znaleźć coś na dziś i za darmo. | Filtry: dziś / ten tydzień, kategoria, „darmowe”. | Must |
| US-07 | Jako Ola chcę otworzyć kartę wydarzenia, żeby sprawdzić godzinę, adres, cenę i organizatora. | Karta: grafika, tytuł, kategoria, data, adres, cena, organizator, opis. | Must |
| US-08 | Jako Ola chcę kategorie z ikonami i kolorami, żeby rozróżniać je także bez rozpoznawania kolorów. | Każda kategoria ma kolor i ikonę, kolor nie jest jedynym nośnikiem informacji. | Must |
| US-09 | Jako Ola chcę otworzyć wydarzenie w Google Maps, żeby dojść na miejsce. | Link z lat/lng, bez klucza API. | Should |
| US-10 | Jako Ola chcę widzieć swoją lokalizację na mapie, żeby wiedzieć, co mam blisko. | Niebieska kropka, lokalizacja nie jest zapisywana na serwerze. | Should |
| US-11 | Jako Ola chcę dodać wydarzenie do kalendarza, żeby o nim nie zapomnieć. | Link do Google Calendar lub plik .ics. | Should |
| US-12 | Jako Ola chcę obserwować organizację, żeby jej wydarzenia pojawiały się wyżej w talii. | Obserwowanie podnosi wynik rekomendacji. | Should |
| US-13 | Jako Ola chcę dostawać powiadomienia o wybranych kategoriach, żeby nic mnie nie ominęło. | Opt-in, limit dzienny, godziny ciszy. | Could |

### Kuba: organizator

| ID | Story | Kryteria akceptacji | Priorytet |
| --- | --- | --- | --- |
| US-14 | Jako Kuba chcę wkleić tekst posta i dostać wypełniony formularz, żeby dodać wydarzenie w minutę. | AI uzupełnia tytuł, datę, miejsce, cenę, kategorię i opis. | Must |
| US-15 | Jako Kuba chcę sprawdzić i poprawić to, co zaproponowała AI, żeby w aplikacji nie było błędów. | Pola do sprawdzenia są podświetlone, wydarzenie publikuje się dopiero po zatwierdzeniu przez człowieka. | Must |
| US-16 | Jako Kuba chcę, żeby moje koło było oznaczone jako zweryfikowane, żeby studenci mi ufali. | Znaczek „zweryfikowane” (na demo mock, docelowo mail uczelniany). | Should |
| US-17 | Jako Kuba chcę, żeby moje wydarzenie trafiało do osób zainteresowanych daną tematyką, żeby sala się zapełniła. | Wydarzenie jest wyżej w talii u osób lubiących kategorię i obserwujących koło. | Must |
| US-18 | Jako Kuba chcę widzieć statystyki swipe’owania moich wydarzeń, czyli ile razy zostały polubione (swipe w prawo), a ile odrzucone (swipe w lewo), żeby ocenić, czy temat i opis trafiają do studentów. | Dla każdego wydarzenia widać liczbę polubień i odrzuceń oraz ich proporcję, dane są zbiorcze i anonimowe. | Should |

### Pan Marek i Pani Anna: instytucje

| ID | Story | Kryteria akceptacji | Priorytet |
| --- | --- | --- | --- |
| US-19 | Jako Pan Marek chcę dodawać wydarzenia biblioteki (spotkania, warsztaty, wystawy), żeby dotrzeć do studentów bez budżetu na reklamę. | Konto instytucji z znaczkiem „zweryfikowane”, ten sam formularz z AI autofill, wydarzenia widoczne na mapie i w talii. | Should |
| US-20 | Jako Pan Marek chcę pokazać studentom godziny otwarcia czytelni i miejsc do nauki, żeby częściej z nich korzystali. | Warstwa „miejsca dla studenta” oparta na Otwartych Danych Krakowa i OSM. | Could |
| US-21 | Jako Pan Marek chcę wyróżnić ważne wydarzenie (np. noc bibliotek), żeby zwiększyć jego zasięg. | Oznaczenie „Promowane”, ranking organiczny pozostaje bez zmian. | Could |
| US-22 | Jako Pani Anna chcę promować dzień otwarty wśród studentów, żeby uniknąć drogiej reklamy zewnętrznej. | Wydarzenie uczelni z oznaczeniem organizatora, możliwość promowania. | Could |
| US-23 | Jako Pani Anna chcę zobaczyć statystyki wydarzenia, żeby ocenić zwrot z promocji. | Liczba polubień i wyświetleń wydarzenia. | Could |

## Użycie w prezentacji

| Slajd w PITCH.md | Co pokazać |
| --- | --- |
| 2. Problem | Rozproszone źródła, które widzi Ola i Kuba. |
| 3. Persona Ola | Karta persony Ola i jej pierwszy tydzień: onboarding → swipe → mapa → karta wydarzenia (US-01…US-08). |
| 6. Rola AI | Kuba wkleja post, AI wypełnia, człowiek zatwierdza (US-14, US-15). |
| 9. Model biznesowy | Pan Marek i Pani Anna jako instytucje, które chcą dotrzeć do studentów, koło zamachowe (US-19…US-23). |

**Kolejność w demo:** pokaż US-01 → US-02 → US-05 → US-07, a potem US-14 jako druga strona rynku.
