import { Dumbbell, Gamepad2, GraduationCap, Music, PartyPopper, Theater, Wrench, type LucideIcon } from 'lucide-react'

// Temporary values (docs/DESIGN.md, task D1). Keep in sync with data/categories.json.
export type CategoryId = 'nauka' | 'sport' | 'muzyka' | 'gry' | 'imprezy' | 'kultura' | 'warsztaty'
export type Category = { id: CategoryId; name: string; short: string; color: string; Icon: LucideIcon }

export const CATEGORIES: Category[] = [
  { id: 'nauka', name: 'Nauka i koła naukowe', short: 'Nauka', color: '#2563EB', Icon: GraduationCap },
  { id: 'sport', name: 'Sport i ruch', short: 'Sport', color: '#DC2626', Icon: Dumbbell },
  { id: 'muzyka', name: 'Muzyka i sztuka', short: 'Muzyka', color: '#7C3AED', Icon: Music },
  { id: 'gry', name: 'Gry i planszówki', short: 'Gry', color: '#EA580C', Icon: Gamepad2 },
  { id: 'imprezy', name: 'Imprezy i integracja', short: 'Imprezy', color: '#DB2777', Icon: PartyPopper },
  { id: 'kultura', name: 'Kultura', short: 'Kultura', color: '#0D9488', Icon: Theater },
  { id: 'warsztaty', name: 'Warsztaty i rozwój', short: 'Warsztaty', color: '#CA8A04', Icon: Wrench },
]

export const category = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!
