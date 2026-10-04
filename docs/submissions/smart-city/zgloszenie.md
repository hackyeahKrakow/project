# Zgłoszenie HackYeah — SMART CITY

> Wypełniony formularz w formacie wymaganym przez HackYeah. Wersja polska.

## Project Name

**spootted — zmatchuj się z eventami w Krakowie**

## Problem

W Polsce studiuje **1,28 mln osób na 352 uczelniach** (GUS, 2024/25), a w uczelniach z siedzibą w Małopolsce ok. **152 tys. studentów** (GUS, 31.12.2024). Co roku setki tysięcy z nich zaczynają życie w nowym mieście — bez znajomych i bez mapy tego, co się wokół dzieje.

**Samotność to realny problem, nie hasło.** Studenci najczęściej ze wszystkich grup odczuwają samotność: **17% bardzo często lub zawsze**, wobec 8% wszystkich dorosłych (CBOS 2024). W pokoleniu Z samotność regularnie odczuwa **65%** osób w wieku 13–28 lat. Udział w aktywnościach poza zajęciami wzmacnia poczucie przynależności i zmniejsza ryzyko rezygnacji ze studiów po pierwszym roku.

**Wydarzeń nie brakuje. Brakuje sposobu, żeby do nich dotrzeć.**

- Informacje są rozproszone po stronach wydziałów, grupach i fanpage'ach „Spotted", Instagramach kół i plakatach na korytarzach. Nie ma jednego miejsca, w którym student zobaczy, co dzieje się dziś wokół niego.
- **41% pokolenia Z** szuka informacji najpierw w mediach społecznościowych, a nie w wyszukiwarce (Sprout Social 2025), ale algorytmy tych platform nie wiedzą, że dziś o 19:00 koło robotyki ma spotkanie otwarte 300 m od akademika.
- Organizatorzy (koła, samorządy, lokale, uczelnie) nie docierają do odbiorców. Uczelnie płacą za reklamy w komunikacji miejskiej, a koło naukowe ma tylko własny fanpage.
- Agregatory (GoJammin, miejskie kalendarze kultury) pokazują duże wydarzenia dla wszystkich mieszkańców. Nie ma w nich spotkania otwartego koła ani „planszówek w akademiku, pokój 312".

Miasto nie wykorzystuje też dobrze swoich zasobów: przestrzenie publiczne, biblioteki i sale stoją puste wieczorami, a komunikacja miejska i miejsca bez barier są słabo skomunikowane z tym, co się dzieje.

## Solution

***Zmatchuj się z eventami.*** spootted działa jak aplikacja randkowa, tylko zamiast ludzi dopasowuje studentom wydarzenia. Kilka pytań i kilka swipe'ów wystarczy, żeby aplikacja wiedziała, co cię kręci. Po minucie masz własną mapę miasta z wydarzeniami dla siebie.

**Korzyści:**

- **Student:** w minutę wie, co dzieje się dziś blisko niego i pasuje do jego zainteresowań. Łatwiej mu wyjść z pokoju i poznać ludzi.
- **Organizator (koło, uczelnia, lokal, instytucja):** dociera dokładnie do zainteresowanych studentów. Z funkcjami AI dodaje wydarzenie w 30 sekund, a ze statystyk wie, co działa.
- **Miasto i instytucje:** instytucje miejskie (biblioteki, domy kultury) docierają do studentów bez reklam w tramwajach, a z anonimowych statystyk wiedzą, czego studenci chcą. Studenci łatwiej korzystają z komunikacji miejskiej i miejsc bez barier.

**Jak to działa (obszary zadania SMART CITY):**

