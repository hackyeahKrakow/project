// Run: npm run check — asserts the date/price logic the pages rely on.
import assert from 'node:assert/strict'
import { formatDate, formatPrice, inRange, warsawDay } from './src/data.js'
assert.equal(formatDate('2026-10-08T19:00:00+02:00'), 'czw., 8 paź, 19:00')
assert.equal(formatPrice(0), 'Za darmo')
assert.equal(formatPrice(15), '15 zł')
// 23:30 UTC is already the next day in Warsaw
assert.equal(warsawDay('2026-10-08T23:30:00Z'), '2026-10-09')
assert.ok(inRange('2026-10-08T10:00:00+02:00', 'dzis', '2026-10-08'))
assert.ok(!inRange('2026-10-09T10:00:00+02:00', 'dzis', '2026-10-08'))
assert.ok(inRange('2026-10-14T23:00:00+02:00', 'tydzien', '2026-10-08'))
assert.ok(!inRange('2026-10-15T10:00:00+02:00', 'tydzien', '2026-10-08'))
assert.ok(!inRange('2026-10-07T10:00:00+02:00', 'tydzien', '2026-10-08'))
console.log('data checks ok')
