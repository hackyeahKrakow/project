import type { CategoryId } from './categories'
import ONEOFF from './events_oneoff.json' with { type: 'json' }

export type Size = 'small' | 'medium' | 'large'
export type Organizer = {
  id: string
  name: string
  verified: boolean
  kind: 'org' | 'student'
  persona?: CategoryId[] // a student's type (lib/persona.ts), shown only if they chose to publish it with the event
}

// Fields event_name…price mirror the backend's CardFetchResponse; the rest has no API yet.
export type SpottedEvent = {
  id: string
  event_name: string
  description: string
  starts_at: string
  ends_at?: string // multi-day events (exhibitions, fairs) span every day up to this one
  address: string
  lat: number
  lng: number
  price: number | null // null = unknown, 0 = free
  image_url?: string | null // the event's own photo; without it the card shows a stock photo (lib/photos.ts)
  category: CategoryId
  size: Size
  district: string
  organizer: Organizer
  promoted?: boolean
  wheelchair?: Wheelchair // overall wheelchair status; missing = unknown
  accessibility?: Accessibility // detailed barriers/facilities with source, date and reliability
}

// The same values as OpenStreetMap's wheelchair=* tag (and Wheelmap), so venue data can be taken from OSM later.
export type Wheelchair = 'yes' | 'limited' | 'no'
export const WHEELCHAIR_LABEL: Record<Wheelchair, string> = { yes: 'Bez barier', limited: 'Częściowo bez barier', no: 'Z barierami' }

// Detailed accessibility for people in wheelchairs (Cracow without barriers). Every value can be "unknown":
// the app shows what it knows and never treats a missing answer as "accessible" (docs/ACCESSIBILITY.md).
export type Tri = 'yes' | 'no' | 'unknown'
export type AccessSource = 'venue' | 'organizer' | 'osm' | 'users'
export type Reliability = 'confirmed' | 'reported' | 'unknown'
export type AccessField =
  | 'step_free_entry'
  | 'ramp'
  | 'lift'
  | 'threshold'
  | 'accessible_toilet'
  | 'disabled_parking'
  | 'rest_places'
  | 'induction_loop'
export type Surface = 'smooth' | 'cobble' | 'unknown'
export type Accessibility = {
  status: Wheelchair
  fields: Partial<Record<AccessField, Tri>>
  door_width_cm?: number
  surface?: Surface
  source: AccessSource
  source_label: string
  source_url?: string
  updated_at: string // ISO date the information was checked
  reliability: Reliability
  note?: string
}

export const TRI_LABEL: Record<Tri, string> = { yes: 'Tak', no: 'Nie', unknown: 'Brak danych' }
export const ACCESS_FIELD_LABEL: Record<AccessField, string> = {
  step_free_entry: 'Wejście bez schodów i progu',
  ramp: 'Podjazd lub pochylnia',
  lift: 'Winda',
  threshold: 'Progi',
  accessible_toilet: 'Toaleta dla osób z niepełnosprawnością',
  disabled_parking: 'Miejsce parkingowe dla osób z niepełnosprawnością',
  rest_places: 'Miejsca odpoczynku',
  induction_loop: 'Pętla indukcyjna',
}
export const SURFACE_LABEL: Record<Surface, string> = { smooth: 'Gładka', cobble: 'Kostka / nierówna', unknown: 'Brak danych' }
export const SOURCE_LABEL: Record<AccessSource, string> = {
  venue: 'Deklaracja obiektu',
  organizer: 'Organizator wydarzenia',
  osm: 'OpenStreetMap',
  users: 'Zgłoszenie użytkownika',
}
export const RELIABILITY_LABEL: Record<Reliability, string> = {
  confirmed: 'Potwierdzone przez obiekt',
  reported: 'Niepotwierdzone (zgłoszenie)',
  unknown: 'Wiarygodność nieznana',
}

export const SIZE_LABEL: Record<Size, string> = { small: 'kameralne', medium: 'średnie', large: 'duże' }

