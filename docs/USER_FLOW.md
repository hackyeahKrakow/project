# Ścieżka użytkownika i demo

Ustalenia zespołu z 3.10.2026, ok. 17:30. Ten plik jest źródłem prawdy dla demo i nagrania. Persony i docelowy model kont są w [SPEC.md](SPEC.md).

## Na czym robimy demo

Demo pokazujemy w działającej aplikacji (PWA na telefonie), a nie na makiecie. Film nagrywamy jako zrzut ekranu z tej samej aplikacji.

Bez backendu, czyli jako ekran z danymi na sztywno, robimy tylko:
- logowanie (dwa konta demo);
- panel sponsora i statystyki.

Jury ocenia kompletność (10%), więc każdy ekran z filmu musi dać się kliknąć na żywo.

## Nawigacja (mobile, dolny pasek)

| Lewo | Środek | Prawo | Ostatni |
| --- | --- | --- | --- |
| **Mapa** | **Swipe** (ekran startowy) | **Kalendarz** (moje wydarzenia) | **Konto** (ustawienia, dostępność, zgody) |

- Środkowa ikona to talia kart lub płomień, a nie „+”. Znak „+” zostawiamy dla „Dodaj wydarzenie” u zalogowanych, żeby dwie różne akcje nie miały tej samej ikony.
- „Moje wydarzenia” i kalendarz to jeden ekran: agenda, przełącznik tydzień/miesiąc i eksport `.ics`. Synchronizacja z Google i Apple trafia do roadmapy, bo plik `.ics` obsługuje każdy kalendarz.
- Mapa jest osobnym ekranem, bo pokazuje też wydarzenia, których jeszcze nie było w talii. Polubione są na niej wyróżnione, a na tej samej mapie są też promowane piny (monetyzacja).

## 1. Ekran powitalny

- Jak najmniej tekstu, a w tle „dużo się dzieje”, np. piny spadające na mapę Krakowa.
- Licznik w stylu „dziś X wydarzeń w Krakowie” liczymy z prawdziwych danych demo. Liczb nie zmyślamy, bo jury może zapytać.
- Dwa przyciski:
  - **Tylko przeglądam:** użytkownik anonimowy, bez konta.
  - **Chcę tworzyć wydarzenia:** przechodzi do logowania lub rejestracji.

## 2. Anonimowy użytkownik

### Onboarding (profilowanie)

Kilka szybkich ekranów, każdy z jednym pytaniem:
1. Zainteresowania (3–5 kategorii).
2. Jakich wydarzeń szukam: poznać ludzi, rozwój, kultura, impreza.
3. Wielkość grupy: kameralne / duże / bez znaczenia.
4. Okolica: moja dzielnica plus to, jak daleko mogę dojechać (np. mieszkam na Hucie, ale dojadę na Ruczaj).
5. Zgody opcjonalne: lokalizacja i powiadomienia. Można je pominąć.

Ostatni ekran mówi: „Twój profil zostaje na tym telefonie. Wyczyścisz przeglądarkę albo zmienisz telefon, to zaczynasz od nowa. Nie mamy twojego maila ani numeru.” Pod spodem jest przycisk **„Rozumiem, zaczynam”**.

Zgoda to wyraźny przycisk, a nie „pierwszy swipe”. Prawo UE wymaga przy zgodzie jednoznacznego działania. Przycisk kosztuje jeden ekran i zamyka temat, zanim jury o niego zapyta.

### Swipe

Pobieranie kart (backend):
1. Start: 6 kart startowych na sztywno (`GET /card/new/{user_id}`, ten endpoint już działa).
2. Po onboardingu i 6 swipe'ach frontend wysyła odpowiedzi, a backend odsyła 15 kart dobranych pod profil.
3. Gdy w talii zostaje 5 kart, frontend w tle pobiera 10 kolejnych, więc talia wraca do 15.

Karta pokazuje:
- grafikę, tytuł, godzinę i cenę;
- odległość w km, jeśli użytkownik udostępnił lokalizację, a inaczej nazwę dzielnicy;
- powód rekomendacji „Bo lubisz…”.

