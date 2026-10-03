# Specyfikacja produktu

> Ten plik jest wejściem dla `/speckit-specify`. Kolejne funkcje specyfikujcie osobno, odwołując się do sekcji poniżej.

## Rozwiązanie w jednym zdaniu

Aplikacja webowa (PWA) dla studentów w Krakowie: mapa pokazująca wyłącznie wydarzenia i miejsca dla studentów oraz „swipe” jak w Tinderze, który uczy się, co cię interesuje, i wyróżnia to na twojej mapie.

## Problem

Informacje o wydarzeniach studenckich są rozproszone po stronach wydziałów, grupach na Facebooku i Instagramach kół. Nowy student nie wie, co się dzieje i gdzie. Organizatorzy (koła, samorządy, uczelnie) nie docierają do ludzi, a uczelnie płacą nawet za reklamy w tramwajach.

## Grupa docelowa

Studenci krakowskich uczelni: ok. 152 tys. osób w uczelniach z siedzibą w Małopolsce (GUS, stan na 31.12.2024).

**Persona na demo:** Ola, 1. rok na AGH, nikogo nie zna w Krakowie.

## Dlaczego Smart City

Rozwiązanie poprawia komunikację między instytucjami (uczelnie, koła) a mieszkańcami i pomaga lepiej wykorzystywać zasoby miasta: wydarzenia, miejsca, przestrzenie publiczne.

## Czym różnimy się od konkurencji

GoJammin i Karnet Kraków Culture pokazują duże wydarzenia dla wszystkich mieszkańców. My skupiamy się na studentach, wydarzenia dodają sami organizatorzy (profile kół, uczelni i instytucji), a zarejestrowani studenci mogą tworzyć oddolne mikro-wydarzenia (np. „planszówki w akademiku, pokój 312”). Aplikacja uczy się preferencji od pierwszego uruchomienia, w tym czy wolisz małe czy duże wydarzenia. Szczegóły w [RESEARCH.md](RESEARCH.md).

## Główne funkcje

### Mapa (rdzeń)

- Czysta mapa bez sklepów, stacji i innych POI. Widać tylko wydarzenia i miejsca, w których się odbywają.
- Znaczniki kolorowane według kategorii, każda kategoria ma też ikonę, żeby nie polegać tylko na kolorze ([DESIGN.md](DESIGN.md)).
- Filtry: dziś / ten tydzień, kategoria, „darmowe”.
- Kliknięcie znacznika otwiera kartę wydarzenia: grafika, tytuł, organizator, data i godzina, adres, cena, opis.
- Wydarzenia polubione swipe'em w prawo są na mapie wyróżnione, a widok „Moja mapa” pokazuje tylko je.

### Swipe (Tinder dla wydarzeń)

- Talia kart z wydarzeniami z najbliższych dni, posortowana przez rekomendacje.
- W prawo = interesuje mnie: wydarzenie trafia na „Moją mapę” i jest wyróżnione na mapie.
- W lewo = nie interesuje: znika z talii, a algorytm obniża wagę tej kategorii.
- Każda karta pokazuje, dlaczego ją widzisz, np. „Twój match: małe wydarzenia · planszówki · dziś 19:00”.
- Przeglądanie nie wymaga konta, maila ani numeru telefonu. Decyzje swipe zapisują się pod losowym identyfikatorem użytkownika, bez danych osobowych, a lokalizacja nie jest zapisywana na serwerze.

### Personalizacja przy pierwszym uruchomieniu

Przy pierwszym wejściu aplikacja nie pokazuje pustej mapy, tylko zadaje cztery krótkie pytania. Każde to jedno dotknięcie, każde można pominąć, a całość ma zająć ok. 30 s. Pasek postępu „1/4”, przycisk „Pomiń” i „Wstecz” na każdym kroku.

| Krok | Pytanie | Odpowiedzi | Wpływ na rekomendacje |
| --- | --- | --- | --- |
| 1. Ulubione rzeczy | „Co lubisz robić?” | 3–5 kategorii z ikonami (nauka, sport, muzyka, gry, imprezy, kultura, warsztaty). Opcjonalnie podtagi, np. gry → planszówki, RPG, e-sport | Startowa waga kategorii: wybrane 0.7, reszta 0.3 |
| 2. Skala | „Jakie wydarzenia wolisz?” | Kameralne (do ok. 30 osób), średnie (30–100), duże (100+), bez różnicy. Można wybrać kilka | Dopasowanie do wielkości wydarzenia |
| 3. Czego szukasz | „Czego dziś szukasz?” | Do 3 z: poznać ludzi, nauczyć się czegoś, dobrze się bawić, ruszyć się, kultura i spokój, oszczędzić | Dodatkowa waga kategorii i typów wydarzeń powiązanych z celem |
| 4. Czego potrzebujesz | „Co jest dla ciebie ważne?” | Budżet (tylko darmowe / do 20 zł / bez limitu), odległość (1 km / 3 km / 5 km / cały Kraków), pora (po zajęciach / wieczory / weekendy) | Twarde filtry domyślne (budżet, pora) i parametr bliskości |