export const DISTRICTS: Record<string, [number, number]> = {
  'Stare Miasto': [50.0614, 19.9372],
  Kazimierz: [50.051, 19.945],
  Podgórze: [50.044, 19.953],
  Zabłocie: [50.048, 19.962],
  Grzegórzki: [50.058, 19.96],
  Krowodrza: [50.075, 19.92],
  'Czarna Wieś (Miasteczko AGH)': [50.068, 19.905],
  Bronowice: [50.081, 19.892],
  Ruczaj: [50.029, 19.905],
  'Nowa Huta': [50.072, 20.037],
}

const o = (id: string, name: string, kind: Organizer['kind'] = 'org', verified = kind === 'org'): Organizer => ({ id, name, verified, kind })
export const LIBRARY = o('org_lib', 'Biblioteka Miejska „Pod Kopcem” (demo)')
const PLANSZ = o('org_plansz', 'Klub Gier Planszowych (demo)')
const ROBOT = o('org_robot', 'Koło Naukowe Robotyki (demo)')
const SAMORZAD = o('org_samorzad', 'Samorząd Studentów (demo)')
const DS = o('org_ds', 'KN Data Science (demo)')
const AKORD = o('org_akord', 'Klub Muzyczny Akord (demo)')
const DKF = o('org_dkf', 'DKF Studencki (demo)')
const KARIER = o('org_karier', 'Biuro Karier (demo)')
const AZS = o('org_azs', 'Sekcja Biegowa AZS (demo)')
const TEATR = o('org_teatr', 'Teatr Studencki (demo)')
const EKO = o('org_eko', 'Koło Ekologiczne (demo)')
const ORGANIZER_TBD = o('org_tbd', 'Organizator nieznany (demo)', 'org', false)
const KASIA: Organizer = { ...o('usr_kasia', 'Kasia, studentka AGH', 'student'), persona: ['imprezy', 'gry'] }
const MIKOLAJ: Organizer = { ...o('usr_mikolaj', 'Mikołaj, student UJ', 'student'), persona: ['gry', 'warsztaty'] }

// Warsaw UTC offset for a given day, e.g. "+02:00" (CEST) or "+01:00" (CET).
const offsetFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Warsaw', timeZoneName: 'longOffset' })
const warsawOffset = (d: Date) => offsetFmt.formatToParts(d).find((p) => p.type === 'timeZoneName')!.value.slice(3) || '+00:00'

/** ISO time `days` from today at hh:mm Warsaw time, so the demo always has events "today". */
export function at(days: number, hhmm: string, today = new Date()) {
  const day = new Date(Date.parse(warsawDay(today.toISOString())) + days * 86_400_000).toISOString().slice(0, 10)
  return `${day}T${hhmm}:00${warsawOffset(new Date(`${day}T12:00:00Z`))}`
}

type Row = [id: string, name: string, cat: CategoryId, days: number, time: string, address: string, district: string, lat: number, lng: number, price: number, size: Size, org: Organizer, description: string]

