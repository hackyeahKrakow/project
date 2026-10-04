# Ujawnienie AI, modeli, API, danych i bibliotek

Wymagane przez regulamin HackYeah. Dotyczy wszystkich trzech zadań (Kraków bez barier, SMART CITY, Artificial Intelligence). Stan na 4.10.2026.

Zespół **The Spoots** ponosi pełną odpowiedzialność za całość rozwiązania, także za elementy powstałe z pomocą AI. Wszystkie decyzje techniczne potrafimy wyjaśnić i obronić.

## 1. AI działające w produkcie (funkcje aplikacji)

| Model / API | Dostawca | Rola w aplikacji | Gdzie | Kontrola człowieka |
| --- | --- | --- | --- | --- |
| **Jev 1.13** (System One) | TypeSafe AI, przez OpenCode Zen (`POST /v1/systemone`, model `jev-1.13-free`) | Ranking do 10 kart w talii: model ocenia kandydatów na podstawie wcześniejszych swipe'ów i zwraca prawdopodobieństwa „tak" | Backend (`app/jev_client.py`, `app/recommender.py`) | Rekomendacje są wyjaśnione na karcie („Bo lubisz…"); przy awarii modelu backend zwraca losowych kandydatów, nie błąd |
| **Model czatu** `minimax-m2.5-free` | OpenCode Zen (`POST /v1/chat/completions`) | Autouzupełnianie formularza wydarzenia z tekstu posta organizatora (tytuł, data, adres, kategoria, cena, wielkość) | Backend (`app/event_parser.py`, endpoint `POST /events/parse`) | **Człowiek zatwierdza**: AI tylko proponuje; pola niepewne trafiają do `missing_fields` i są podświetlone „Sprawdź"; nic nie trafia na mapę bez publikacji przez organizatora. AI **nie zgaduje** dostępności dla osób z niepełnosprawnością |

Nazwa modelu autouzupełniania jest konfigurowalna przez `PARSE_MODEL` (domyślnie `minimax-m2.5-free`). Modele działają przez jedno API OpenCode Zen; nie uruchamiamy własnych modeli. Wywołania Jev można opcjonalnie śledzić w **LangSmith** (patrz sekcja 3) — to narzędzie obserwowalności, nie kolejny model AI; bez klucza `LANGSMITH_API_KEY` monitoring jest wyłączony.

Klucz API (`OPENCODE_API_KEY`) jest wyłącznie w `apps/backend/.env` (ignorowany przez git) i w zmiennych środowiskowych Vercela. Nigdy we frontendzie ani w repozytorium. Bez klucza aplikacja działa: rekomendacje są losowe, a autouzupełnianie pokazuje jawnie oznaczoną przykładową odpowiedź.

## 2. AI użyte do budowy projektu (poza produktem)

| Narzędzie | Do czego |
| --- | --- |
| **Claude (claude.ai)** | Research rynku, specyfikacja produktu, dokumentacja, brand |
| **Claude Code + spec-kit** | Wsparcie przy kodzie backendu (FastAPI, modele, endpointy) |
| **Claude Design** | Warianty makiet UI |
| **opencode + model `longcat-2.5-preview`** | Audyt dostępności WCAG 2.2 AA, przegląd kodu, przygotowanie materiałów zgłoszeniowych |
| **Canva** | Grafiki i szablony prezentacji |
| **Figma** | Makiety i prototypy UI |

Zgodnie z regulaminem nie podajemy historii promptów ani proporcji kodu wygenerowanego przez AI. Jury ocenia faktyczną pracę techniczną: architekturę, integracje, funkcje i zrozumienie systemu.

## 3. Zewnętrzne API, modele i dane

| Zasób | Dostawca | Zastosowanie | Licencja / warunki |
| --- | --- | --- | --- |
| OpenStreetMap | współtwórcy OSM | Dane miejsc, parkingi, geokodowanie | ODbL — podpis „© OpenStreetMap contributors" |
| OpenFreeMap | OpenFreeMap | Kafelki podkładu mapy (styl bez POI) | Otwarta, podpis dostawcy |
| Photon | Komoot (dane OSM) | Podpowiedzi adresu (`GET /geocode`) | Dane OSM (ODbL); przez backend, maks. 1 zapytanie/s, cache |
| ZTP Kraków: GTFS i GTFS-Realtime | Zarząd Transportu Publicznego w Krakowie | Najbliższe przystanki i utrudnienia (`GET /transit/near`) | Dane publiczne; podpis „ZTP Kraków" |
| gtfs-realtime-bindings | Google / open source | Odczyt komunikatów GTFS-Realtime | Apache 2.0 |
| Transitous (MOTIS) | Transitous | Planowanie trasy z niską podłogą (`GET /route`) | Darmowy dla użycia niekomercyjnego i open source; podpis „Trasy: Transitous" |
| Overpass API | OpenStreetMap | Parkingi i miejsca dla osób z niepełnosprawnością (`GET /parking/near`) | Dane OSM (ODbL) |
| Unsplash | Unsplash | Poglądowe zdjęcia w kartach | Licencja Unsplash (bez Unsplash+) |
| **Deklaracje dostępności obiektów** | TAURON Arena Kraków, ICE Kraków, Nowohuckie Centrum Kultury | Szczegółowe dane o barierach (Kraków bez barier) | Informacje publiczne obiektów; podane źródło i data |
| **LangSmith** | LangChain | Opcjonalny monitoring i śledzenie wywołań Jev (obserwowalność, nie model AI) | Klucz tylko w `.env`/zmiennych Vercela; bez klucza wyłączony |
| **Turso (libSQL)** | Turso | Produkcyjna baza danych (SQLite/libSQL) na Vercelu | Token tylko w `.env`/zmiennych Vercela |

## 4. Biblioteki i frameworki

MapLibre GL JS, Preline UI, Tailwind CSS, React, Vite, lucide-react, FastAPI, SQLModel/SQLAlchemy, gtfs-realtime-bindings. Licencje zgodne z licencją MIT repozytorium; pełny wykaz w `docs/LEGAL.md` i `README.md`.

## 5. Zasada jawności w produkcie

- Płatne wyróżnienie jest zawsze oznaczone „Promowane" (dyrektywa Omnibus).
- Rekomendacje tłumaczą się użytkownikowi („Bo lubisz…"), zgodnie z wymogami przejrzystości DSA.
- Informacje o dostępności mają źródło, datę i poziom wiarygodności; dane niepotwierdzone są wyraźnie odróżnione od potwierdzonych.
- AI nigdy nie jest jedynym decydentem: przy rekomendacjach działa wyjaśnialny ranking z zapasem losowym, a przy formularzu ostatnie słowo ma człowiek.
