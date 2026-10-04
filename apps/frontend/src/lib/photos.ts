import type { CategoryId } from './categories.ts'
import { CARDS } from './events.ts'

// Free photos from Unsplash (Unsplash License: free to use, no attribution required; never Unsplash+).
// Hotlinked from images.unsplash.com as Unsplash asks. If one fails to load, Thumb falls back to the category color + icon.
const PHOTOS: Record<CategoryId, string[]> = {
  nauka: ['photo-1758270704384-9df36d94a29d', 'photo-1758270704286-83476deb3bd1', 'photo-1758270704262-ecc82b23dc37'],
  sport: ['photo-1781029102957-b54394481b37', 'photo-1783216509054-c69ca71b8f01', 'photo-1774050021155-f2c0fa1a9658'],
  muzyka: ['photo-1470229722913-7c0e2dbbafd3', 'photo-1429962714451-bb934ecdc4ec', 'photo-1514525253161-7a46d19cd819'],
  gry: ['photo-1629760946220-5693ee4c46ac', 'photo-1676651471150-0e3a5f8de05e', 'photo-1779899004113-94606876a7a5'],
  imprezy: ['photo-1516450360452-9312f5e86fc7', 'photo-1545128485-c400e7702796', 'photo-1713450605268-5f8ba67f5b55'],
  kultura: ['photo-1503095396549-807759245b35', 'photo-1571173069043-82a7a13cee9f', 'photo-1576544403918-c47d52572a9a'],
  warsztaty: ['photo-1519389950473-47ba0277781c', 'photo-1544928147-79a2dbc1f389', 'photo-1504384308090-c894fdcc538d'],
}

