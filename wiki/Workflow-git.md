# Workflow git

## Zasady
- Nigdy nie commituj na `main`. Praca na gałęziach, merge przez Pull Request.
- Prefiksy w commitach i gałęziach: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`. Przykład gałęzi: `feat/sqlite-schemas`, commita: `feat: dodaj tabelę swipes`.
- Commituj i otwieraj PR co najwyżej co ok. 2 godziny, żeby `main` był aktualny.
- Często rób `git pull` z `main` (`git config --global pull.rebase true`).
- Merge: squash. Jeśli się da, niech zatwierdzi druga osoba.
- Opis PR: co najmniej jedno zdanie, co zrobiono. W opisie `Closes #numer`.

## Kontrakt API
`docs/API.md` jest źródłem prawdy. Zmiana kontraktu to osobny PR z etykietą `contract` i wiadomością na #decyzje. Strona, która nie robi zmiany, zatwierdza ją przed merge.

## Zamrożenie (od 21h)
Do `main` trafiają tylko poprawki błędów. Nowa funkcja = zamknięte lub przeniesione do roadmapy.

## Sekrety
`.env` nie trafia do gita. Klucz LLM tylko w `apps/backend/.env`, nigdy we frontendzie.
