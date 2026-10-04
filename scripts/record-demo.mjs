// Records the Kraków bez barier demo walkthrough from the running app, paced to the PL subtitles.
//
// Usage:
//   BASE=https://spootted.dawidm.com node scripts/record-demo.mjs
//
// Requires Playwright: `npm i -D playwright && npx playwright install chromium`
// Produces WebM in docs/submissions/krakow-bez-barier/raw. Convert + burn subtitles (ffmpeg):
//   ffmpeg -i raw/*.webm -i spootted-krakow-bez-barier.srt \
//     -vf "scale=1920:1080,subtitles=spootted-krakow-bez-barier.srt:force_style='FontName=Outfit,FontSize=22,OutlineColour=&H80000000,BorderStyle=3'" \
//     -c:v libx264 -pix_fmt yuv420p -c:a aac spootted-krakow-bez-barier.mp4

import { chromium } from 'playwright'
import fs from 'node:fs'

const BASE = process.env.BASE || 'http://127.0.0.1:4173'
const OUT = process.env.OUT || 'docs/submissions/krakow-bez-barier/raw'
fs.mkdirSync(OUT, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const t0 = Date.now()
const pace = async (sec) => {
  const dt = sec * 1000 - (Date.now() - t0)
  if (dt > 0) await sleep(dt)
}

const seed = {
  userId: '01930000-0000-7000-8000-000000000009',
  onboarded: true,
  consent: true,
  profile: { interests: ['gry', 'muzyka', 'nauka'], sizes: ['small', 'medium'], goals: ['ludzie', 'zabawa'], budget: 'any', distanceKm: 0, times: [], district: 'Stare Miasto', stepFree: true },
  swipes: {},
  follows: [],
  location: false,
  notifications: false,
  bigText: false,
  theme: 'light',
  highContrast: false,
  navCollapsed: false,
  account: null,
  myEvents: [],
}

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined })
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: OUT, size: { width: 1280, height: 720 } },
  colorScheme: 'light',
})
await context.addInitScript((s) => localStorage.setItem('spootted:v1', JSON.stringify(s)), seed)
const page = await context.newPage()
const click = (locator) => locator.click({ timeout: 6000 }).catch(() => {})

try {
  // 0:00–0:12 Welcome + accessibility options
  await page.goto(`${BASE}/#/start`)
  await sleep(1500)
  await click(page.getByText('Ułatwienia dostępu'))
  await pace(12)

  // 0:12–0:25 Onboarding
  await page.goto(`${BASE}/#/onboarding`)
  await pace(25)

  // 0:25–0:40 Consent
  await page.goto(`${BASE}/#/zgoda`)
  await pace(40)

  // 0:40–1:00 Swipe
  await page.goto(`${BASE}/#/odkrywaj`)
  await sleep(1800)
  await click(page.getByRole('button', { name: /Zapisz w Moje/ }).first())
  await sleep(2500)
  await click(page.getByRole('button', { name: /Zapisz w Moje/ }).first())
  await pace(60)

  // 1:00–1:18 Map + confirmed step-free
  await page.goto(`${BASE}/#/mapa`)
  await sleep(2200)
  await click(page.getByRole('button', { name: 'Wszystkie', exact: true }))
  await sleep(700)
  await click(page.getByRole('button', { name: 'Potwierdzone bez barier' }))
  await pace(78)

  // 1:18–1:45 Accessible venue card + details (TAURON Arena)
  const tauron = page.locator('aside button').filter({ hasText: 'Harlem Globetrotters' }).first()
  if (await tauron.count()) {
    await click(tauron)
    await sleep(1200)
    await click(page.getByText('Szczegóły dostępności').first())
  }
  await pace(105)

  // 1:45–2:00 Unverified example (Klub Studio)
  await page.keyboard.press('Escape').catch(() => {})
  await sleep(500)
  const studio = page.locator('aside button').filter({ hasText: 'Carpenter Brut' }).first()
  if (await studio.count()) {
    await click(studio)
    await sleep(1200)
    await click(page.getByText('Szczegóły dostępności').first())
  }
  await pace(120)

  // 2:00–2:25 Route planning
  await click(page.getByText('Zaplanuj dojazd').first())
  await pace(145)

  // 2:25–2:35 Car / parking
  await click(page.getByText(/Autem/).first())
  await pace(155)

  // 2:35–2:45 Closing
  await page.goto(`${BASE}/#/start`)
  await pace(166)
} finally {
  await context.close()
  await browser.close()
  const videos = fs.readdirSync(OUT).filter((f) => f.endsWith('.webm'))
  console.log('recorded:', videos.join(', ') || '(none)')
}
