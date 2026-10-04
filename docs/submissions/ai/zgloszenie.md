# Zgłoszenie HackYeah — ARTIFICIAL INTELLIGENCE

> Wypełniony formularz w formacie wymaganym przez HackYeah. Wersja polska.

## Project Name

**spootted — zmatchuj się z eventami w Krakowie**

## Problem

Informacja o tym, co się dzieje w mieście, jest dziś **trudna do znalezienia i zrozumienia**. Student nie wie, gdzie szukać: strony wydziałów, grupy i fanpage'e „Spotted", Instagramy kół, plakaty. **41% pokolenia Z** szuka informacji najpierw w mediach społecznościowych (Sprout Social 2025), ale algorytmy tych platform nie znają lokalnego kontekstu („dziś 19:00, koło robotyki, 300 m od akademika"). Agregatory pokazują setki wydarzeń bez personalizacji — a **71% konsumentów oczekuje personalizacji, a 76% irytuje się, gdy jej nie dostaje** (McKinsey). Istniejące rekomendacje są przy tym **czarną skrzynką**: użytkownik nie wie, dlaczego widzi daną propozycję.

Druga strona to **praca organizatorów**: dodanie wydarzenia do kilku narzędzi to przepisywanie tego samego posta i 10 minut na wydarzenie. **17% uczniów i studentów bardzo często lub zawsze odczuwa samotność** (CBOS 2024), a brak informacji o wydarzeniach pogłębia wykluczenie — szczególnie osób z niepełnosprawnością ruchową.

Potrzebne jest rozwiązanie, w którym **AI realnie pomaga**, ale użytkownik zachowuje kontrolę, rozumie wyniki i może je zweryfikować.

## Solution

***Zmatchuj się z eventami.*** spootted to PWA dla studentów w Krakowie: mapa wydarzeń i talia typu swipe, która uczy się preferencji. AI odgrywa w niej dwie konkretne, wyjaśnialne role.

### Rola AI 1: rekomendacje, które da się zrozumieć

- Ranking kart wybiera model **Jev 1.13 (TypeSafe AI, System One)** przez OpenCode Zen. Backend losuje kandydatów, na których użytkownik jeszcze nie odpowiedział, i wysyła do modelu jedno zapytanie ze stanem (polubione, odrzucone, kandydaci) oraz po jednym pytaniu na kandydata. Model zwraca **typowane prawdopodobieństwa**, więc nie halucynuje swobodnym tekstem.
- **Użytkownik widzi powód** każdej karty: „Bo lubisz: planszówki · 600 m od ciebie · dziś 19:00". To wymóg przejrzystości systemów rekomendacyjnych z unijnego DSA w praktyce.
- **Kontrola i odporność na awarie:** gdy model jest niedostępny, zbyt wolny albo zwróci niepoprawną odpowiedź, backend zwraca **losowych kandydatów zamiast błędu**. Rekomendacje nie zapisują się w bazie; do modelu nie trafia identyfikator użytkownika.

### Rola AI 2: wydarzenie tworzy się samo — ale człowiek zatwierdza

- Organizator **wkleja tekst posta albo pisze jedno zdanie** („Koło Robotyki AGH zaprasza na spotkanie otwarte, czwartek 19:00, D-17 sala 1.38, wstęp wolny").
- Model czatu (`minimax-m2.5-free` przez OpenCode Zen) **wypełnia cały formularz**: tytuł, opis, kategorię, adres, cenę, wielkość; rozumie „w czwartek" i „jutro wieczorem" i zamienia to na konkretną datę.
- **AI mówi, czego nie wie:** pola niepewne trafiają do `missing_fields` i są podświetlone „Sprawdź", zamiast zgadywania. **Dostępności dla osób z niepełnosprawnością AI nie zgaduje** — deklaruje ją człowiek.
- **Ostatnie słowo ma człowiek:** nic nie trafia na mapę bez zatwierdzenia przez organizatora.

### Korzyści

- **Student:** zamiast przeglądać sto wydarzeń, dostaje trafne propozycje i rozumie, dlaczego je widzi.
- **Organizator:** formularz, który zajmował 10 minut, zajmuje 30 sekund; nie przepisuje posta do kolejnego narzędzia.
- **Miasto i instytucje:** więcej oddolnych mikro-wydarzeń i lepsze wykorzystanie przestrzeni; anonimowe dane o popycie.

### Decyzje techniczne, możliwości i ograniczenia

- **Dlaczego Jev:** szybki (setki ms), tani, zwraca typowane prawdopodobieństwa (mniejsze ryzyko halucynacji), łatwo dodać zapas losowy. Alternatywa (klasyczny LLM generujący tekst) została odrzucona.
- **Ograniczenia:** rekomendacje są tak dobre, jak dane wejściowe; przy braku historii działania zapas jest losowy; autouzupełnianie może się mylić — dlatego jest oznaczane i zatwierdzane przez człowieka.
- **Weryfikacja wyników:** użytkownik widzi uzasadnienie karty, a organizator widzi podświetlone pola do sprawdzenia przed publikacją.
- **Bezpieczeństwo i prywatność:** klucz API tylko w `.env`; do modeli trafiają wyłącznie dane kart i decyzje, bez danych osobowych.

## Challenges

**ARTIFICIAL INTELLIGENCE**

## Cover image

Okładka 16:9: ekran dodawania wydarzenia z podświetlonymi polami „Sprawdź" (AI) + karta z uzasadnieniem „Bo lubisz…" + logo. Plik: `docs/submissions/assets/cover-ai.png`.

## Idea stage

**New Idea.** Przed wydarzeniem nie istniał żaden kod aplikacji — tylko repozytorium i dokumentacja (patrz niżej).

## What's done so far and goal of your project

**Przed wydarzeniem (do 3.10.2026, 11:00):** repozytorium, zasady pracy zespołu, README i dokumentacja produktu (`docs/`). **Zero kodu aplikacji.**

**W trakcie HackYeah (3–4.10.2026):** pełna aplikacja, w tym obie funkcje AI działające end-to-end: rekomendacje przez Jev (z zapasem losowym) i autouzupełnianie formularza przez model czatu (z `missing_fields` i zatwierdzaniem). Do tego backend, frontend, integracje miejskie, audyt WCAG 2.2 AA i wdrożenie.

**Cel osiągnięty:** pokazanie AI, które jest użyteczne, wyjaśnialne i pod kontrolą człowieka — a nie czarną skrzynką.

## Team status

**Team completed** — zespół jest kompletny.

## Current team size

**4**

## Needed skills

Brak — zespół jest kompletny.

## Skills comment

Puste.

## Your video presentation

[DO UZUPEŁNIENIA] Planowany 60–90 s film (YouTube, „Unlisted"): wklejenie posta → AI wypełnia formularz → organizator zatwierdza → rekomendacja z uzasadnieniem. Link wstawiamy po nagraniu.

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
# wpisz OPENCODE_API_KEY, aby włączyć AI (rekomendacje Jev + autouzupełnianie)
uv run fastapi dev app/main.py

# Frontend (Node 20+), w drugim terminalu
cd apps/frontend
cp .env.example .env
npm install
npm run dev
```

Bez klucza AI aplikacja działa: rekomendacje są losowe, a autouzupełnianie pokazuje jawnie oznaczoną przykładową odpowiedź.

## Presentation

PDF, maks. 10 slajdów: `docs/submissions/ai/deck.pdf`.