const ROWS: Row[] = [
  ['evt_planszowki', 'Wieczór planszówek w Kawiarni Kości', 'gry', 0, '19:00', 'ul. Krupnicza 5', 'Stare Miasto', 50.0629, 19.9306, 0, 'small', PLANSZ, 'Stoliki po 4–6 osób, gry zapewnia klub. Wstęp wolny, kto chce, bierze coś do picia. Dobra okazja, żeby poznać ludzi z innych kierunków.'],
  ['evt_robotyka', 'Spotkanie otwarte koła robotyki', 'nauka', 0, '17:30', 'al. Mickiewicza 30', 'Czarna Wieś (Miasteczko AGH)', 50.0647, 19.9232, 0, 'medium', ROBOT, 'Pokaz robotów z zawodów, rozmowy z członkami koła i nabór na nowy rok. Nie trzeba mieć doświadczenia.'],
  ['evt_czytelnia', 'Cicha czytelnia do 23:00', 'nauka', 0, '16:00', 'ul. Józefińska 20', 'Podgórze', 50.0449, 19.9497, 0, 'medium', LIBRARY, 'W sesji czytelnia jest otwarta dłużej. Gniazdka przy każdym stoliku, herbata za darmo, cisza gwarantowana.'],
  ['evt_bieg', 'Wieczorne bieganie na Błoniach', 'sport', 0, '18:30', 'al. 3 Maja (wejście od Piastowskiej)', 'Krowodrza', 50.059, 19.915, 0, 'medium', AZS, 'Luźne tempo, pętla 5 km, każdy biegnie po swojemu. Zbiórka przy wejściu od ul. Piastowskiej.'],
  ['evt_jam', 'Jam session w piwnicy', 'muzyka', 0, '20:00', 'ul. Floriańska 3', 'Stare Miasto', 50.0624, 19.9396, 15, 'small', AKORD, 'Otwarta scena: przynieś instrument albo po prostu posłuchaj. Perkusja i wzmacniacze na miejscu.'],
  ['evt_akademik', 'Planszówki w akademiku (max 6 osób)', 'gry', 0, '20:00', 'ul. Budryka 4, pokój 312', 'Czarna Wieś (Miasteczko AGH)', 50.0699, 19.9058, 0, 'small', KASIA, 'Mam Wsiąść do Pociągu i Codenames. Szukam 3–4 osób, które chcą pograć i pogadać. Wpadaj!'],
  ['evt_cv', 'Warsztaty: CV i LinkedIn', 'warsztaty', 1, '16:00', 'ul. Reymonta 17', 'Czarna Wieś (Miasteczko AGH)', 50.0668, 19.9137, 0, 'medium', KARIER, 'Praktyczne warsztaty z rekruterami. Weź laptopa i swoje CV, poprawiamy na żywo.'],
  ['evt_integracja', 'Integracja pierwszoroku', 'imprezy', 1, '21:00', 'ul. Szewska 12', 'Stare Miasto', 50.0621, 19.9354, 15, 'large', SAMORZAD, 'Wieczór zapoznawczy dla pierwszego roku. Muzyka, gry i dużo nowych ludzi.'],
  ['evt_autor', 'Spotkanie autorskie: kryminał po krakowsku', 'kultura', 1, '18:00', 'ul. Józefińska 20', 'Podgórze', 50.0451, 19.9493, 0, 'medium', LIBRARY, 'Rozmowa z autorką kryminałów, których akcja dzieje się w Krakowie. Po spotkaniu podpisywanie książek.'],
  ['evt_joga', 'Joga na trawie w Parku Jordana', 'sport', 1, '08:00', 'Park Jordana, al. 3 Maja 11', 'Krowodrza', 50.0614, 19.9165, 0, 'small', AZS, 'Spokojna godzina jogi przed zajęciami. Weź matę albo koc.'],
  ['evt_dkf', 'DKF: kino koreańskie', 'kultura', 2, '19:00', 'ul. Karmelicka 18', 'Stare Miasto', 50.0651, 19.9311, 10, 'medium', DKF, 'Pokaz filmu i dyskusja po seansie. Bilety przy wejściu.'],
  ['evt_zrodla', 'Warsztaty: źródła do pracy dyplomowej', 'warsztaty', 2, '12:00', 'os. Centrum C 10', 'Nowa Huta', 50.0716, 20.0379, 0, 'small', LIBRARY, 'Jak szukać i cytować źródła, bazy danych dostępne za darmo dla studentów i menedżery bibliografii.'],
  ['evt_karaoke', 'Karaoke po polsku', 'imprezy', 2, '21:00', 'ul. Szeroka 2', 'Kazimierz', 50.0532, 19.9475, 0, 'medium', SAMORZAD, 'Polskie hity od lat 80. do dziś. Wstęp wolny, zapisy na scenę na miejscu.'],
  ['evt_ai_med', 'Wykład otwarty: AI w medycynie', 'nauka', 2, '17:00', 'ul. Kawiory 21', 'Czarna Wieś (Miasteczko AGH)', 50.0686, 19.9087, 0, 'large', DS, 'Jak modele językowe pomagają lekarzom i gdzie się mylą. Po wykładzie pytania z sali.'],
  ['evt_hack', 'Mini hackathon AI', 'nauka', 3, '09:00', 'ul. Kawiory 21', 'Czarna Wieś (Miasteczko AGH)', 50.0688, 19.9083, 0, 'medium', DS, '12 godzin, zespoły 2–4 osoby, mentorzy i pizza w cenie.'],
  ['evt_fifa', 'Turniej FIFA', 'gry', 3, '16:00', 'ul. Łojasiewicza 11', 'Ruczaj', 50.0298, 19.9056, 10, 'medium', SAMORZAD, 'Turniej 1 na 1, drabinka do 32 osób. Nagrody dla najlepszej trójki.'],
  ['evt_chor', 'Koncert chóru akademickiego', 'muzyka', 3, '19:00', 'ul. Gołębia 24', 'Stare Miasto', 50.0593, 19.9341, 0, 'large', AKORD, 'Jesienny koncert chóru. Wstęp wolny, wejściówki rozdawane od 18:30.'],
  ['evt_ksiazka', 'Klub książki: fantastyka', 'kultura', 3, '18:00', 'ul. Królewska 59', 'Krowodrza', 50.0735, 19.9135, 0, 'small', LIBRARY, 'Rozmawiamy o jednej powieści miesięcznie. Nie trzeba przeczytać całej, żeby przyjść.'],
  ['evt_rower', 'Rowerowy rajd na Kopiec Kościuszki', 'sport', 4, '10:00', 'Błonia, al. 3 Maja', 'Krowodrza', 50.0596, 19.9124, 0, 'medium', AZS, 'Spokojne tempo, około 15 km w obie strony. Rower miejski też da radę.'],
  ['evt_pchli', 'Pchli targ studencki', 'imprezy', 4, '11:00', 'ul. Lipowa 4', 'Zabłocie', 50.0478, 19.9608, 0, 'large', SAMORZAD, 'Książki, ubrania, sprzęt do akademika. Wymiana i sprzedaż za grosze.'],
  ['evt_ceramika', 'Warsztaty ceramiki', 'warsztaty', 4, '15:00', 'ul. Przemysłowa 12', 'Zabłocie', 50.0489, 19.9591, 40, 'small', o('org_glina', 'Pracownia Glina (demo)'), 'Lepimy kubki i miski. Materiały i wypalanie w cenie.'],
  ['evt_quiz', 'Quiz pubowy', 'gry', 5, '20:00', 'ul. Józefa 9', 'Kazimierz', 50.0507, 19.9442, 5, 'small', PLANSZ, 'Drużyny do 4 osób, pytania z wiedzy ogólnej i popkultury.'],
  ['evt_komiks', 'Wystawa komiksu „Kreska Krakowa”', 'kultura', 5, '10:00', 'ul. Józefińska 20', 'Podgórze', 50.0447, 19.9501, 0, 'medium', LIBRARY, 'Plansze krakowskich rysowników i rysowniczek. Wstęp wolny, wystawa do końca miesiąca.'],
  ['evt_siatka', 'Siatkówka plażowa w hali', 'sport', 5, '18:00', 'ul. Piastowska 26', 'Krowodrza', 50.0682, 19.9129, 0, 'small', AZS, 'Gramy dwójkami, poziom dowolny. Weź strój na zmianę.'],
  ['evt_disco', 'Silent disco na bulwarach', 'imprezy', 6, '20:00', 'Bulwar Czerwieński', 'Stare Miasto', 50.0525, 19.9355, 20, 'large', SAMORZAD, 'Trzy kanały muzyki w słuchawkach, Wawel w tle.'],
  ['evt_foto', 'Warsztaty fotografii mobilnej', 'warsztaty', 6, '14:00', 'ul. Limanowskiego 24', 'Podgórze', 50.0447, 19.9585, 0, 'small', o('org_foto', 'Koło Fotograficzne (demo)'), 'Kadr, światło i edycja w telefonie. Kończymy spacerem po Podgórzu.'],
  ['evt_poezja', 'Otwarty mikrofon: poezja', 'kultura', 6, '19:00', 'ul. Bożego Ciała 10', 'Kazimierz', 50.0515, 19.9431, 0, 'small', TEATR, 'Czytasz swoje albo cudze wiersze, 5 minut na osobę.'],
  ['evt_noc_bibl', 'Noc bibliotek: gry, quizy i ciche czytanie', 'kultura', 6, '20:00', 'ul. Józefińska 20', 'Podgórze', 50.045, 19.9505, 0, 'large', LIBRARY, 'Cała noc w bibliotece: escape room w magazynie, quiz o Krakowie, kącik z planszówkami i czytanie do rana.'],
  ['evt_targi', 'Targi pracy IT', 'warsztaty', 8, '10:00', 'ul. Lema 7', 'Grzegórzki', 50.0675, 19.9918, 0, 'large', KARIER, 'Ponad 40 firm, staże i praca na pół etatu. Weź CV.'],
  ['evt_jazz', 'Koncert jazzowy: student band', 'muzyka', 8, '20:00', 'ul. Sławkowska 14', 'Stare Miasto', 50.0638, 19.9383, 20, 'medium', AKORD, 'Standardy i własne kompozycje studenckiego kwintetu.'],
  ['evt_noc_gier', 'Noc gier w bibliotece', 'gry', 9, '18:00', 'ul. Królewska 59', 'Krowodrza', 50.0737, 19.9131, 0, 'medium', LIBRARY, 'Ponad 100 gier planszowych z biblioteki, instruktorzy przy stołach.'],
  ['evt_debata', 'Debata oksfordzka: miasto dla studentów', 'nauka', 9, '18:00', 'ul. Gołębia 24', 'Stare Miasto', 50.0595, 19.9338, 0, 'medium', SAMORZAD, 'Czy Kraków jest przyjazny studentom? Dwie drużyny, publiczność wybiera zwycięzców.'],
  ['evt_pierwsza', 'Kurs pierwszej pomocy', 'warsztaty', 10, '17:00', 'ul. Grzegórzecka 20', 'Grzegórzki', 50.0573, 19.9541, 0, 'small', o('org_med', 'Koło Ratownictwa (demo)'), 'Resuscytacja, AED i pozycja boczna. Certyfikat na koniec.'],
  ['evt_retro', 'Wieczór gier retro', 'gry', 10, '19:00', 'os. Centrum E 1', 'Nowa Huta', 50.0727, 20.0368, 0, 'small', MIKOLAJ, 'Pegasus, Amiga i pady. Przyjdź pograć w klasyki.'],
  ['evt_charytatywny', 'Bieg charytatywny 5 km', 'sport', 11, '10:00', 'Zalew Nowohucki', 'Nowa Huta', 50.0674, 20.0294, 20, 'large', AZS, 'Całe wpisowe idzie na schronisko dla zwierząt. Pakiet startowy z koszulką.'],
  ['evt_wisla', 'Sprzątanie Wisły z kołem eko', 'sport', 12, '11:00', 'Bulwar Kurlandzki', 'Grzegórzki', 50.0553, 19.9555, 0, 'medium', EKO, 'Rękawice i worki zapewniamy. Po akcji ognisko.'],
  ['evt_standup', 'Stand-up studencki', 'imprezy', 13, '20:00', 'ul. Bożego Ciała 10', 'Kazimierz', 50.0517, 19.9434, 25, 'medium', TEATR, 'Pięcioro debiutantów, każdy po 10 minut. Prowadzi zwycięzca zeszłej edycji.'],
]

