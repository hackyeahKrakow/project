# Zgłoszenie HackYeah — Kraków bez barier

> Wypełniony formularz w formacie wymaganym przez HackYeah. Wersja polska. Zgłoszenie na platformę **HackTribe** (wymagania partnera: prezentacja PDF maks. 10 slajdów + film mp4 maks. 3 min w otwartym repozytorium). Dokumenty uzupełniające: [`zgloszenie.md`](zgloszenie.md), [`dane-i-wiarygodnosc.md`](dane-i-wiarygodnosc.md), [`model-biznesowy.md`](model-biznesowy.md), [`scenariusz-wideo.md`](scenariusz-wideo.md).

## Project Name

**spootted — Kraków bez barier. Zmatchuj się z eventami, do których wjedziesz.**

## Problem

Osoba poruszająca się na wózku przed każdym wyjściem musi odpowiedzieć na serię pytań: czy wjadę do środka, czy jest winda, czy będzie toaleta, czy dojedzie tramwaj niskopodłogowy, gdzie zaparkować z kartą parkingową. Dziś odpowiada na nie sama — dzwoniąc do organizatora albo szukając na kilku stronach.

**Samo oznaczenie „dostępne / niedostępne" nie wystarcza** — nie mówi, czy miejsce pasuje do konkretnej osoby. Potrzebne są szczegóły: schody, progi, podjazdy, windy, szerokość wejścia, nawierzchnia, toaleta, miejsca odpoczynku — oraz informacja, **skąd pochodzą, kiedy zostały sprawdzone i jak są wiarygodne**.

**Skala problemu (nasz audyt, 3–4.10.2026):** wśród ok. 20 krakowskich obiektów, w których odbywają się wydarzenia, **tylko 3 mają szczegółowe, oficjalne deklaracje dostępności** (TAURON Arena, ICE Kraków, Nowohuckie Centrum Kultury) — to ok. **15%**. Dla reszty nie ma rzetelnego źródła, więc informacja bywa nieaktualna albo podawana jako pewnik bez potwierdzenia. W Krakowie studiuje ok. **152 tys. studentów** (GUS, 31.12.2024), a miasto odwiedzają miliony turystów — wśród nich osoby z niepełnosprawnością ruchową, dla których brak informacji oznacza rezygnację z wyjścia albo podróż „na ryzyko".

## Solution

**spootted** to PWA, która pokazuje wydarzenia w Krakowie na mapie i w talii typu swipe. Dla tego wyzwania kluczowa jest **ścieżka dostępności**:

- **Ustawiasz raz, działa wszędzie.** Potrzebę „Miejsca i dojazd bez barier" włącza się raz (ekran powitalny, onboarding albo Konto), a potem talia, mapa, trasy i parkingi same się dopasowują.
- **Szczegóły zamiast etykiety.** Karta wydarzenia ma rozwijany panel **„Szczegóły dostępności"**: wejście bez schodów, podjazd, winda, progi, szerokość wejścia, nawierzchnia, toaleta, miejsca odpoczynku, parking dla ON, pętla indukcyjna. Każda wartość to **tak / nie / brak danych**.
- **Źródło, data i wiarygodność przy każdej informacji.** Dane potwierdzone przez obiekt są oddzielone od niepotwierdzonych zgłoszeń użytkowników. **Brak danych nigdy nie jest pokazywany jako dostępność.**
- **Cała podróż, nie tylko miejsce.** „Zaplanuj dojazd" liczy trasę bez schodów (profil wózka), wskazuje tramwaje niskopodłogowe i opóźnienia na żywo; sekcja „Autem" pokazuje miejsca dla ON przy ulicy i parkingi.
- **Utrudnienia na żywo.** Jeśli przystanek przy wydarzeniu jest nieczynny, karta pokazuje komunikat ZTP, zanim wyjdziesz z domu.