W prawo wydarzenie trafia do kalendarza i świeci na mapie. W lewo wydarzenie odpada.

### Mapa i kalendarz

Zgodnie z sekcją „Nawigacja”.

## 3. Zalogowany: osoba prywatna (student)

Ma wszystko, co anonimowy użytkownik, plus **„+ Dodaj wydarzenie”**:
- Ręczny formularz: tytuł, data, miejsce, opis, kategorie, wielkość grupy, dla kogo.
- Pola kategorii i wielkości grupy są te same co w onboardingu, żeby dane wydarzenia pasowały do profili.
- Bez AI. Autouzupełnianie jest w pakiecie dla organizacji.

## 4. Zalogowany: organizacja (koło, instytucja, lokal)

- Osobne konto i osobne logowanie. Na hackathonie nie podpinamy profili firmowych pod konta prywatne, jak robi to Facebook (docelowo tak, zob. „Decyzja: profile organizacji” w [SPEC.md](SPEC.md)).
- Profil organizacji zawiera nazwę, logo, opis i listę wydarzeń.
- Rejestracja ma wybór „jako student” albo „jako organizacja”.
- W ustawieniach jest ekran **„Zostań sponsorem”**, opisany w punkcie 5.

### Konta demo

| Konto | Login | Co pokazuje |
| --- | --- | --- |
| Student | `ola@demo` | dodanie wydarzenia ręcznie |
| Organizacja | `kolo-robotyki@demo` | funkcje AI (autouzupełnianie), statystyki, pakiet sponsora |

Logowanie jest atrapą: dwa konta na sztywno, bez prawdziwej autoryzacji. Na slajdzie piszemy to wprost.

## 5. Model biznesowy: pakiety dla organizacji

Pakiety kosztują od 10 zł w górę, a im wyższy pakiet, tym więcej dostaje organizacja:

| | Pakiet 1 (od 10 zł) | Pakiet 2 | Pakiet 3 |
| --- | --- | --- | --- |
| Funkcje AI (autouzupełnianie) | 1 wydarzenie | kilka | bez limitu |
| Statystyki | wyświetlenia | + prawo / lewo / pominięte | + demografia zainteresowań |
| Wyróżnienie w talii i na mapie | – | tak | mocniejsze |
| Opinie po wydarzeniu | – | tak | tak |

Ustalenia do pakietów:
- **Nazwy pakietów:** nie używamy „Plus / Gold / Platinum”. To nazwy pakietów Tindera, a apka „jak Tinder” z tymi samymi nazwami to proszenie się o kłopot. Proponuję własne, np. „Iskra / Płomień / Ognisko”.
- **Statystyki:** „neutralne” liczymy jako wydarzenia, które ktoś zobaczył i zamknął aplikację bez swipe'a.
- **Opinie:** losowi uczestnicy po wydarzeniu dostają pop-up „oceń w kilku zdaniach”. Pop-up musi mieć „Pomiń”, bo wymuszone opinie to dark pattern, którego zakazuje DSA (art. 25).

**Dlaczego ktoś zapłaci:** plakat wisi w jednym miejscu, a my docieramy do studentów, którzy już interesują się tematem. Funkcje AI oszczędzają organizatorowi czas na każdym wydarzeniu.

**Wejście na rynek:**
1. Na start sami budujemy bazę wydarzeń.
2. Uczelniom i kołom dajemy pakiet za darmo.
3. Ruch organiczny ze społeczności przyciąga płacących organizatorów.

## Scenariusz filmu (60–90 s)

1. Ekran powitalny, „Tylko przeglądam”.
2. Onboarding: 3 szybkie ekrany i „Rozumiem, zaczynam”.
3. Kilka swipe'ów z widocznym „Bo lubisz…”.
4. Mapa z polubionymi wydarzeniami.
5. Kalendarz i eksport `.ics`.
6. Wylogowanie, logowanie jako `kolo-robotyki@demo`, wklejenie posta: funkcje AI wypełniają formularz i organizator zatwierdza.
7. Statystyki wydarzenia i ekran „Zostań sponsorem”.