// The backend catalog (GET /card/new, POST /card): same file and ids as data/events_oneoff.json, so swipes can be saved.
// It has no size, district or organizer: they get the default size, the nearest district and a neutral organizer.
// Detailed accessibility for the venues that publish an official accessibility statement (checked 3-4.10.2026).
// Venues we have no source for stay "unknown": the app does not guess (docs/LEGAL.md, docs/ACCESSIBILITY.md).
const VENUE_ACCESS: Record<string, Accessibility> = {
  'TAURON Arena': {
    status: 'yes',
    fields: {
      step_free_entry: 'yes',
      ramp: 'yes',
      lift: 'yes',
      threshold: 'unknown',
      accessible_toilet: 'yes',
      disabled_parking: 'yes',
      rest_places: 'unknown',
      induction_loop: 'unknown',
    },
    surface: 'smooth',
    source: 'venue',
    source_label: 'Deklaracja dostępności TAURON Arena Kraków',
    source_url: 'https://www.tauronarenakrakow.pl/dla-osob-z-niepelnosprawnosciami',
    updated_at: '2026-10-03',
    reliability: 'confirmed',
    note: '52 miejsca dla osób na wózkach na poziomie A (+ 52 dla opiekunów), winda dostosowana do wózków, bezpłatne miejsca parkingowe.',
  },
  'ICE Kraków': {
    status: 'yes',
    fields: {
      step_free_entry: 'yes',
      ramp: 'yes',
      lift: 'yes',
      threshold: 'no',
      accessible_toilet: 'yes',
      disabled_parking: 'yes',
      rest_places: 'unknown',
      induction_loop: 'no',
    },
    surface: 'smooth',
    source: 'venue',
    source_label: 'Deklaracja dostępności ICE Kraków',
    source_url: 'https://icekrakow.pl/deklaracja-dostepnosci',
    updated_at: '2026-10-03',
    reliability: 'confirmed',
    note: 'Drzwi bezprogowe i fotokomórka obok drzwi obrotowych, windy z parkingu do foyer, miejsca dla wózków w salach S1–S3.',
  },
  'Nowohuckie Centrum Kultury': {
    status: 'yes',
    fields: {
      step_free_entry: 'yes',
      ramp: 'yes',
      lift: 'yes',
      threshold: 'no',
      accessible_toilet: 'unknown',
      disabled_parking: 'yes',
      rest_places: 'unknown',
      induction_loop: 'yes',
    },
    surface: 'smooth',
    source: 'venue',
    source_label: 'Deklaracja dostępności Nowohuckiego Centrum Kultury',
    source_url: 'https://nck.krakow.pl/o-nck/deklaracja-dostepnosci',
    updated_at: '2026-10-03',
    reliability: 'confirmed',
    note: '8 miejsc parkingowych dla osób z niepełnosprawnością, winda w budynku A, dwa stopnie z pochylnią między budynkami A i C.',
  },
  // A user report we could not confirm: shown separately from official statements, never as a guarantee.
  'Klub Studio': {
    status: 'limited',
    fields: {
      step_free_entry: 'yes',
      ramp: 'unknown',
      lift: 'unknown',
      threshold: 'unknown',
      accessible_toilet: 'unknown',
      disabled_parking: 'unknown',
      rest_places: 'unknown',
      induction_loop: 'unknown',
    },
    source: 'users',
    source_label: 'Zgłoszenie użytkownika (niepotwierdzone)',
    updated_at: '2026-10-04',
    reliability: 'reported',
    note: 'Zgłoszenie niezweryfikowane: brak oficjalnej deklaracji obiektu. Dopytać organizatora przed wyjściem.',
  },
}
const venueAccess = (address: string) => Object.entries(VENUE_ACCESS).find(([venue]) => address.includes(venue))?.[1]
const nearest = (lat: number, lng: number) => Object.entries(DISTRICTS).sort(([, a], [, b]) => km(a, [lat, lng]) - km(b, [lat, lng]))[0][0]
export const CARDS: SpottedEvent[] = ONEOFF.map(({ ends_at, ...e }) => ({
  ...e,
  ...(ends_at && { ends_at }),
  category: e.category as CategoryId,
  size: 'medium',
  district: nearest(e.lat, e.lng),
  // Fictional demo events name their (fictional, "(demo)") student association; real ones have no organizer field.
  organizer: 'organizer' in e && e.organizer ? o(`org_${e.organizer}`, e.organizer) : ORGANIZER_TBD,
  ...(venueAccess(e.address) && { accessibility: venueAccess(e.address), wheelchair: venueAccess(e.address)!.status }),
}))
export const CARD_IDS = new Set(CARDS.map((e) => e.id))
// The first six are the fixed starter sequence served by GET /card/new/{user_id}.
export const STARTER = CARDS.slice(0, 6)