**Korzyści:** osoba na wózku wie, czy wjedzie, jak dojedzie i gdzie zaparkuje — zanim wyjdzie z domu; obiekty pokazują sprawdzone dane o dostępności; miasto lepiej wykorzystuje przestrzenie i pokazuje ofertę wszystkim mieszkańcom.

**Model biznesowy:** darmowy dla użytkowników; płacą organizatorzy i obiekty. Kluczowy strumień to **„Profil dostępności obiektu"** (utrzymanie i potwierdzanie danych o dostępności) dla hoteli, instytucji kultury, zarządców nieruchomości i systemów rezerwacyjnych. Skalowanie na inne miasta przez „paczkę miasta". Szczegóły: [`model-biznesowy.md`](model-biznesowy.md).

**Dlaczego to wygrywa:** dostępność z proweniencją (źródło, data, wiarygodność), ustawienie raz zamiast filtra, cała podróż z niską podłogą i parkingami, dane bez utrzymywania bazy przez miasto, otwarte i skalowalne (MIT, zgodność z OSM/Wheelmap).

## Challenges

**Kraków bez barier**

## Cover image

Okładka 16:9: karta wydarzenia z rozwiniętym panelem „Szczegóły dostępności" (TAURON Arena: winda, toaleta, parking, 52 miejsca) + znaczek „Potwierdzone przez obiekt" + logo. Plik: `docs/submissions/assets/cover-krakow.png`.

## Idea stage

**New Idea.** Przed wydarzeniem nie istniał żaden kod aplikacji — tylko repozytorium i dokumentacja (patrz niżej).

## What's done so far and goal of your project

**Przed wydarzeniem (do 3.10.2026, 11:00):** repozytorium, zasady pracy zespołu, README i dokumentacja produktu (`docs/`). **Zero kodu aplikacji.**

**W trakcie HackYeah (3–4.10.2026):** cała aplikacja wraz ze ścieżką dostępności: model szczegółowych danych o barierach ze źródłem/datą/wiarygodnością, dane z trzech oficjalnych deklaracji krakowskich obiektów, trasy bez schodów i niskopodłogowe, parkingi dla ON, komunikaty ZTP, audyt i poprawki **WCAG 2.2 AA** (0 naruszeń axe-core po poprawkach), wdrożenie na Vercel.

**Cel osiągnięty:** działający prototyp, który odpowiada na pytania osoby na wózku i pokazuje konkretne bariery oraz udogodnienia z wiarygodnym źródłem.

## Team status

**Team completed** — zespół jest kompletny.

## Current team size

**4**

## Needed skills

Brak — zespół jest kompletny.

## Skills comment

Puste.

## Your video presentation

**Wymagane mp4 (maks. 3 min)** dla tego wyzwania, umieszczone w otwartym repozytorium. Scenariusz i lista ujęć: [`scenariusz-wideo.md`](scenariusz-wideo.md). Docelowo także link YouTube („Unlisted"): [DO UZUPEŁNIENIA].

## Website

https://spootted.dawidm.com

## Code Repository

https://github.com/hackyeahKrakow/spootted

## Instructions on how to open project

```bash
git clone https://github.com/hackyeahKrakow/spootted
cd spootted

# Backend (Python 3.11+, uv), z katalogu apps/backend
cd apps/backend
cp .env.example .env
uv run fastapi dev app/main.py
# API: http://localhost:8000, dokumentacja: http://localhost:8000/docs

# Frontend (Node 20+), w drugim terminalu
cd apps/frontend
cp .env.example .env
npm install
npm run dev
# Aplikacja: http://localhost:5173
```

Bez klucza AI aplikacja działa. Dane o dostępności (TAURON Arena, ICE Kraków, NCK) są wbudowane i widoczne bez backendu.

## Presentation

PDF, maks. 10 slajdów: `docs/submissions/krakow-bez-barier/deck.pdf`. Film mp4 (maks. 3 min) w repozytorium: `docs/submissions/krakow-bez-barier/spootted-krakow-bez-barier.mp4`.
