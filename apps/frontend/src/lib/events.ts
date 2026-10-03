import type { CategoryId } from './categories'

export type Size = 'small' | 'medium' | 'large'
export type Organizer = { id: string; name: string; verified: boolean; kind: 'org' | 'student' }

// Fields event_name…price mirror the backend's CardFetchResponse; the rest has no API yet.
export type SpottedEvent = {
  id: string
  event_name: string
  description: string
  starts_at: string
  address: string
  lat: number
  lng: number
  price: number
  category: CategoryId
  size: Size
  district: string
  organizer: Organizer
  promoted?: boolean
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
const PRZEWODNICY = o('org_przew', 'Koło Przewodników (demo)')
const KASIA = o('usr_kasia', 'Kasia, studentka AGH', 'student')
const MIKOLAJ = o('usr_mikolaj', 'Mikołaj, student UJ', 'student')

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

// The six fixed starter cards come from the backend seed (GET /card/new/{user_id}); same ids, so swipes can be saved.
export const STARTER: SpottedEvent[] = [
  { id: '01a10200-0830-7370-ae21-2e47cc06805f', event_name: 'Studencki Nocny Market', description: 'Street food, muzyka na żywo i stoiska kół naukowych.', starts_at: '2026-11-14T18:00:00+01:00', address: 'Rynek Główny 1', lat: 50.0617, lng: 19.9373, price: 0, category: 'imprezy', size: 'large', district: 'Stare Miasto', organizer: SAMORZAD },
  { id: '01a10200-0831-797f-b50e-774683352488', event_name: 'Turniej gier planszowych', description: 'Open turniej dla początkujących i zaawansowanych, nagrody dla zwycięzców.', starts_at: '2026-11-15T16:00:00+01:00', address: 'ul. Reymonta 17', lat: 50.0647, lng: 19.9234, price: 10, category: 'gry', size: 'medium', district: 'Czarna Wieś (Miasteczko AGH)', organizer: PLANSZ },
  { id: '01a10200-0832-7c17-aa31-2be7e76e7a57', event_name: 'Hackathon dla początkujących', description: 'Całodniowe warsztaty programowania w zespołach z mentorami.', starts_at: '2026-11-20T09:00:00+01:00', address: 'ul. Podchorążych 2', lat: 50.0701, lng: 19.9026, price: 0, category: 'nauka', size: 'medium', district: 'Bronowice', organizer: DS },
  { id: '01a10200-0833-793b-baed-a7c26b03f790', event_name: 'Koncert w Rotundzie', description: 'Wieczór z lokalnymi zespołami studenckimi.', starts_at: '2026-11-21T19:30:00+01:00', address: 'ul. Oleandry 1', lat: 50.0603, lng: 19.9238, price: 25, category: 'muzyka', size: 'large', district: 'Krowodrza', organizer: AKORD },
  { id: '01a10200-0834-7591-8c3e-835ac248aba0', event_name: 'Spacer po Kazimierzu z przewodnikiem', description: 'Dwugodzinny spacer śladami historii dzielnicy, zniżki dla studentów.', starts_at: '2026-11-22T11:00:00+01:00', address: 'Plac Wolnica 1', lat: 50.0494, lng: 19.9455, price: 15, category: 'kultura', size: 'small', district: 'Kazimierz', organizer: PRZEWODNICY },
  { id: '01a10200-0835-7c78-8dba-f85e707ea49e', event_name: 'Wieczór kina studenckiego', description: 'Pokaz krótkich filmów studentów i dyskusja z reżyserami.', starts_at: '2026-11-27T20:00:00+01:00', address: 'ul. Św. Tomasza 11', lat: 50.0636, lng: 19.9411, price: 0, category: 'kultura', size: 'medium', district: 'Stare Miasto', organizer: DKF },
]
export const STARTER_IDS = new Set(STARTER.map((e) => e.id))

export const catalog = (today = new Date()): SpottedEvent[] => [
  ...ROWS.map(([id, event_name, category, days, time, address, district, lat, lng, price, size, organizer, description]) => ({
    id,
    event_name,
    description,
    starts_at: at(days, time, today),
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
  ...STARTER,
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
export const formatPrice = (price: number) => (price === 0 ? 'Za darmo' : `${price} zł`)
export const warsawDay = (iso: string) => dayFmt.format(new Date(iso))
export const todayYmd = () => warsawDay(new Date().toISOString())
export const daysFromToday = (iso: string, today = todayYmd()) => Math.round((Date.parse(warsawDay(iso)) - Date.parse(today)) / 86_400_000)

/** "dziś 19:00", "jutro 17:30" or "czw., 8 paź, 19:00". */
export function whenLabel(iso: string, today = todayYmd()) {
  const d = daysFromToday(iso, today)
  return d === 0 ? `dziś ${formatTime(iso)}` : d === 1 ? `jutro ${formatTime(iso)}` : formatDate(iso)
}

export type When = 'dzis' | 'tydzien' | 'wszystkie'

/** Today, the 7 days starting today, or anything not in the past, counted in Warsaw calendar days. */
export function inRange(startsAt: string, when: When, today = todayYmd()) {
  const diff = daysFromToday(startsAt, today)
  if (when === 'dzis') return diff === 0
  if (when === 'tydzien') return diff >= 0 && diff < 7
  return diff >= 0
}

/** Straight-line distance in km. */
export function km(a: [number, number], b: [number, number]) {
  const rad = Math.PI / 180
  const dLat = (b[0] - a[0]) * rad
  const dLng = (b[1] - a[1]) * rad * Math.cos(((a[0] + b[0]) / 2) * rad)
  return 6371 * Math.hypot(dLat, dLng)
}
