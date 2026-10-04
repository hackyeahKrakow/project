# Model biznesowy, komercjalizacja i skalowanie

Uzupełnienie zgłoszenia Kraków bez barier. Model biznesowy to 20% oceny wyzwania, dlatego opisujemy konkretne pakiety, koszty, podmiot odpowiedzialny i drogę skalowania.

## 1. Zasada

**Dla osób z niepełnosprawnością, studentów i mieszkańców aplikacja jest i pozostanie bezpłatna.** Płacą instytucje, obiekty i organizatorzy, którzy chcą dotrzeć do odbiorców i mieć uporządkowane dane o dostępności.

## 2. Strumienie przychodu

### A. Pakiety dla organizatorów wydarzeń (SaaS)

| Pakiet | Cena | Co zawiera |
| --- | --- | --- |
| **Iskra** | 10 zł/mc | 1 wydarzenie z AI, statystyki wyświetleń |
| **Płomień** | 99 zł/mc | do 10 wydarzeń z AI, statystyki (wyświetlenia, prawo/lewo/pominięte), wyróżnienie w talii i na mapie, opinie uczestników |
| **Ognisko** | 299 zł/mc | bez limitu wydarzeń z AI, mocniejsze wyróżnienie, demografia zainteresowań, priorytet wsparcia |
| **Uczelnie i koła studenckie** | 0 zł | pakiet darmowy — buduje podaż treści (koło zamachowe) |

### B. Profil dostępności obiektu (B2B — rdzeń monetyzacji tego wyzwania)

Dla hoteli, instytucji kultury, obiektów sportowych, zarządców nieruchomości i organizatorów wydarzeń:

| Usługa | Cena | Wartość dla klienta |
| --- | --- | --- |
| **Profil dostępności** (utrzymanie i potwierdzanie danych, aktualizacja, zgłoszenia) | 49 zł/mc za obiekt | Obiekt pokazuje sprawdzone dane o dostępności; mniej telefonów i niepewności; spełnia rosnące wymagania dostępności |
| **Weryfikacja na miejscu** (audyt jednego obiektu, checklista barier) | 299 zł jednorazowo | Rzetelne dane i etykieta „potwierdzone przez obiekt" |
| **Wpięcie do systemu rezerwacyjnego / API danych o dostępności** | od 199 zł/mc | Dane o dostępności trafiają tam, gdzie klient ich szuka (systemy rezerwacyjne, mapy, aplikacje turystyczne) |

### C. Biała etykieta i licencje

- **Dostawcy map i aplikacji turystycznych:** API danych o dostępności (abonament miesięczny wg wolumenu).
- **Inne miasta:** wdrożenie „paczki miasta" + wsparcie (jednorazowe wdrożenie + abonament utrzymaniowy).
- **Hotele i sieci:** biała etykieta mini-aplikacji „dostępność w okolicy".

## 3. Koszty utrzymania (start)

| Pozycja | Koszt miesięczny |
| --- | --- |
| Vercel (hosting frontend + backend) | ok. 90 zł (Pro, 20 USD) |
| Turso / SQLite w chmurze | 0–120 zł (plan darmowy → Scale) |
| Domena (`.com`/`.app`) | ok. 5 zł/mc (60 zł/rok) |
| Własna instancja MOTIS na danych ZTP (bramka przed komercją) | 80–160 zł (VPS) |
| Narzędzia (monitoring, e-mail, analityka) | 0–80 zł |
| **Razem na start** | **ok. 200–450 zł/mc** |

**Próg rentowności:** ok. **5–10 płacących organizatorów/obiektów** w pakietach Płomień/Ognisko pokrywa koszty utrzymania. Dalszy przychód finansuje rozwój.

## 4. Podmiot odpowiedzialny i wdrożenie

- **Produkt prowadzi zespół The Spoots** (docelowo spółka z o.o. albo fundacja — forma do wyboru przy komercjalizacji).
- **Wdrożenie miejskie:** możliwa współpraca z Gminą Miejską Kraków na zasadzie umowy powierzenia przetwarzania danych; rozwiązanie **nie wymaga dostępu do systemów wewnętrznych UMK/MJO** ani ręcznego prowadzenia bazy przez miasto.
- **Dane:** obiekty aktualizują swoje profile, użytkownicy zgłaszają nieścisłości, OSM uzupełnia resztę. Utrzymanie danych jest rozproszone i tanie.
- **Hosting poza UMK:** Vercel + Turso lub własny serwer; bezpieczeństwo (HTTPS, klucze poza repo) i RODO opisane w zgłoszeniu.

## 5. Wejście na rynek (kolejność)

1. **Kraków, pilotaż dostępności:** 20–30 obiektów z deklaracjami + OSM; jedna uczelnia i jedna instytucja kultury jako partner (np. biblioteka lub NCK).
2. **Darmowe pakiety dla uczelni i kół** — budowa podaży wydarzeń.
3. **Pierwsi płacący organizatorzy** i obiekty, gdy ruch organiczny rośnie.
4. **Kolejne miasta akademickie** (Warszawa, Wrocław, Poznań, Gdańsk) przez „paczkę miasta".
5. **Kanały B2B:** systemy rezerwacyjne, dostawcy map, hotele, uczelnie.

## 6. Skalowanie na inne miasta i sektory

- **Paczka miasta:** plik konfiguracyjny z granicami, dzielnicami, źródłem GTFS i listą kategorii. Dodanie miasta nie wymaga zmian w kodzie.
- **Skalowanie sektorowe:** ten sam mechanizm danych o dostępności działa dla bibliotek, muzeów, hoteli, szpitali, urzędów i obiektów sportowych.
- **Otwarte repozytorium (MIT)** obniża barierę wdrożenia przez inne podmioty i miasta.
- **Zgodność z OSM/Wheelmap** oznacza, że dane są wymienne i nie tworzymy zamkniętego silosu.

## 7. Dlaczego to się obroni biznesowo

- **Podwójna wartość:** z jednej strony zasięg (organizatorzy), z drugiej uporządkowane, wiarygodne dane o dostępności (obiekty i miasta) — dwa różne, uzupełniające się rynki.
- **Niski koszt utrzymania danych** dzięki modelowi rozproszonemu (obiekty + OSM + użytkownicy).
- **Rosnący popyt regulacyjny i społeczny** na rzetelną informację o dostępności.
- **Efekt sieci:** więcej wydarzeń → więcej studentów → więcej organizatorów → więcej danych → lepsze rekomendacje.
