# Tablica projektu (GitHub Projects)

Tworzy ją `scripts/setup_github_project.sh` (pola: Status, Kamień milowy, Rola, Termin). Widoków `gh` nie tworzy, trzeba je dodać raz w UI (Projects → **+ New view**):

| Widok | Układ | Ustawienia |
| --- | --- | --- |
| Board | Board | Kolumny wg Status (Todo / In Progress / Done), grupowanie wg Rola |
| Moje zadania | Table | Filtr `assignee:@me`, sortowanie wg Termin (h od startu) |
| Kamienie milowe | Table | Grupowanie wg Kamień milowy, sortowanie wg Termin |
| Roadmapa | Roadmap | Znaczniki wg Kamień milowy |

Automatyzacje (Project → ⋯ → Workflows): włącz „Item closed → Status: Done” i „Pull request merged → Status: Done”.

Kolumny Kamień milowy i Rola uzupełnij raz zbiorczo w widoku Table (zaznacz wiele wierszy, wklej wartość): etykiety `m1`–`m4` i `frontend`/`backend`/`design`/`pm` w issues mówią, co wpisać.
