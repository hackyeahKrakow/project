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

GoJammin i Karnet Kraków Culture pokazują duże wydarzenia dla wszystkich mieszkańców. My skupiamy się na studentach, wydarzenia dodają sami organizatorzy, a studenci mogą tworzyć oddolne mikro-wydarzenia (np. „planszówki w akademiku, pokój 312”). Szczegóły w [RESEARCH.md](RESEARCH.md).

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
- Każda karta pokazuje, dlaczego ją widzisz, np. „Bo lubisz: planszówki · dziś 19:00”.

### Dodawanie wydarzeń z AI autofill

- Organizator wkleja tekst ze swojego posta, a LLM wypełnia formularz (tytuł, data, miejsce, cena, kategoria, opis).
- Organizator poprawia i zatwierdza. AI tylko proponuje, a człowiek zatwierdza każde wydarzenie.

## Ścieżka użytkownika (Ola)

1. Otwiera aplikację, wybiera uczelnię i 3–5 zainteresowań (onboarding do 30 sekund, bez rejestracji).
2. Dostaje talię 10 kart i swipe'uje. Po kilku ruchach karty zaczynają się dopasowywać.
3. Przechodzi do mapy i widzi wyróżnione polubione wydarzenia.
4. Otwiera kartę quizu w barze planszówkowym i sprawdza adres oraz godzinę.
5. Obserwuje koło naukowe, więc jego wydarzenia są wyżej w talii.
6. W piątek sama dodaje mikro-wydarzenie „planszówki w akademiku, 4/6 osób”, a inni mogą dołączyć.

## Zakres MVP (24h)

| Funkcja | Status na demo | Uwagi |
| --- | --- | --- |
| Mapa z kolorowymi znacznikami kategorii i filtrami | Budujemy | Rdzeń |
| Karta wydarzenia: grafika, opis, data, adres | Budujemy | Rdzeń |
| Swipe + wyróżnienie polubionych na mapie | Budujemy | Rdzeń |
| Rekomendacje (scoring) | Budujemy | Prosta, wyjaśnialna formuła |
| Formularz dodawania z AI autofill | Budujemy | Główna rola AI |
| Mikro-wydarzenia z limitem miejsc | Jeśli starczy czasu | Ten sam formularz, typ „grassroots” |
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
- Kolor nigdy nie jest jedynym nośnikiem informacji (kategorie mają też ikony).

## Roadmapa po hackathonie

- Powiadomienia opt-in dla wybranych kategorii i organizacji, z limitem dziennym i godzinami ciszy.
- Znajomi, zaproszenia, grupy.
- Warstwa „miejsca dla studenta”: biblioteki i czytelnie otwarte teraz, miejsca do nauki (Otwarte Dane Krakowa, OSM).
- Studenckie oceny miejsc (zniżki, ceny, gniazdka, Wi-Fi).
- Rekomendacje na podstawie podobnych użytkowników.
- Kolejne miasta akademickie.