- **Planowanie podróży:** karta wydarzenia pokazuje najbliższy przystanek z otwartych danych ZTP Kraków (GTFS); „Zaplanuj dojazd" liczy trasę z lokalizacji tak, by być na miejscu 10 minut przed startem, z opóźnieniami na żywo i oznaczeniem tramwaju niskopodłogowego.
- **Reagowanie na utrudnienia:** przy nieczynnym przystanku lub objazdzie karta pokazuje komunikat ZTP (GTFS-Realtime, odświeżany co 2 minuty), zanim wyjdziesz z domu.
- **Dostępność dla osób o różnych potrzebach:** potrzebę „bez barier" ustawia się raz; talia, mapa, trasy (bez schodów, niskopodłogowe) i parkingi same się dopasowują.
- **Komunikacja z instytucjami i dane do decyzji:** instytucja miejska widzi zbiorcze, anonimowe swipe'y i opinie, więc może oprzeć na nich decyzję (np. o dłuższych godzinach otwarcia biblioteki).
- **Wykorzystanie danych miejskich:** ZTP (GTFS/GTFS-Realtime), OpenStreetMap, Transitous/MOTIS, Overpass — wszystko z otwartych źródeł, bez scrapingu.

**Model biznesowy:** darmowy dla studentów; organizacje kupują pakiety (Iskra/Płomień/Ognisko, od 19 zł/mc), uczelnie i koła dostają pakiet darmowy. Koło zamachowe: studenci → koła dodają wydarzenia → więcej treści → płacący organizatorzy. Pilotaż: Kraków; gotowe do uruchomienia w kolejnych miastach akademickich.

**Zgodność ze Strategią Rozwoju Krakowa „Tu chcę żyć. Kraków 2030":** rozwiązanie wpisuje się w koncepcję smart city (lepsze wykorzystanie zasobów miasta, dane dla decyzji, komunikacja z mieszkańcami).

## Challenges

**SMART CITY**

## Cover image

Okładka 16:9: mapa Krakowa z kolorowymi pinami + karta w trakcie swipe'a z napisem „Bo lubisz: planszówki" + logo. Plik: `docs/submissions/assets/cover-smart-city.png`.

## Idea stage

**New Idea.** Przed wydarzeniem nie istniał żaden kod aplikacji — tylko repozytorium i dokumentacja (patrz niżej).

## What's done so far and goal of your project

**Przed wydarzeniem (do 3.10.2026, 11:00):** założyliśmy repozytorium, spisaliśmy zasady pracy zespołu (konwencje commitów i pull requestów), dodaliśmy README oraz dokumentację produktu (`docs/`: specyfikacja, architektura, kontrakt API, research rynku, checklista prawna, plan 24h). **Nie powstał żaden kod aplikacji.**

**W trakcie HackYeah (3–4.10.2026):** cała aplikacja — backend (FastAPI + SQLite), frontend (Vite + React + TypeScript + Tailwind + Preline UI + MapLibre GL), dane (48 wydarzeń), integracje (ZTP GTFS/GTFS-Realtime, Transitous, Overpass, Photon), rekomendacje z modelem Jev, autouzupełnianie formularza AI, pełny audyt dostępności WCAG 2.2 AA, wdrożenie na Vercel.

**Cel osiągnięty:** działający przepływ end-to-end — ekran powitalny → onboarding → swipe → mapa → kalendarz z eksportem `.ics`, dodawanie wydarzeń (student ręcznie, organizacja z AI), statystyki i pakiety sponsora, panel dostępności.

## Team status

**Team completed** — zespół jest kompletny.

## Current team size

**4**

## Needed skills

Brak — zespół jest kompletny.

## Skills comment

Puste.

## Your video presentation

[DO UZUPEŁNIENIA] Planowany 60–90 s film (YouTube, „Unlisted") : swipe → mapa → dodanie wydarzenia z AI. Link wstawiamy po nagraniu.

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

# Frontend (Node 20+), w drugim terminalu z katalogu głównego repo
cd apps/frontend
cp .env.example .env
npm install
npm run dev
# Aplikacja: http://localhost:5173
```

Bez klucza AI (`OPENCODE_API_KEY` w `apps/backend/.env`) aplikacja działa: rekomendacje są losowe, a autouzupełnianie pokazuje jawnie oznaczoną przykładową odpowiedź.

## Presentation

PDF, maks. 10 slajdów: `docs/submissions/smart-city/deck.pdf`.
