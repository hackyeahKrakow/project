// Records the Kraków bez barier demo walkthrough from the running app.
//
// Usage:
//   BASE=https://spootted.dawidm.com OUT=./docs/submissions/krakow-bez-barier/raw node scripts/record-demo.mjs
//
// Requires Playwright: `npm i -D playwright && npx playwright install chromium`
// Produces WebM file(s) in OUT. Convert + burn subtitles (ffmpeg):
//   ffmpeg -i raw/*.webm -i spootted-krakow-bez-barier.srt \
//     -vf "scale=1920:1080,subtitles=spootted-krakow-bez-barier.srt:force_style='FontName=Outfit,FontSize=22,OutlineColour=&H80000000,BorderStyle=3'" \
//     -c:v libx264 -pix_fmt yuv420p -c:a aac spootted-krakow-bez-barier.mp4

import { chromium } from 'playwright'
import fs from 'node:fs'

const BASE = process.env.BASE || 'http://127.0.0.1:4173'
const OUT = process.env.OUT || './docs/submissions/krakow-bez-barier/raw'
fs.mkdirSync(OUT, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const profile = {
  interests: ['gry', 'muzyka', 'nauka'],
  sizes: ['small', 'medium'],
  goals: ['ludzie', 'zabawa'],
  budget: 'any',
  distanceKm: 0,
  times: [],
  district: 'Stare Miasto',
  stepFree: true,
}
const seed = {
  userId: '01930000-0000-7000-8000-000000000009',
  onboarded: true,
  consent: true,
  profile,
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

try {
  // 1. Welcome + accessibility options
  await page.goto(`${BASE}/#/start`)
  await sleep(2500)
  await page.getByText('Ułatwienia dostępu').click()
  await sleep(2500)

  // 2-3. Onboarding (4 steps) + consent
  await page.goto(`${BASE}/#/onboarding`)
  await sleep(3000)

  // 4. Swipe a few events
  await page.goto(`${BASE}/#/odkrywaj`)
  await sleep(2500)
  for (let i = 0; i < 3; i++) {
    const like = page.getByRole('button', { name: /Zapisz w Moje|Lubię|w prawo|♥/ }).first()
    if (await like.count()) await like.click()
    await sleep(1200)
  }

  // 5. Map + "Potwierdzone bez barier"
  await page.goto(`${BASE}/#/mapa`)
  await sleep(3000)
  await page.getByRole('button', { name: 'Wszystkie', exact: true }).click().catch(() => {})
  await sleep(1000)
  await page.getByRole('button', { name: 'Potwierdzone bez barier' }).click().catch(() => {})
  await sleep(2000)

  // 6. Accessible venue card + details
  const item = page.locator('aside button').filter({ hasText: 'Harlem Globetrotters' }).first()
  if (await item.count()) {
    await item.click()
    await sleep(1500)
    await page.getByText('Szczegóły dostępności').first().click().catch(() => {})
    await sleep(3000)
  }

  // 7. Unverified example (Klub Studio)
  await page.keyboard.press('Escape').catch(() => {})
  await sleep(500)

  // 8. Route planning
  await page.getByText('Zaplanuj dojazd').first().click().catch(() => {})
  await sleep(3000)

  // 9. Car / parking section
  await page.getByText(/Autem/).first().click().catch(() => {})
  await sleep(2500)

  // 10. Closing
  await page.goto(`${BASE}/#/start`)
  await sleep(3000)
} finally {
  await context.close()
  await browser.close()
  const videos = fs.readdirSync(OUT).filter((f) => f.endsWith('.webm'))
  console.log('recorded:', videos.join(', ') || '(none)')
}
