import type { CategoryId } from './categories.ts'

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

// media.krakow.travel photos stay hidden until KBF confirms their licence (docs/LEGAL.md); those events get a stock photo.
// No catalog card uses one any more (every card has its own Unsplash photo in image_url), this guards events added later.
const UNLICENSED = /^https?:\/\/media\.krakow\.travel\//

/** The event's own photo when it has one, else a stable stock photo by id: same event, same photo on every screen. */
export function photoUrl(ev: { id: string; category: CategoryId; image_url?: string | null }, width = 800) {
  if (ev.image_url && !UNLICENSED.test(ev.image_url)) return ev.image_url
  const list = PHOTOS[ev.category]
  const n = [...ev.id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 0)
  return `https://images.unsplash.com/${list[n % list.length]}?w=${width}&q=60&auto=format&fit=crop`
}
