# Pitch i zgłoszenie

## Model biznesowy

Aplikacja jest darmowa dla studentów i kół. Płacą instytucje i lokale, które chcą dotrzeć do studentów.

- **Uczelnie i jednostki uczelniane:** promocja wydarzeń, dni otwartych i konferencji. Argument: taniej i precyzyjniej niż reklama w tramwaju.
- **Lokale** (bary planszówkowe, kluby, kawiarnie): promowane miejsce na liście i w talii, zawsze oznaczone jako „Promowane”. Ranking organiczny zostaje uczciwy.
- **Sponsorzy** z ofertami studenckimi.

**Koło zamachowe:** pierwszaki instalują aplikację → koła mają publiczność i dodają wydarzenia → więcej treści przyciąga więcej studentów → uczelnie i lokale płacą za zasięg.

## 10 slajdów

1. Tytuł, zespół, jedno zdanie o rozwiązaniu.
2. Problem: rozproszona informacja + wyniki ankiety ([RESEARCH.md](RESEARCH.md)).
3. Persona Ola i jej pierwszy tydzień w Krakowie.
4. Rozwiązanie: mapa + swipe (zrzuty ekranu).
5. Demo lub GIF: swipe → wyróżnienie na mapie → karta wydarzenia.
6. Rola AI: autofill i kategoryzacja, człowiek zatwierdza.
7. Skąd dane: właściciele dodają, brak scrapingu, legalność.
8. Architektura i stack ([ARCHITECTURE.md](ARCHITECTURE.md)).
9. Model biznesowy, koło zamachowe, konkurencja i nasza różnica.
10. Roadmapa + ujawnienie użytych narzędzi AI i bibliotek ([LEGAL.md](LEGAL.md)).

## Kryteria oceny (Smart City)

| Kryterium | Waga | Jak odpowiadamy |
| --- | --- | --- |
| Idea & Innovation | 30% | Studenci + mikro-wydarzenia + swipe, czego nie ma GoJammin ani Karnet |
| Relation to Category | 20% | Obszary z zadania pokazane w aplikacji: dojazd komunikacją miejską i utrudnienia ZTP przy każdym wydarzeniu, filtr „Bez barier”, komunikacja instytucji miejskich (biblioteka) ze studentami, dane o popycie dla instytucji. Strategia Rozwoju Krakowa 2030 opiera się na koncepcji smart city |
| Practical Applicability / Usability | 20% | Onboarding do 30 s, bez rejestracji, działa w przeglądarce |
| Design | 20% | Czysta mapa, kolory i ikony kategorii, dopracowana karta |
| Completeness & Implementation Value | 10% | Działający przepływ end-to-end, realny model danych i biznesu |

## Smart City w demo: jedna konkretna sytuacja

Zadanie prosi, żeby pokazać pomysł na konkretnej sytuacji i wskazać, kto na nim zyskuje. Na slajdach 3–5 i w nagraniu opowiadamy jedną historię:

1. **Ola** (1. rok AGH) w 30 sekund ustawia profil i swipe'uje prawdziwe wydarzenia z Krakowa. W prawo idzie koncert w Klubie Studio.
2. **Karta wydarzenia:** najbliższy tramwaj i autobus z otwartych danych ZTP, a jeśli przystanek jest nieczynny, ostrzeżenie „Utrudnienia w pobliżu”. „Dojazd” od razu otwiera trasę komunikacją miejską. To obszary z zadania: planowanie podróży i reagowanie na utrudnienia.
3. **Filtr „Bez barier”** na mapie pokazuje wydarzenia w miejscach dostępnych dla osób na wózku: 11 z 20 wydarzeń (TAURON Arena, ICE Kraków, Nowohuckie Centrum Kultury), na podstawie deklaracji dostępności i stron tych miejsc. Nowe wydarzenia oznacza organizator. Wartości są takie same jak w tagu `wheelchair` w OpenStreetMap, więc dane o miejscach można później brać z OSM i Wheelmap. Obszar z zadania: dostępność przestrzeni dla osób o różnych potrzebach.
4. **Biblioteka** (instytucja miejska) w Statystykach widzi zbiorcze i anonimowe swipe'y oraz opinię „Wreszcie miejsce do nauki wieczorem”. To dane, na których może oprzeć decyzję o dłuższych godzinach otwarcia. Obszary z zadania: komunikacja z mieszkańcami i dane miejskie wspierające decyzje.

Kto zyskuje: student (wie, co i jak dojechać), instytucja miejska (dociera do studentów i wie, czego chcą), miasto (lepiej wykorzystane przestrzenie publiczne). Testowalność w realnych warunkach: dane ZTP są prawdziwe i aktualne, a pilotaż wystarczy zrobić z jedną biblioteką i jednym kołem.

## Wymagania zgłoszenia (Challenge Rocket)

- [ ] Tytuł projektu
- [ ] Nazwa zespołu
- [ ] Członkowie zespołu
- [ ] Opis projektu
- [ ] Prezentacja PDF, maks. 10 slajdów
- [ ] Ujawnienie narzędzi AI, API, bibliotek i danych
- [ ] Opcjonalnie: repozytorium, link do demo, zrzuty ekranu, grafiki

Zgłoszenie po polsku albo angielsku.