// End times as [days from today, hh:mm] for events that run longer than one evening.
const ENDS: Record<string, [number, string]> = {
  evt_komiks: [9, '18:00'],
  evt_targi: [9, '16:00'],
  evt_noc_bibl: [7, '06:00'],
  evt_hack: [3, '21:00'],
  evt_czytelnia: [0, '23:00'],
}

/** The events the app shows: only the 20 cards of the backend catalog. */
export const catalog = (): SpottedEvent[] => CARDS

/** The mock events above (ROWS) plus the 20 cards. Not shown in the app; kept for the demo screens and checks. */
export const demoCatalog = (today = new Date()): SpottedEvent[] => [
  ...ROWS.map(([id, event_name, category, days, time, address, district, lat, lng, price, size, organizer, description]) => ({
    id,
    event_name,
    description,
    starts_at: at(days, time, today),
    ...(ENDS[id] && { ends_at: at(ENDS[id][0], ENDS[id][1], today) }),
    address: `${address}, Kraków`,
    lat,
    lng,
    price,
    category,
    size,
    district,
    organizer,
    promoted: id === 'evt_noc_bibl',
  })),
  ...CARDS,
]

// Interface is Polish and times are in Europe/Warsaw, e.g. "czw., 8 paź, 19:00".
const dateFmt = new Intl.DateTimeFormat('pl-PL', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Warsaw',
})
const timeFmt = new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' })
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw' }) // yyyy-mm-dd
const longDayFmt = new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Warsaw' })