- Odpowiedzi z onboardingu zapisują się lokalnie i służą do personalizacji rekomendacji; backend operuje na danych pseudonimowych (UUID, bez maila i numeru telefonu).
- Po ostatnim kroku użytkownik od razu dostaje pierwszą talię, a każda karta tłumaczy dopasowanie („Twój match: kameralne · planszówki · za darmo”).
- Preferencje można zmienić w ekranie „Moje preferencje”, a swipe'y dalej je dostrajają.
- Brak odpowiedzi nie blokuje aplikacji: bez personalizacji talia jest posortowana po czasie i bliskości.
- Szczegóły scoringu w [ARCHITECTURE.md](ARCHITECTURE.md#rekomendacje), ekran w [DESIGN.md](DESIGN.md#ekrany-mobile-390-px).

### Dodawanie wydarzeń z AI autofill

- Organizator (członek profilu organizacji z wykupionym pakietem sponsorskim) wkleja tekst ze swojego posta, a LLM wypełnia formularz (tytuł, data, miejsce, cena, kategoria, wielkość, opis).
- Autor poprawia i zatwierdza. AI tylko proponuje, a człowiek zatwierdza każde wydarzenie.
- Zarejestrowany student dodaje wydarzenie tym samym formularzem, ale ręcznie, bez AI. Decyzja zespołu z 3.10: AI jest w płatnych pakietach dla organizacji ([USER_FLOW.md](USER_FLOW.md#5-model-biznesowy-pakiety-dla-organizacji)).

## Konta i organizacje

Trzy poziomy dostępu, od najmniej do najbardziej zobowiązującego:

| Poziom | Co może | Gdzie są dane |
| --- | --- | --- |
| **Gość** | Przeglądać, swipe'ować, obserwować, filtrować, personalizować, budować własną bazę wydarzeń | Tylko na urządzeniu |
| **Użytkownik** | Wszystko co gość oraz: tworzyć wydarzenia (typ „community”, oznaczone „od studenta”), mieć publiczny profil, być obserwowanym, budować community, polecać wydarzenia obserwującym, synchronizować dane między urządzeniami | Na serwerze, lokalna baza gościa przenosi się przy zakładaniu konta |
| **Organizacja** | Publikować wydarzenia „oficjalne” ze znaczkiem zweryfikowanej organizacji, mieć obserwujących, statystyki swipe'ów, promowanie | Profil firmowy na serwerze, w imieniu organizacji działają podpięci użytkownicy |

### Decyzja: profile organizacji

**Rekomendacja: iść w tym kierunku**, ale w MVP w najprostszej postaci. Konto osoby i profil organizacji to dwa osobne byty, a użytkownicy są do organizacji podpinani jako członkowie z rolą.

Dlaczego to ma sens:
- **Ciągłość.** Koło naukowe zmienia zarząd co roku. Obserwujący, historia wydarzeń i znaczek „zweryfikowane” należą do profilu, a nie do osoby, więc nie znikają razem z przewodniczącym.
- **Zaufanie.** Weryfikujemy raz organizację (mail uczelniany, dane instytucji), a nie każdego jej członka. Student widzi różnicę między „Koło Naukowe X (zweryfikowane)” a wydarzeniem od innego studenta.
- **Model biznesowy.** Płacącym klientem jest organizacja (uczelnia, biblioteka, muzeum), a nie pracownik. Statystyki, promowanie i faktury należą do profilu.
- **Zespoły.** Biblioteka czy biuro promocji uczelni mają kilka osób, które dodają wydarzenia, i potrzebują ról (administrator, redaktor).
- **Czytelne rozdzielenie treści.** Oficjalne wydarzenia organizacji i oddolne wydarzenia użytkowników mają inne oznaczenia, co ogranicza ryzyko nadużyć.

Ryzyka i jak je ograniczamy:
- **Złożoność.** Członkostwa, zaproszenia i role to dużo pracy przy 24 h. Na MVP: profile organizacji tylko z danych seed, jeden administrator, weryfikacja jako mock. Zaproszenia i role po hackathonie.
- **Moderacja treści użytkowników.** Wydarzenia „community” wymagają zgłaszania i ukrywania. Na MVP: przycisk „Zgłoś”, ukrycie do sprawdzenia przez zespół.
- **Tarcie przy rejestracji.** Dlatego gość korzysta z całego rdzenia bez konta, a konto jest potrzebne dopiero do tworzenia i community.

Alternatywa odrzucona: tylko konta osobiste z etykietą „organizator”. Prostsza, ale organizacja nie przeżywa zmiany osób i nie ma jednego miejsca na weryfikację, obserwujących ani rozliczenia.

Uwaga: ta decyzja przywraca możliwość tworzenia wydarzeń przez zarejestrowanych studentów (mikro-wydarzenia), którą wcześniej ograniczono tylko do organizacji.

## Ścieżka użytkownika

Ścieżka demo, konta demo i model biznesowy: [USER_FLOW.md](USER_FLOW.md).

## Zakres MVP (24h)

| Funkcja | Status na demo | Uwagi |
| --- | --- | --- |
| Mapa z kolorowymi znacznikami kategorii i filtrami | Budujemy | Rdzeń |
| Karta wydarzenia: grafika, opis, data, adres | Budujemy | Rdzeń |
| Swipe + wyróżnienie polubionych na mapie | Budujemy | Rdzeń |
| Personalizacja przy pierwszym uruchomieniu (4 pytania) | Budujemy | Rdzeń, zapis lokalny |
| Lokalna baza wydarzeń gościa (polubienia, obserwowani) | Budujemy | Pamięć przeglądarki, bez konta |
| Rekomendacje (scoring) | Budujemy | Prosta, wyjaśnialna formuła, uwzględnia odpowiedzi z personalizacji |
| Formularz dodawania z AI autofill | Budujemy | Główna rola AI, na demo w imieniu profilu organizacji |
| Profile organizacji (dane seed, jeden administrator) | Budujemy | Znaczek „zweryfikowane”, obserwujący |
| Statystyki swipe'ów dla organizatora | Jeśli starczy czasu | Liczniki polubień i odrzuceń |
| Konto użytkownika (link na e-mail) i przeniesienie lokalnej bazy | Jeśli starczy czasu | Warunek dla tworzenia wydarzeń |
| Mikro-wydarzenia z limitem miejsc (tylko z kontem) | Jeśli starczy czasu | Ten sam formularz bez AI, typ „grassroots”, wymaga zgłaszania nadużyć |
| Zaproszenia członków i role w organizacji | Roadmapa | Tylko slajd |
| Publiczny profil, obserwujący, polecanie wydarzeń | Roadmapa | Community użytkowników, tylko slajd |
| Link „Pokaż w Google Maps” | Jeśli starczy czasu | Zwykły URL z lat/lng, bez API i klucza |
| Lokalizacja użytkownika (niebieska kropka) | Jeśli starczy czasu | GeolocateControl w MapLibre, bez backendu |
| „Dodaj do kalendarza” | Jeśli starczy czasu | URL szablonu Google Calendar lub plik .ics |
| Obserwowanie organizacji | Jeśli starczy czasu | Tabela follows |
| Weryfikacja koła mailem uczelnianym | Mock | Znaczek na danych demo |
| Powiadomienia push | Roadmapa | Odrzucone: serwer wysyłający i niska zgoda użytkowników |
| Znajomi, zaproszenia, czat | Roadmapa | Tylko slajd |
| Oceny miejsc, miejsca do nauki | Roadmapa | Tylko slajd |
| Płatne promowanie | Roadmapa | Model biznesowy na slajdzie |

**Zasada:** 3 godziny przed końcem zamrażamy funkcje, potem tylko poprawki błędów, demo i wysyłka. Opcje „jeśli starczy czasu” robimy dopiero przy działającym rdzeniu, w kolejności: link Google Maps, lokalizacja, kalendarz.

## Dane

Wydarzenia dodają ich właściciele, a my bierzemy tylko dane otwarte. Nie scrapujemy. Na demo: 30–50 wydarzeń wpisanych ręcznie, fikcyjni organizatorzy oznaczeni „(demo)”. Szczegóły w [LEGAL.md](LEGAL.md).

## Wymagania niefunkcjonalne

- Mobile-first, działa w przeglądarce telefonu (szerokość 390 px) i na desktopie.
- Interfejs po polsku, daty w strefie Europe/Warsaw.
- Lokalizacja użytkownika nie jest zapisywana na serwerze.
- Dane gościa (preferencje, polubienia, obserwowani) zostają na jego urządzeniu do czasu założenia konta.
- Personalizacja jest opcjonalna i do pominięcia, a aplikacja działa także bez żadnej odpowiedzi.
- Kolor nigdy nie jest jedynym nośnikiem informacji (kategorie mają też ikony).

## Roadmapa po hackathonie

- Powiadomienia opt-in dla wybranych kategorii i organizacji, z limitem dziennym i godzinami ciszy.
- Znajomi, zaproszenia, grupy.
- Community użytkowników: publiczne profile, obserwujący, polecanie wydarzeń obserwującym.
- Członkowie i role w organizacjach (administrator, redaktor), przekazywanie profilu następnemu zarządowi.
- Warstwa „miejsca dla studenta”: biblioteki i czytelnie otwarte teraz, miejsca do nauki (Otwarte Dane Krakowa, OSM).
- Studenckie oceny miejsc (zniżki, ceny, gniazdka, Wi-Fi).
- Rekomendacje na podstawie podobnych użytkowników.
- Kolejne miasta akademickie.
