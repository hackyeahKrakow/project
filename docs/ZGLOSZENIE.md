# Zgłoszenie na Challenge Rocket (draft)

Wersja robocza formularza „Add Project”. Pola oznaczone **[DO DECYZJI]** czekają na odpowiedź zespołu. Stan na 3.10.2026, ok. 17:00.

---

## Project Name

**[DO DECYZJI]** Szukamy nazwy z twistem, którą społeczność studencka od razu „łapie”. Domeny sprawdzone 3.10.2026, ewentualne konflikty sprawdzone w wyszukiwarce.

| Kandydat | Twist | Domena | Konflikty, które znaleźliśmy |
| --- | --- | --- | --- |
| **Kto wbija?** | Pytanie, które pada na każdym grupowym czacie. Od razu znaczy „mikro-wydarzenie oddolne”, nasz wyróżnik na tle GoJammin | `ktowbija.app` wolna, `.pl` zajęta | Nie znaleźliśmy żadnej aplikacji |
| **Cynk** | „Dać cynk” to po polsku dać znać, co się dzieje. Działa w dwie strony: organizator daje cynk, student dostaje cynk. Logo jako kafelek z układu okresowego „Zn 30” to puszczenie oka do studentów | `dajcynk.app` wolna, `cynk.pl` i `cynk.app` zajęte | „Daj cynk” to zakładki zgłoszeń w lokalnych portalach (Bytom, Pyskowice), więc fraza pospolita. Konfliktu z aplikacją nie znaleźliśmy |
| **Lecimy** | Jedno słowo, które kończy każdą dyskusję „idziemy czy nie” | `lecimy.app` wolna, `.pl` zajęta | Nie znaleźliśmy aplikacji |
| **Antyfomo** | Nazwa mówi, jaki problem rozwiązujemy (FOMO) | `antyfomo.app` wolna, `.pl` zajęta | Niemiecka „Was geht” używa hasła „Goodbye to FOMO”, ale to inna nazwa |
| Wbitka | Slang „wbić się” | `wbitka.app` wolna | Brak, ale słowo mniej znane |

Odrzucone: **spotted** (Spotted.de to aplikacja randkowa w UE, a „Spotted: [uczelnia]” to gatunek anonimowych fanpage'y plotkarskich), **Hejnał** (miasto ma oficjalną aplikację „Graj Hejnał”, a hejnał to symbol Krakowa, więc ryzyko z marką miejską), **Wpadaj** (aplikacja do rezerwacji w salonach), **Wbijam** (serwis z anime), **Bywaj**, **Zajawka**, **Pinezka** (poprawne, ale bez twistu).

Rekomendacja: **Kto wbija?**, z hasłem „Studencki Kraków na jednej mapie”. Rezerwa: **Cynk**.

Przed decyzją PM sprawdza znak w [TMview](https://www.tmdn.org/tmview/) (EUIPO + UPRP) w klasach Nicejskich 9, 41 i 42. Wybraną domenę `.app` kupujemy od razu (ok. 14 USD), żeby nikt jej nie zajął po pitchu.

## Problem

Na uczelniach z siedzibą w Małopolsce studiuje ok. 152 tys. osób (GUS, stan na 31.12.2024), a większość z nich w Krakowie. Informacje o tym, co się dzieje na uczelni i w mieście, są rozproszone po stronach wydziałów, grupach na Facebooku i Instagramach kół naukowych. Nie ma jednego miejsca, które zbiera wydarzenia ze wszystkich krakowskich uczelni.

Skutki widać po obu stronach:
- **Studenci, zwłaszcza pierwszego roku, nie wiedzą, gdzie i kiedy coś się dzieje.** 17% uczniów i studentów bardzo często lub zawsze odczuwa samotność, a wśród wszystkich dorosłych ten odsetek wynosi 8% (CBOS 2024).
- **Organizatorzy (koła, samorządy, lokale) nie docierają do odbiorców.** Uczelnie płacą nawet za reklamy w tramwajach.
- **Duże agregatory nie pokazują tego, co studenckie.** GoJammin i Karnet Kraków Culture pokazują duże wydarzenia dla wszystkich mieszkańców. Nie ma u nich ani spotkań kół, ani oddolnych „planszówek w akademiku”.

**[DO DECYZJI]** Wyniki ankiety wśród studentów na HackYeah (zadanie P5): liczba odpowiedzi i 1–2 cytaty. Twarda liczba z własnej ankiety jest najmocniejszym argumentem w tym polu.

## Solution

[Nazwa] to aplikacja webowa (PWA) dla studentów w Krakowie. Działa w przeglądarce telefonu, bez instalacji i bez zakładania konta. Ma trzy elementy.

1. **Czysta mapa miasta.** Bez sklepów, stacji i reklam, tylko wydarzenia studenckie i miejsca, w których się odbywają. Każda kategoria ma kolor i ikonę.
2. **Swipe jak w Tinderze.** W prawo znaczy „interesuje mnie”: wydarzenie trafia na „Moją mapę”. W lewo znaczy „pomiń”. Rekomendacje uczą się z każdego ruchu, a każda karta mówi, dlaczego ją widzisz, np. „Bo lubisz: planszówki · dziś 19:00”. Nie ma czarnej skrzynki.
3. **Dodawanie wydarzeń z AI.** Organizator wkleja tekst swojego posta, a model językowy wypełnia formularz: tytuł, datę, miejsce, cenę i kategorię. Organizator sprawdza i zatwierdza. Nic nie trafia na mapę bez akceptacji człowieka.

**Korzyści:**
- **Student:** w 30 sekund widzi, co dzieje się dziś w jego okolicy i pasuje do jego zainteresowań.
- **Organizator:** dostaje darmowy zasięg do studentów, a dodanie wydarzenia zajmuje minutę.
- **Miasto i uczelnie:** zyskują lepszą komunikację z mieszkańcami i lepiej wykorzystane przestrzenie publiczne.

Dane dodają ich właściciele. Nie scrapujemy cudzych stron.

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
- Przepływ end-to-end: onboarding → swipe → wyróżnienie polubionych na mapie → karta wydarzenia.
- Rekomendacje z prostą, wyjaśnialną formułą (kategoria, odległość, czas).
- Formularz dodawania wydarzenia z autouzupełnianiem przez AI.
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
