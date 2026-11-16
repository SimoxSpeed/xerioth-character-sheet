/** Coppie di caratteri selezionabili dall'intestazione (caricati tutti da Google Fonts in index.html). */
export interface FontPreset {
  key: string
  label: string
  /** Titoli, nomi, numeri grandi. */
  display: string
  /** Testo, tabelle, campi. */
  body: string
  /** font-size-adjust: porta le minuscole dei caratteri piccoli all'altezza di quelli grandi. */
  adjust?: number
}

export const FONT_PRESETS: FontPreset[] = [
  { key: 'manuale', label: 'Manuale', display: "'Alegreya SC', Georgia, serif", body: "'Alegreya Sans', system-ui, sans-serif", adjust: 0.5 },
  { key: 'classico', label: 'Classico', display: "'Cinzel', Georgia, serif", body: "'Inter', system-ui, sans-serif" },
  { key: 'pergamena', label: 'Pergamena', display: "'Cormorant SC', Georgia, serif", body: "'EB Garamond', Georgia, serif", adjust: 0.47 },
  { key: 'grimorio', label: 'Grimorio', display: "'Uncial Antiqua', Georgia, serif", body: "'Spectral', Georgia, serif" },
  { key: 'nitido', label: 'Nitido', display: "'Marcellus SC', Georgia, serif", body: "'Source Sans 3', system-ui, sans-serif" },
]

export const DEFAULT_FONT = FONT_PRESETS[0]!.key
const STORAGE_KEY = 'xerioth-font'

export function readStoredFont(): string {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return FONT_PRESETS.some((f) => f.key === value) ? value! : DEFAULT_FONT
  } catch {
    return DEFAULT_FONT
  }
}

/** Applica i caratteri come variabili CSS (--font-display, --font-body) e ricorda la scelta. */
export function applyFont(key: string, remember = false) {
  const preset = FONT_PRESETS.find((f) => f.key === key) ?? FONT_PRESETS[0]!
  const root = document.documentElement.style
  root.setProperty('--font-display', preset.display)
  root.setProperty('--font-body', preset.body)
  root.setProperty('--font-adjust', preset.adjust ? String(preset.adjust) : 'none')
  if (remember) {
    try {
      localStorage.setItem(STORAGE_KEY, preset.key)
    } catch {
      // preferenza non salvabile: va bene lo stesso
    }
  }
}
