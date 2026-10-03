## Accessibility Audit: spootted (apps/frontend)
**Standard:** WCAG 2.1 AA | **Date:** 3.10.2026

Zakres: wszystkie 10 ekranów (powitanie, onboarding, Odkrywaj, Mapa, Moje, Konto, logowanie, Dodaj, Statystyki, Sponsor) w trzech szerokościach: telefon 390 px, tablet 820 px, laptop 1440 px.

Metoda:
- automatyczny skan axe-core (reguły `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `best-practice`) w Chromium przez Playwright;
- przejście samą klawiaturą;
- ręczne liczenie kontrastu;
- zawijanie treści przy 320 px (odpowiednik powiększenia 400% na laptopie).

Nie testowaliśmy prawdziwym czytnikiem ekranu (VoiceOver, NVDA): to zostaje do zrobienia ręcznie.

### Summary
**Issues found:** 16 | **Critical:** 0 | **Major:** 6 | **Minor:** 10

Wszystkie 16 problemów jest poprawionych w tym PR (punkt 16 zgłosił review Copilota). Po poprawkach axe zgłasza 0 naruszeń na 10 ekranach w 3 szerokościach. Otwarte uwagi są na końcu.

### Findings

#### Perceivable
| # | Issue | WCAG Criterion | Severity | Recommendation |
|---|-------|---------------|----------|----------------|
| 1 | Aktywny element nawigacji i znacznik ceny: tekst `#1D5CFF` na `#E6EEFF` ma 4,48:1 | 1.4.3 Contrast | 🟡 Major | ✅ Nowy token `brand-700` `#174BD9` (5,92:1) dla tekstu na jasnoniebieskim tle |
| 2 | Przełącznik w stanie „wyłączony”: tor `#E1EAFB` na białym ma ok. 1,2:1, stanu nie widać | 1.4.11 Non-text Contrast | 🟡 Major | ✅ Tor `#6B7A99` (4,31:1), włączony `#1D5CFF` |
| 3 | Ocena w opiniach tylko jako gwiazdki | 1.1.1 Non-text Content | 🟢 Minor | ✅ `role="img"` z etykietą „Ocena 4 na 5” i widoczne „4/5” |
| 4 | Płótno mapy ma angielską etykietę „Map”, kontrolki MapLibre po angielsku | 1.1.1, 3.1.2 | 🟢 Minor | ✅ Polskie etykiety (`locale`) i informacja, że te same wydarzenia są w liście |
| 5 | Karta wydarzenia ma `h3` zaraz po `h1` | 1.3.1 Info and Relationships | 🟢 Minor | ✅ `h2` |

#### Operable
| # | Issue | WCAG Criterion | Severity | Recommendation |
|---|-------|---------------|----------|----------------|
| 6 | Fokus prawie niewidoczny: bazowy styl shadcn daje szary obrys z 50% przezroczystością | 2.4.7 Focus Visible | 🟡 Major | ✅ Jeden globalny `:focus-visible`: 3 px `#1D5CFF` z odstępem 2 px |
| 7 | Panel wydarzenia (bottom sheet) otwierał się bez przeniesienia fokusu i nie oddawał go po zamknięciu | 2.4.3 Focus Order | 🟡 Major | ✅ Fokus idzie na „Zamknij”, Escape zamyka panel, fokus wraca do przycisku, który go otworzył |
| 8 | Swipe tylko gestem albo przyciskami, bez skrótów | 2.1.1 Keyboard | 🟢 Minor | ✅ Strzałki ← i → (przyciski ✕ i ♥ zostają) |
| 16 | Przezroczyste `<select>` (filtr kategorii na mapie, kategoria w formularzu) nie pokazywały fokusu, bo obrys rysuje się na niewidocznym elemencie | 2.4.7 Focus Visible | 🟡 Major | ✅ Obrys na widocznym rodzicu przez `has-focus-visible:` |
| 9 | Brak linku pomijającego nawigację | 2.4.1 Bypass Blocks | 🟢 Minor | ✅ „Przejdź do treści” jako pierwszy element na każdym ekranie |
| 10 | Piny na mapie mają 34 px | 2.5.5 Target Size | 🟢 Minor | ✅ Przycisk ma min. 44×44 px, kolorowe kółko w środku może być mniejsze |
| 11 | Ten sam tytuł karty przeglądarki na każdym ekranie | 2.4.2 Page Titled | 🟢 Minor | ✅ Tytuł ekranu, np. „Mapa · spootted” |

#### Understandable
| # | Issue | WCAG Criterion | Severity | Recommendation |
|---|-------|---------------|----------|----------------|
| 12 | Błąd logowania nie jest powiązany z polami | 3.3.1 Error Identification | 🟢 Minor | ✅ `aria-invalid` i `aria-describedby` wskazują komunikat z `role="alert"` |

#### Robust
| # | Issue | WCAG Criterion | Severity | Recommendation |
|---|-------|---------------|----------|----------------|
| 13 | Pasek kroków onboardingu: `aria-label` na `div` bez roli (czytnik go nie odczyta) | 4.1.2 Name, Role, Value | 🟡 Major | ✅ `role="progressbar"` z wartością i tekstem „Krok 2 z 4” |
| 14 | Przełączniki Agenda / Miesiąc i Logowanie / Rejestracja z `role="tab"` bez paneli | 4.1.2 Name, Role, Value | 🟢 Minor | ✅ Przyciski z `aria-pressed` w grupie z etykietą |
| 15 | Ogłoszenie nowej karty w regionie `aria-live`, który montował się od nowa z każdą kartą | 4.1.3 Status Messages | 🟢 Minor | ✅ Region na stałe w rodzicu: „Tytuł, data. Bo lubisz…” |

### Color Contrast Check
| Element | Foreground | Background | Ratio | Required | Pass? |
|---------|-----------|------------|-------|----------|-------|
| Tekst pomocniczy | `#4A5B7D` | `#F3F7FF` | 6,34:1 | 4.5:1 | ✅ |
| Licznik talii | `#4A5B7D` | `#E6EEFF` | 5,85:1 | 4.5:1 | ✅ |
| Aktywna nawigacja, cena | `#174BD9` | `#E6EEFF` | 5,92:1 | 4.5:1 | ✅ (było 4,48 ❌) |
| Linki | `#1D5CFF` | `#FFFFFF` | 5,21:1 | 4.5:1 | ✅ |
| Przycisk główny | `#FFFFFF` | `#1D5CFF` | 5,21:1 | 4.5:1 | ✅ |
| Przycisk Iskra (CTA) | `#0A1F44` | `#FF8A3D` | 6,93:1 | 4.5:1 | ✅ |
| „od studenta” | `#6B4EE6` | `#EEEBFF` | 4,66:1 | 4.5:1 | ✅ |
| Tekst na karcie swipe | `#E6EEFF` | `#0A1F44` | 13,96:1 | 4.5:1 | ✅ |
| Liczniki na powitaniu | `#7DB8FF` | `#0A1F44` | 7,87:1 | 4.5:1 | ✅ |
| Przełącznik wyłączony (UI) | `#6B7A99` | `#FFFFFF` | 4,31:1 | 3:1 | ✅ (było ok. 1,2 ❌) |
| Obramowanie chipów (UI) | `#D9E2F2` | `#FFFFFF` | 1,3:1 | 3:1 | ⚠️ Chip rozpoznajemy po tekście, a wybrany ma pełne wypełnienie `#0A1F44`. Patrz uwagi |

### Keyboard Navigation
| Element | Tab Order | Enter/Space | Escape | Arrow Keys |
|---------|-----------|-------------|--------|------------|
| „Przejdź do treści” | 1. na każdym ekranie | Fokus na `<main>` | – | – |
| Nawigacja (dół / bok) | Po linku pomijającym | Zmiana ekranu | – | – |
| Lista wydarzeń na mapie | Przed mapą (laptop) | Otwiera panel wydarzenia | – | – |
| Piny na mapie | Po filtrach | Otwiera panel wydarzenia | – | – |
| Panel wydarzenia | Fokus na „Zamknij” | Akcje w karcie | Zamyka, fokus wraca | – |
| Talia Odkrywaj | Przyciski ✕ i ♥ | Pomiń / polub | – | ← pomiń, → polub |
| Onboarding | Wstecz, Pomiń, odpowiedzi, Dalej | Wybór odpowiedzi | – | – |
| Formularze | Kolejność pól | Wysyłka | – | Natywne `select`, `date`, `time` |

### Screen Reader
| Element | Announced As | Issue |
|---------|-------------|-------|
| Logo | „spootted”, obraz | – |
| Pin | „Wieczór planszówek…, przycisk, (polubione)” i stan wciśnięcia | – |
| Mapa | „Mapa wydarzeń w Krakowie. Te same wydarzenia są dostępne jako lista.” | Treść mapy jest tylko w pinach i liście, co wystarcza |
| Nowa karta w talii | Region `polite`: „Turniej gier planszowych, niedz., 15 lis, 16:00. Bo lubisz…” | Do sprawdzenia na prawdziwym czytniku |
| Pasek kroków | „Postęp, Krok 2 z 4” | – |
| Pola „Sprawdź” po AI | Etykieta pola zawiera słowo „Sprawdź” | – |
| Statystyki (paski) | `role="img"`: „W prawo 512, w lewo 461, pominięte 267” | – |

### Priority Fixes
Poprawione w tym PR: punkty 1–16.

Panel wydarzenia jest celowo **niemodalny** (`role="dialog"` bez `aria-modal`): na laptopie leży obok mapy i listy, które dalej działają. Dlatego nie więzimy fokusu, tylko przenosimy go do panelu, zamykamy Escape i oddajemy fokus do przycisku, który panel otworzył.

Otwarte uwagi:
1. **Test na prawdziwym czytniku (VoiceOver na iPhonie, NVDA na Windows).** Dotyczy osób niewidomych. Sprawdźcie ogłaszanie kart w talii i panel wydarzenia.
2. **„Większy tekst” w Konto** powiększa tylko rozmiary w `rem`, a część tekstów ma rozmiary w `px`. Powiększenie przeglądarki działa (treść zawija się przy 320 px), więc to tylko wygoda. Docelowo zamienić `text-[15px]` itd. na `rem`.
3. **Obramowanie chipów (1,3:1).** Nie blokuje, bo chip ma tekst. Dla osób słabowidzących warto przyciemnić obramowanie do `#8DA0C2` lub ciemniejszego.

Jak powtórzyć skan: uruchom aplikację (`npm run dev`), wstrzyknij `axe-core` na każdym ekranie i uruchom `axe.run` z regułami jak wyżej.