// Stock photos for the catalog cards without a usable photo of their own, all CC0 (StockSnap.io, WordPress Photo Directory), one per card:
// no two cards share a photo. Each category has at least as many as the catalog needs (checked in events.check.ts).
const STOCK: Record<CategoryId, string[]> = {
  nauka: [
    'https://cdn.stocksnap.io/img-thumbs/960w/4TDHSPIMJ6.jpg', // Library Books
    'https://cdn.stocksnap.io/img-thumbs/960w/HECYA5SP1L.jpg', // Open Books
    'https://cdn.stocksnap.io/img-thumbs/960w/EWT7K0DQLN.jpg', // People Student
    'https://cdn.stocksnap.io/img-thumbs/960w/DGF2LFZ6JJ.jpg', // Stacked Books
    'https://cdn.stocksnap.io/img-thumbs/960w/4B1IQUY1C3.jpg', // Architecture Building
    'https://pd.w.org/2026/08/8676a6e6e50648ef4.04305584-2048x1536.jpg', // A classroom with wooden desks, blue walls, and large windows letting in natural light.
    'https://pd.w.org/2026/07/5446a6a5967da5711.94382429-2048x1536.jpg', // Empty classroom with stacked desks and colorful wall murals.
    'https://pd.w.org/2026/01/9106978ad34114e48.66053482-2048x1536.jpeg', // A classroom featuring stone walls and a uniquely designed ceiling. The room is equipped with wooden desks and chairs arranged in rows.
    'https://pd.w.org/2026/07/6596a6a584fae3cc5.67234089-2048x1536.jpg', // Classroom with stacked desks and a colorful mural of the sun, globe, and airplane.
    'https://pd.w.org/2026/08/3986a6e6d65420ac6.79230986-2048x1536.jpg', // Classroom blackboard decorated with educational posters and student work under the Word francophonie
    'https://pd.w.org/2024/01/89165b92cfc3c30b7.86095690-2048x1536.jpg', // Empty college classroom with 10 rows of chairs on layered levels. Podium and projector showing computer desktop at the front of the class.
    'https://cdn.stocksnap.io/img-thumbs/960w/GQ1ZPF01BL.jpg', // Math Equation
    'https://cdn.stocksnap.io/img-thumbs/960w/KBTSP7FFIY.jpg', // Student School
  ],
  sport: [
    'https://cdn.stocksnap.io/img-thumbs/960w/YYH82Y0CS7.jpg', // Track Race
    'https://cdn.stocksnap.io/img-thumbs/960w/02A196D1B8.jpg', // Colorrun Rainbowrun
    'https://cdn.stocksnap.io/img-thumbs/960w/9F84030A1E.jpg', // Running Sprint
    'https://cdn.stocksnap.io/img-thumbs/960w/TTPC0MC6RF.jpg', // Running Track
    'https://cdn.stocksnap.io/img-thumbs/960w/X1T5YTO2MB.jpg', // People Men
    'https://cdn.stocksnap.io/img-thumbs/960w/XREEJO0CPH.jpg', // Basketball Ball
    'https://cdn.stocksnap.io/img-thumbs/960w/PF48OHZFI4.jpg', // Basketball Net
    'https://cdn.stocksnap.io/img-thumbs/960w/F24UWXBO1I.jpg', // Basketball Court
  ],
  muzyka: [
    'https://cdn.stocksnap.io/img-thumbs/960w/4LZRZTD1MC.jpg', // Concert Show
    'https://cdn.stocksnap.io/img-thumbs/960w/5FGWJW4Z5D.jpg', // Concert Show
    'https://cdn.stocksnap.io/img-thumbs/960w/L695JG265J.jpg', // Music Concert
    'https://cdn.stocksnap.io/img-thumbs/960w/4SRA1ZTKGU.jpg', // Concert Show
    'https://cdn.stocksnap.io/img-thumbs/960w/FZE048NY32.jpg', // Concert Show
    'https://cdn.stocksnap.io/img-thumbs/960w/5GPP7A6LVW.jpg', // Concert Stage
    'https://cdn.stocksnap.io/img-thumbs/960w/F66MXRQS1K.jpg', // Concert Singer
    'https://cdn.stocksnap.io/img-thumbs/960w/TRH6XJQVOT.jpg', // Stage Concert
    'https://cdn.stocksnap.io/img-thumbs/960w/2N1F7GGNYX.jpg', // Events Concert
    'https://cdn.stocksnap.io/img-thumbs/960w/J45DTZD2VJ.jpg', // Concert Singer
    'https://cdn.stocksnap.io/img-thumbs/960w/7OC4YX7S20.jpg', // Concert Singer
    'https://cdn.stocksnap.io/img-thumbs/960w/P7JJ4LKNK8.jpg', // Concert Stage
    'https://cdn.stocksnap.io/img-thumbs/960w/UCWLBKL1OL.jpg', // Music Guitar
    'https://cdn.stocksnap.io/img-thumbs/960w/DDLS80OTCE.jpg', // Piano Music
  ],
  gry: [
    'https://cdn.stocksnap.io/img-thumbs/960w/TXIMMZTQ7O.jpg', // Playing Game
    'https://cdn.stocksnap.io/img-thumbs/960w/QDNG1EOEU4.jpg', // Monopoly Boardgame
    'https://cdn.stocksnap.io/img-thumbs/960w/ITTLCAWYKW.jpg', // Word Letters
    'https://cdn.stocksnap.io/img-thumbs/960w/NUAITIXILP.jpg', // Chess Board
    'https://cdn.stocksnap.io/img-thumbs/960w/CYM76QR0MT.jpg', // Blackandwhite Board
    'https://cdn.stocksnap.io/img-thumbs/960w/GJRSR35DZ2.jpg', // Blackandwhite Board
    'https://cdn.stocksnap.io/img-thumbs/960w/6DDCC9ZELA.jpg', // Backgammon Boardgame
    'https://cdn.stocksnap.io/img-thumbs/960w/YU7ENGR6EK.jpg', // Video Games
    'https://cdn.stocksnap.io/img-thumbs/960w/UXVE8KR1TN.jpg', // Video Game
    'https://cdn.stocksnap.io/img-thumbs/960w/6MQCVSOWVZ.jpg', // Video Game
  ],
  imprezy: [
    'https://cdn.stocksnap.io/img-thumbs/960w/DNWA3H3LCU.jpg', // Balloons Party
    'https://cdn.stocksnap.io/img-thumbs/960w/AWAFB2ZLMS.jpg', // People Party
    'https://cdn.stocksnap.io/img-thumbs/960w/54M8Z4V4JG.jpg', // People Party
    'https://cdn.stocksnap.io/img-thumbs/960w/CA9Z0WT0NP.jpg', // Smoke Party
    'https://cdn.stocksnap.io/img-thumbs/960w/SRV2U52721.jpg', // Birthday Party
    'https://cdn.stocksnap.io/img-thumbs/960w/EIKPXSLYVW.jpg', // People Party
    'https://cdn.stocksnap.io/img-thumbs/960w/SQLBG32Q8C.jpg', // Pink Party
    'https://pd.w.org/2025/08/61168affe537fa920.01205555-1536x2048.jpg', // A birthday party scene is decorated with balloons in green, black, gold, and white. A “Happy Birthday” banner hangs over a shiny green and black streamer curtain.
    'https://cdn.stocksnap.io/img-thumbs/960w/79A4E09475.jpg', // Balloons People
  ],
  kultura: [
    'https://cdn.stocksnap.io/img-thumbs/960w/B1234F8746.jpg', // Teatrocolon Buenosaires
    'https://cdn.stocksnap.io/img-thumbs/960w/5ORW0DPIR5.jpg', // Music Notes
    'https://cdn.stocksnap.io/img-thumbs/960w/M46KG27B0X.jpg', // Theatre Show
    'https://cdn.stocksnap.io/img-thumbs/960w/NZWFVZYXU5.jpg', // People Girl
    'https://pd.w.org/2024/06/96466603e98a99495.95027958-2048x1365.jpg', // A person standing alone in front of a large, bright white screen, with their silhouette visible against the light background.
    'https://pd.w.org/2025/01/445678e17338b2d67.57518283-2048x1365.jpg', // An empty auditorium with rows of orange and red seats facing a stage. The stage has four chairs, a small table, and a podium, with a large projection screen above. The walls are covered with red curtains, and two cameras are set up in the seating area.
    'https://cdn.stocksnap.io/img-thumbs/960w/Z4SBGYA12R.jpg', // Thelouvre Paris
    'https://cdn.stocksnap.io/img-thumbs/960w/HFYMJGFU84.jpg', // Marble Statue
    'https://cdn.stocksnap.io/img-thumbs/960w/2GPG4GIYD8.jpg', // Marble Statue
    'https://cdn.stocksnap.io/img-thumbs/960w/603GFDTUCU.jpg', // Alone Solo
    'https://cdn.stocksnap.io/img-thumbs/960w/LYINBDMWER.jpg', // Blackandwhite Photos
    'https://cdn.stocksnap.io/img-thumbs/960w/606YAWY5OU.jpg', // People Man
    'https://cdn.stocksnap.io/img-thumbs/960w/O4ST1KJ9MD.jpg', // People Man
    'https://cdn.stocksnap.io/img-thumbs/960w/XCJOGUFV82.jpg', // Marble Statue
    'https://cdn.stocksnap.io/img-thumbs/960w/IBH8N85KZR.jpg', // Statue Art
    'https://pd.w.org/2022/01/57661e915c1521597.49893181-2048x1536.jpg', // Installation by Pipilotti Rist in the Louisiana Museum of Modern Art near Copenhagen
    'https://cdn.stocksnap.io/img-thumbs/960w/7B52AC0C5F.jpg', // Art Gallery
  ],
  warsztaty: [
    'https://cdn.stocksnap.io/img-thumbs/960w/KD30XPQR0A.jpg', // Tools Workshop
    'https://cdn.stocksnap.io/img-thumbs/960w/43JYGRS06H.jpg', // Workshop Industrialdesign
    'https://cdn.stocksnap.io/img-thumbs/960w/N3BPNPN0FY.jpg', // Floorplan Workshop
    'https://cdn.stocksnap.io/img-thumbs/960w/49FA273DDD.jpg', // Workshop Shed
    'https://cdn.stocksnap.io/img-thumbs/960w/YPM6VH3FCW.jpg', // Carpenter Workshop
    'https://cdn.stocksnap.io/img-thumbs/960w/TABKR0L6FY.jpg', // Workshop Iphone
    'https://cdn.stocksnap.io/img-thumbs/960w/O8DVPXYOIY.jpg', // Workshop Wrench
    'https://cdn.stocksnap.io/img-thumbs/960w/M07SV6AMBD.jpg', // Wrench Sockets
    'https://cdn.stocksnap.io/img-thumbs/960w/SWDR6XR7YS.jpg', // Ceramics Pottery
    'https://cdn.stocksnap.io/img-thumbs/960w/DJ7F99AVL7.jpg', // Guy Man
    'https://cdn.stocksnap.io/img-thumbs/960w/8SC8KCA0GN.jpg', // Still Items
    'https://cdn.stocksnap.io/img-thumbs/960w/UO4VC2M9HP.jpg', // Crafts Hobby
  ],
}

