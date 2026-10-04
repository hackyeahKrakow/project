# Materiały zgłoszeniowe — spootted (HackYeah 2026)

Zespół **The Spoots**. Wszystkie zgłoszenia po polsku, w formacie wymaganym przez HackYeah.

## Struktura

```
docs/submissions/
  SHARED/
    team.md              # nazwa zespołu, członkowie, praca przed/w trakcie
    ai-disclosure.md     # obowiązkowe ujawnienie AI, modeli, API, danych, bibliotek
  smart-city/
    zgloszenie.md        # wypełniony formularz (format HackYeah)
    deck.pdf             # prezentacja, 10 slajdów
  ai/
    zgloszenie.md
    deck.pdf
  krakow-bez-barier/
    zgloszenie-form.md   # wypełniony formularz (format HackYeah)
    zgloszenie.md        # pełny opis zgłoszenia
    dane-i-wiarygodnosc.md
    model-biznesowy.md
    scenariusz-wideo.md
    deck.pdf
    spootted-krakow-bez-barier.srt
  assets/                # okładki i zrzuty ekranu z działającej aplikacji
```

## Zadania

| Zadanie | Platforma | Język | Wymagane | Termin |
| --- | --- | --- | --- | --- |
| **Kraków bez barier** | HackTribe | polski | opis + PDF ≤10 slajdów + **mp4 ≤3 min** w otwartym repo | 4.10.2026, 11:00 |
| **SMART CITY** | Challenge Rocket | polski | opis + PDF ≤10 slajdów | 4.10.2026, 11:00 |
| **Artificial Intelligence** | Challenge Rocket | polski | opis + PDF ≤10 slajdów | 4.10.2026, 11:00 |

Wspólne dane (nazwa, członkowie, repo, instrukcja uruchomienia) są w każdym `zgloszenie*.md`. Ujawnienie AI: [`SHARED/ai-disclosure.md`](SHARED/ai-disclosure.md).

## Checklista wysyłki

### Wspólne
- [ ] **Team ID z HackTribe** — uzupełnić w [`SHARED/team.md`](SHARED/team.md) i w zgłoszeniu Krakowa (nie znaleziono na platformie).
- [ ] Repo publiczne i aktualne: https://github.com/hackyeahKrakow/spootted
- [ ] Demo działa: https://spootted.dawidm.com (sprawdzone: HTTP 200, `/api/health` → ok)
- [ ] Deck PDF ≤ 10 slajdów i ≤ 10 MB (jest: 10 slajdów)
- [ ] Ujawnienie AI wklejone do formularza

### Kraków bez barier
- [ ] Wdrożyć PR #99 (panel dostępności) na produkcję, żeby demo i nagranie pokazywały szczegóły barier
- [x] Nagrać mp4 ≤ 3 min (scenariusz: [`scenariusz-wideo.md`](krakow-bez-barier/scenariusz-wideo.md); automatyzacja: `scripts/record-demo.mjs`) — gotowe: [`spootted-krakow-bez-barier.mp4`](krakow-bez-barier/spootted-krakow-bez-barier.mp4) (2:45, 1920×1080)
- [x] Napisy PL wypalone ([`.srt`](krakow-bez-barier/spootted-krakow-bez-barier.srt) w repo)
- [x] Film w otwartym repozytorium (`docs/submissions/krakow-bez-barier/spootted-krakow-bez-barier.mp4`)
- [ ] Opcjonalnie: nagrać ponownie na produkcji po wdrożeniu PR #99 (obecne nagranie z lokalnej wersji z pełnym panelem dostępności)
- [ ] Zgłoszenie na **HackTribe** (polski)

### SMART CITY / AI
- [ ] Link do YouTube („Unlisted") w polu „Your video presentation" — [DO UZUPEŁNIENIA]
- [ ] Zgłoszenie na **Challenge Rocket**

## Uwaga o pracy przed hackathonem

Przed wydarzeniem istniało **tylko repozytorium, README i dokumentacja** — bez kodu aplikacji. Cały kod `apps/` powstał w trakcie HackYeah. To uczciwe i weryfikowalne w historii gita.

## Jak wygenerować decki ponownie

Decki powstają z HTML → PDF przez Chromium. Generator (poza repo, narzędzie robocze) używa:
`chromium --headless --print-to-pdf` lub Playwright. Zrzuty ekranu: `scripts/record-demo.mjs` (Playwright).
