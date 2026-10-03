# Zgłoszenie na Challenge Rocket (draft)

Wersja robocza formularza „Add Project”. Pola **[PÓŹNIEJ]** uzupełniamy pod koniec. Stan na 3.10.2026, ok. 17:30. Ścieżka użytkownika i demo: [USER_FLOW.md](USER_FLOW.md).

---

## Project Name

**spotted student — zmatchuj się z eventami**

W polu nazwy wpisujemy „spotted student”, a motto dajemy jako pierwsze zdanie w Solution i na okładce.

Jak to sprzedać: każdy student w Polsce zna fanpage'e „Spotted: [uczelnia]”, więc nazwa od razu brzmi swojsko. Zamiast anonimowych wpisów pokazujemy wydarzenia na mapie, a motto mówi wprost, jak to działa: swipe i dopasowanie.

Do pilnowania:
- **Domeny:** `spottedstudent.app` (14 USD) i `spottedstudent.com` (ok. 11 USD) są wolne, a `spottedstudent.pl` jest zajęta. Kupujemy `.app` albo `.com` od razu.
- **Kolizje:** „spotted” to słowo pospolite, a Spotted.de to aplikacja randkowa w UE. Dlatego zawsze piszemy pełną nazwę „spotted student”, nigdy samo „spotted”. Po hackathonie sprawdzamy znak w [TMview](https://www.tmdn.org/tmview/) w klasach 9, 41 i 42.

## Problem

W Polsce studiuje **1,28 mln osób na 352 uczelniach** (GUS, rok akademicki 2024/25). Co roku setki tysięcy z nich zaczynają życie w nowym mieście, bez znajomych i bez mapy tego, co się wokół dzieje.

**Samotność to realny problem, nie hasło.** Studenci najczęściej ze wszystkich grup zawodowych odczuwają samotność: 17% bardzo często albo zawsze, wobec 8% wszystkich dorosłych (CBOS 2024). W całym pokoleniu Z samotność regularnie odczuwa 65% osób w wieku 13–28 lat. Badania z uczelni pokazują, że udział w aktywnościach poza zajęciami wzmacnia poczucie przynależności, a to przekłada się na lepsze wyniki i mniejsze ryzyko rzucenia studiów po pierwszym roku.

**Wydarzeń nie brakuje. Brakuje sposobu, żeby do nich dotrzeć.**
- Informacje są rozproszone po stronach wydziałów, grupach i fanpage'ach „Spotted”, Instagramach kół naukowych i plakatach na korytarzach. Nie ma jednego miejsca, w którym student zobaczy, co dzieje się dziś wokół niego.
- Grupy z wydarzeniami żyją głównie na Facebooku, a pokolenie Z z niego odchodzi do TikToka, Instagrama i YouTube'a. 41% osób z pokolenia Z szuka informacji najpierw w mediach społecznościowych, a nie w wyszukiwarce (Sprout Social 2025). Algorytmy tych platform nie wiedzą jednak, że dziś o 19:00 koło robotyki ma spotkanie otwarte 300 metrów od akademika.
- Organizatorzy (koła, samorządy, lokale, uczelnie) nie docierają do odbiorców. Uczelnie płacą za reklamy w komunikacji miejskiej, a koło naukowe ma tylko własny fanpage.
- Agregatory wydarzeń, takie jak GoJammin czy miejskie kalendarze kultury, pokazują duże wydarzenia dla wszystkich mieszkańców. Nie ma w nich spotkania otwartego koła ani „planszówek w akademiku, pokój 312”.

## Solution

***Zmatchuj się z eventami.*** spotted student działa jak aplikacja randkowa, tylko zamiast ludzi dopasowuje studentom wydarzenia. Trzy swipe'y wystarczą, żeby aplikacja wiedziała, co cię kręci. Po minucie masz własną mapę miasta z wydarzeniami dla siebie.

### 1. Swipe: decyzja w sekundę

Wydarzenia są kartami: grafika, tytuł, godzina, odległość, cena. **W prawo** znaczy „wchodzę”, i wydarzenie trafia na twoją mapę. **W lewo** znaczy „nie dla mnie”. Zamiast przewijać listę stu wydarzeń, podejmujesz jedną decyzję naraz. Ten gest zna każdy, więc aplikacji nie trzeba tłumaczyć. Każdy ruch to też sygnał, z którego aplikacja się uczy.

### 2. Profil zainteresowań, który rośnie z każdym ruchem

- **Start w 30 sekund, bez konta.** „Tylko przeglądam” i kilka szybkich pytań: zainteresowania, czego szukasz (ludzi, rozwoju, kultury), kameralne czy duże wydarzenia, twoja dzielnica i jak daleko dojedziesz. Z tego powstaje profil startowy, więc pierwsze karty już do ciebie pasują.
- **Profil uczy się z zachowania, nie z ankiet.** Swipe w prawo podnosi wagę kategorii, swipe w lewo lekko ją obniża. Kara jest celowo mniejsza niż nagroda, więc jedno „nie” nie skreśla całej kategorii.
- **Dopasowanie łączy cztery sygnały:** twoje zainteresowania, odległość od ciebie, termin (dziś przed „za tydzień”) i organizatorów, których obserwujesz.
- **Żadnej czarnej skrzynki.** Każda karta mówi, dlaczego ją widzisz: „Bo lubisz: planszówki · 600 m od ciebie · dziś 19:00”. Użytkownik rozumie rekomendację i ma nad nią kontrolę, w duchu wymogów przejrzystości systemów rekomendacyjnych z unijnego DSA.
- **Prywatność od projektu.** Przeglądanie nie wymaga konta, maila ani numeru telefonu. Profil i lokalizacja zostają na twoim telefonie: wyczyścisz przeglądarkę, to zaczynasz od zera. Mówimy to wprost przed pierwszym swipe'em, a zgoda to wyraźny przycisk, nie domyślny gest.

71% konsumentów oczekuje personalizacji, a 76% irytuje się, gdy jej nie dostaje (McKinsey). Studenci nie są wyjątkiem, tylko dziś nikt tego nie robi dla wydarzeń studenckich.

### 3. Twoja mapa miasta

Polubione wydarzenia świecą na czystej mapie, bez sklepów, stacji i reklam. Kategorie mają kolor i ikonę, więc informacja nie opiera się tylko na kolorze. Jednym spojrzeniem widzisz, co masz dziś wieczorem w okolicy, a jednym kliknięciem otwierasz adres, godzinę i opis.

### 4. Twój kalendarz

Polubione wydarzenia układają się w agendę z widokiem tygodnia i miesiąca. Jednym kliknięciem eksportujesz je do swojego kalendarza (Google, Apple, Outlook) przez plik `.ics`.

### 5. Jev: asystent AI, który tworzy wydarzenie za organizatora

Kto chce tworzyć wydarzenia, zakłada konto: studenta albo organizacji (koło, samorząd, lokal, uczelnia). Student dodaje wydarzenie prostym formularzem. Organizacja dostaje Jeva, bo dodanie wydarzenia nie może być trudniejsze niż wrzucenie posta:
- **Wklejasz tekst posta albo piszesz jedno zdanie,** np. „Koło Robotyki AGH zaprasza na spotkanie otwarte, czwartek 19:00, D-17 sala 1.38, wstęp wolny”.
- **Jev wypełnia cały formularz:** tytuł, opis, kategorię, adres i limit miejsc. Rozumie też „w czwartek” czy „jutro wieczorem” i zamienia to na konkretną datę.
- **Jev mówi, czego brakuje.** Pola, których nie był pewien, są podświetlone do sprawdzenia, zamiast zgadywania.
- **Człowiek ma ostatnie słowo.** Jev tylko proponuje. Nic nie trafia na mapę bez zatwierdzenia przez organizatora.

Formularz, który zajmował 10 minut, zajmuje 30 sekund. Organizator nie przepisuje tego samego posta do kolejnego narzędzia, więc chętniej dodaje każde wydarzenie. Obok oficjalnych wydarzeń pojawiają się też oddolne mikro-wydarzenia dodane przez samych studentów, a tego nie ma nikt inny.

### 6. Model biznesowy: pakiety dla organizatorów

Dla studentów aplikacja jest darmowa. Organizacje kupują pakiety od 10 zł w górę, a każdy wyższy pakiet daje więcej:
- więcej wydarzeń z Jevem;
- statystyki: wyświetlenia, swipe'y w prawo, w lewo i pominięcia;
- wyróżnienie w talii i na mapie;
- krótkie opinie uczestników po wydarzeniu.

Plakat wisi w jednym miejscu, a my docieramy do studentów, którzy już interesują się tematem. Na start sami budujemy bazę wydarzeń, a uczelniom i kołom dajemy pakiet za darmo. Ruch organiczny ze społeczności przyciąga płacących organizatorów.

**Korzyści:**
- **Student:** w minutę wie, co dzieje się dziś blisko niego i pasuje do jego zainteresowań. Łatwiej mu wyjść z pokoju i poznać ludzi.
- **Organizator:** dociera do dokładnie tych studentów, którzy interesują się jego tematem. Z Jevem dodaje wydarzenie w 30 sekund, a ze statystyk wie, co działa.
- **Miasto i uczelnie:** zyskują lepszą komunikację z mieszkańcami i lepiej wykorzystane przestrzenie publiczne. Studenci, którzy się angażują, rzadziej rezygnują ze studiów.

Pilotaż: Kraków (ok. 152 tys. studentów na uczelniach w Małopolsce). Aplikacja jest gotowa do uruchomienia w kolejnych miastach akademickich. Dane dodają ich właściciele, nie scrapujemy cudzych stron.

**Źródła:** GUS „Szkolnictwo wyższe w roku akademickim 2024/2025”; CBOS „Kto jest najbardziej narażony na samotność?” (2024); PAP Nauka w Polsce, badanie samotności pokolenia Z; Sprout Social Q2 2025 Pulse Survey; McKinsey „The value of getting personalization right—or wrong—is multiplying”; Kulp i in. 2021, „Types of Extracurricular Campus Activities and First-Year Students' Academic Success”.

## Challenges

**SMART CITY.** Formularz ma dziś wybrane zadanie AI, trzeba to zmienić.

## Cover image

Propozycja: zrzut ekranu telefonu z mapą Krakowa i kolorowymi pinami, obok karta w trakcie swipe'a z napisem „Bo lubisz: planszówki”, plus logo. Format 16:9, kolory marki z [DESIGN.md](DESIGN.md). Grafikę robi design po zrobieniu zrzutów z działającej aplikacji.

## Idea stage

**New Idea**

## What's done so far and goal of your project

**Przed wydarzeniem (29.09.2026):** założyliśmy repozytorium, spisaliśmy zasady pracy w zespole (konwencje commitów i pull requestów) i dodaliśmy README. Nie powstał żaden kod aplikacji.

**Na HackYeah, w pierwszych godzinach:**
- Mamy specyfikację produktu, architekturę, kontrakt API, research rynku, checklistę prawną i plan na 24h (katalog `docs/`).
- Backend (FastAPI + SQLite) ma endpoint zdrowia, model kart i decyzji swipe oraz endpoint wydający użytkownikowi kolejne karty bez powtórzeń. Do tego są testy.
- Frontend ma szkielet: Vite + React + TypeScript + Tailwind.
- Gotowy jest koncept UI z logo, kolorami marki i pięcioma ekranami w trzech rozdzielczościach.

**Cel na koniec hackathonu:**
- Przepływ end-to-end: ekran powitalny → onboarding → swipe → mapa → kalendarz z eksportem `.ics`.
- Rekomendacje z prostą, wyjaśnialną formułą (kategoria, odległość, czas), dociągane w tle partiami po 10 kart.
- Dwa konta demo (student i organizacja), formularz dodawania wydarzenia i Jev dla organizacji.
- Ekran pakietów sponsora i statystyk na danych demo.
- 30–50 wydarzeń demo w Krakowie.

## Team status

**Team completed**

## Current team size

**4**: Frontend, Backend, UI/UX, Project Manager

## Needed skills

Brak, zespół jest kompletny.

## Skills comment

Puste.

## Your video presentation

**[PÓŹNIEJ]** Proponujemy 60–90 s nagrania ekranu telefonu: swipe → mapa → dodanie wydarzenia z AI. Wgrywamy na YouTube jako „Niepubliczny” (Listed). Nagrywamy po zamrożeniu funkcji (21h).

## Website

**[PÓŹNIEJ]** Link do działającego demo, jeśli je wystawimy. Bez demo zostawiamy puste.

## Code Repository

https://github.com/hackyeahKrakow/project

Repo jest publiczne (sprawdzone 3.10.2026), licencja MIT.

## Instructions on how to open project

```bash
git clone https://github.com/hackyeahKrakow/project
cd project

# Backend (Python 3.11+, uv)
cp apps/backend/.env.example apps/backend/.env
uv run fastapi dev apps/backend/app/main.py
# API: http://localhost:8000, dokumentacja: http://localhost:8000/docs

# Frontend (Node 20+), w drugim terminalu
cd apps/frontend
cp .env.example .env
npm install
npm run dev
# Aplikacja: http://localhost:5173
```

Klucz do LLM (autofill) podajemy w `apps/backend/.env`. Bez klucza aplikacja działa, tylko bez autouzupełniania.

## Presentation

Maksymalnie 10 slajdów w PDF, według planu z [PITCH.md](PITCH.md). Na ostatnim slajdzie ujawniamy narzędzia AI, API i biblioteki ([LEGAL.md](LEGAL.md)). Regulamin tego wymaga.