export const formatDate = (iso: string) => dateFmt.format(new Date(iso))
export const formatTime = (iso: string) => timeFmt.format(new Date(iso))
export const formatDay = (ymd: string) => longDayFmt.format(new Date(`${ymd}T12:00:00Z`))
export const formatPrice = (price: number | null) => (price === null ? 'Cena nieznana' : price === 0 ? 'Za darmo' : `${price} zł`)
export const warsawDay = (iso: string) => dayFmt.format(new Date(iso))
export const todayYmd = () => warsawDay(new Date().toISOString())
export const daysFromToday = (iso: string, today = todayYmd()) => Math.round((Date.parse(warsawDay(iso)) - Date.parse(today)) / 86_400_000)

/** "dziś 19:00", "jutro 17:30" or "czw., 8 paź, 19:00". */
export function whenLabel(iso: string, today = todayYmd()) {
  const d = daysFromToday(iso, today)
  return d === 0 ? `dziś ${formatTime(iso)}` : d === 1 ? `jutro ${formatTime(iso)}` : formatDate(iso)
}

export type When = 'dzis' | 'tydzien' | 'wszystkie'

/** Does the event run today, during the 7 days starting today, or at any point from today on (Warsaw calendar days)? */
export function inRange(ev: Pick<SpottedEvent, 'starts_at' | 'ends_at'>, when: When, today = todayYmd()) {
  const from = daysFromToday(ev.starts_at, today)
  const to = ev.ends_at ? daysFromToday(ev.ends_at, today) : from
  if (when === 'dzis') return from <= 0 && to >= 0
  if (when === 'tydzien') return from < 7 && to >= 0
  return to >= 0
}

