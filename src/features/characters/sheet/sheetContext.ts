// Contesti della scheda (fuori dai componenti per l'HMR): tiri.
// La scheda è sempre modificabile, come una scheda di carta con la matita in mano.
import { createContext, useContext, useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import type { RollTarget } from '../../dice/DiceRoller'

export interface RollRequest {
  /** undefined = tiro libero. */
  target?: RollTarget
  /** true = tira subito; false = apre le opzioni (dado fisico, tiro nascosto). */
  immediate: boolean
}

export const RollContext = createContext<(request: RollRequest) => void>(() => {})

export function useRoll() {
  return useContext(RollContext)
}

/** false sulla scheda di un altro (il Master non tira per i giocatori). */
export const CanRollContext = createContext(true)

export function useCanRoll() {
  return useContext(CanRollContext)
}

const LONG_PRESS_MS = 450

/**
 * Comandi di un elemento "tirabile": clic = tiro immediato,
 * pressione lunga o clic destro = opzioni del tiro.
 */
export function useRollTrigger(target: RollTarget | null) {
  const roll = useRoll()
  const canRoll = useCanRoll()
  const timer = useRef<number | null>(null)
  const longPressed = useRef(false)

  function clear() {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
  }

  if (!target || !canRoll) return {}

  return {
    onClick: (event: MouseEvent) => {
      event.stopPropagation()
      if (longPressed.current) {
        longPressed.current = false
        return
      }
      roll({ target, immediate: true })
    },
    onContextMenu: (event: MouseEvent) => {
      event.preventDefault()
      clear()
      if (longPressed.current) return
      roll({ target, immediate: false })
    },
    onPointerDown: (event: PointerEvent) => {
      // Ogni nuova pressione riparte da zero (anche col mouse dopo un tocco lungo)
      longPressed.current = false
      if (event.pointerType === 'mouse') return
      clear()
      timer.current = window.setTimeout(() => {
        longPressed.current = true
        roll({ target, immediate: false })
      }, LONG_PRESS_MS)
    },
    onKeyDown: (event: KeyboardEvent) => {
      if (event.target !== event.currentTarget) return
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        roll({ target, immediate: !event.shiftKey })
      }
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
  }
}
