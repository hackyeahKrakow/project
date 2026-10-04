# Dane o dostępności: źródła, aktualność, wiarygodność

Uzupełnienie zgłoszenia Kraków bez barier. Opisuje, skąd pochodzą dane o barierach i udogodnieniach, jak oceniamy ich aktualność i wiarygodność oraz co widzi użytkownik, gdy danych brakuje albo są sprzeczne.

## 1. Zasada nadrzędna

> **Brak informacji to nie to samo co „dostępne".** Aplikacja pokazuje wyłącznie to, co wie, zawsze ze źródłem i datą, i nigdy nie udaje pewności.

## 2. Model danych

Każda informacja o dostępności miejsca ma:

| Element | Znaczenie | Przykład |
| --- | --- | --- |
| `fields` | konkretne udogodnienia/bariery, każda wartość `tak` / `nie` / `brak danych` | `step_free_entry: yes`, `lift: yes`, `accessible_toilet: unknown` |
| `surface` | rodzaj nawierzchni | `gładka` / `kostka, nierówna` / `brak danych` |
| `door_width_cm` | szerokość wejścia (jeśli znana) | `90` |
| `source` | typ źródła | `obiekt` / `organizator` / `OpenStreetMap` / `zgłoszenie użytkownika` |
| `source_label` + `source_url` | dokładne wskazanie źródła | „Deklaracja dostępności TAURON Arena Kraków" + link |
| `updated_at` | data sprawdzenia/aktualizacji | `2026-10-03` |
| `reliability` | poziom wiarygodności | `potwierdzone przez obiekt` / `niepotwierdzone` / `nieznana` |
| `note` | kontekst, np. liczba miejsc, wyjątki | „52 miejsca dla wózków na poziomie A" |

Wartości `yes / limited / no` są **te same co tag `wheelchair` w OpenStreetMap i Wheelmap**, dzięki czemu dane miejsc można w przyszłości synchronizować z OSM bez mapowania.

## 3. Źródła i ich wiarygodność

| Źródło | Co daje | Wiarygodność | Aktualizacja |
| --- | --- | --- | --- |
| **Deklaracja dostępności obiektu** (TAURON Arena, ICE Kraków, NCK) | szczegóły: windy, drzwi, toalety, parkingi, miejsca na widowni | **Potwierdzone przez obiekt** | ręcznie przy zmianie; data `updated_at` |
| **Organizator wydarzenia** (formularz „Dodaj") | dostępność miejsca nowego wydarzenia | **Niepotwierdzone** (deklaracja) | przy publikacji wydarzenia |
| **OpenStreetMap** (`wheelchair`) | dostępność miejsc bez deklaracji | **Potwierdzone społecznościowo / zmienne** | cykliczna synchronizacja; licencja ODbL |
| **Zgłoszenie użytkownika** | sygnał o błędzie lub brakującej informacji | **Niepotwierdzone** | moderowane, do weryfikacji |
| **ZTP Kraków** (GTFS, GTFS-Realtime) | przystanki, niskopodłogowość, utrudnienia | **Dane publiczne miasta** | przystanki raz na dobę, komunikaty co 2 min |

## 4. Jak to wygląda dla użytkownika

Na karcie wydarzenia jest rozwijany panel **„Szczegóły dostępności"**:

- lista udogodnień z wartościami `Tak` / `Nie` / **`Brak danych`** (brak danych jest wyszarzony, nie udaje „tak"),
- nawierzchnia, źródło (link do deklaracji), data aktualizacji, poziom wiarygodności,
- przy danych niepotwierdzonych żółta adnotacja: *„Informacja niepotwierdzona. Przed wyjściem dopytać organizatora."*

Chip na karcie i na mapie mówi ogólnie: **„Bez barier" / „Częściowo bez barier" / „Z barierami" / „Dostępność nieznana"**.

## 5. Przypadki szczególne (wymagane przez wyzwanie)

### a) Dane sprzeczne
Obiekt podaje w deklaracji jedno, a użytkownik zgłasza co innego. Aplikacja **priorytetyzuje źródło oficjalne** (obiekt), ale zachowuje zgłoszenie jako niepotwierdzone i pokazuje je osobno. Rozbieżność trafia do moderacji. W prototypie pokazujemy to na przykładzie **Klub Studio**: użytkownik zgłosił częściową dostępność, ale nie ma deklaracji obiektu — dlatego informacja ma etykietę „niepotwierdzone", a nie „bez barier".

### b) Dane niepełne
Część pól jest znana, część nie (np. winda tak, toaleta brak danych). Aplikacja pokazuje znane wartości i wprost oznacza resztę jako „brak danych". **Nie wyciąga wniosku o dostępności z niepełnych danych.**

### c) Źródło niedostępne
Gdy nie mamy żadnego źródła dla miejsca (np. Klub Studio, Kwadrat, Zaścianek, Kino Kijów), status to **„Dostępność nieznana"**. Aplikacja nie usuwa wydarzenia, ale też go nie promuje jako dostępnego; użytkownik dostaje zachętę do kontaktu z organizatorem. Analogicznie przy awarii źródła miejskiego (ZTP/Transitous) aplikacja pokazuje ostatnie znane dane z datą albo nic — nigdy nie zgaduje.

## 6. Aktualizacja i poprawianie błędów

1. **Obiekt** może przejąć profil dostępności i zaktualizować dane (samoobsługa).
2. **Organizator** deklaruje dostępność przy publikacji wydarzenia.
3. **Użytkownik** może zgłosić nieścisłość lub potwierdzić dane po wydarzeniu („Czy wejście było bez barier?").
4. **Synchronizacja OSM** uzupełnia miejsca bez deklaracji.
5. Każda zmiana aktualizuje `updated_at` i, jeśli trzeba, `reliability`.

## 7. Zgodność z wymaganiami wyzwania

| Wymaganie | Jak spełniamy |
| --- | --- |
| Szczegółowe informacje (schody, progi, podjazdy, windy, szerokość, nawierzchnia, toaleta, odpoczynek) | panel „Szczegóły dostępności" |
| Wskazanie źródła, daty, wiarygodności | `source_label`, `source_url`, `updated_at`, `reliability` |
| Dane z dostępnych źródeł bez ręcznego utrzymywania bazy przez miasto | deklaracje obiektów + OSM + zgłoszenia użytkowników |
| Brak dostępu do systemów wewnętrznych UMK/MJO | wszystkie dane publiczne/otwarte |
| Niepełne/nieaktualne/niezweryfikowane wyraźnie odróżnione | osobne etykiety wiarygodności + „brak danych" |
| Nieprzedstawianie braku informacji jako dostępności | zasada nadrzędna z sekcji 1 |