/** Every Warsaw calendar day the event runs on (yyyy-mm-dd), only from `from` on when given (e.g. today). */
export function eventDays(ev: Pick<SpottedEvent, 'starts_at' | 'ends_at'>, from = '') {
  const start = Date.parse(warsawDay(ev.starts_at))
  const first = from ? Math.max(start, Date.parse(from)) : start
  const last = ev.ends_at ? Date.parse(warsawDay(ev.ends_at)) : start
  const days: string[] = []
  // ponytail: a year is a guard against a broken end date, not a product limit
  for (let t = first; t <= last && days.length < 366; t += 86_400_000) days.push(new Date(t).toISOString().slice(0, 10))
  return days
}

/** "czw., 8 paź, 19:00–23:00" or "pt., 9 paź, 20:00 – sob., 10 paź, 06:00". */
export function formatRange(ev: Pick<SpottedEvent, 'starts_at' | 'ends_at'>) {
  if (!ev.ends_at) return formatDate(ev.starts_at)
  return warsawDay(ev.starts_at) === warsawDay(ev.ends_at) ? `${formatDate(ev.starts_at)}–${formatTime(ev.ends_at)}` : `${formatDate(ev.starts_at)} – ${formatDate(ev.ends_at)}`
}

/** Straight-line distance in km. */
export function km(a: [number, number], b: [number, number]) {
  const rad = Math.PI / 180
  const dLat = (b[0] - a[0]) * rad
  const dLng = (b[1] - a[1]) * rad * Math.cos(((a[0] + b[0]) / 2) * rad)
  return 6371 * Math.hypot(dLat, dLng)
}