// media.krakow.travel photos stay hidden until KBF confirms their licence (docs/LEGAL.md); those events get a stock photo.
const UNLICENSED = /^https?:\/\/media\.krakow\.travel\//

const needsStock = (e: { image_url?: string | null }) => !e.image_url || UNLICENSED.test(e.image_url)

// The k-th catalog card without its own photo in a category gets the k-th photo of STOCK: unique, and the same on every screen.
const ASSIGNED = new Map<string, string>()
const taken: Partial<Record<CategoryId, number>> = {}
for (const e of CARDS) {
  if (!needsStock(e)) continue
  const n = taken[e.category] ?? 0
  taken[e.category] = n + 1
  if (STOCK[e.category][n]) ASSIGNED.set(e.id, STOCK[e.category][n])
}

/** The event's own photo when it has one, else its own stock photo (cards of the catalog) or a stable one by id (events added by users). */
export function photoUrl(ev: { id: string; category: CategoryId; image_url?: string | null }, width = 800) {
  if (ev.image_url && !UNLICENSED.test(ev.image_url)) return ev.image_url
  const own = ASSIGNED.get(ev.id)
  if (own) return own
  const list = PHOTOS[ev.category]
  const n = [...ev.id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 0)
  return `https://images.unsplash.com/${list[n % list.length]}?w=${width}&q=60&auto=format&fit=crop`
}
