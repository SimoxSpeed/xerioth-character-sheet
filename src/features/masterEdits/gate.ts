// Motivazione delle modifiche del Master (fuori dai componenti per l'HMR).
// Ogni salvataggio sulla scheda passa dal "cancello": sulla scheda di un giocatore il Master
// scrive la motivazione (facoltativa) prima che la modifica parta; altrove passa subito.
import { createContext, useContext } from 'react'
import type { EditFilter } from './api'

/** Il Master ha annullato il salvataggio dalla finestra della motivazione. */
export class EditCancelled extends Error {
  constructor() {
    super('Modifica annullata')
    this.name = 'EditCancelled'
  }
}

export function isEditCancelled(error: unknown): boolean {
  return error instanceof EditCancelled
}

/** Errore da mostrare: un salvataggio annullato non è un errore. */
export function visibleError(error: Error | null): Error | null {
  return error && !isEditCancelled(error) ? error : null
}

/** Attende il salvataggio: false se il Master l'ha annullato, gli altri errori passano. */
export async function saved(promise: Promise<unknown>): Promise<boolean> {
  try {
    await promise
    return true
  } catch (error) {
    if (isEditCancelled(error)) return false
    throw error
  }
}

/** Un valore che cambia, mostrato al Master mentre scrive la motivazione. */
export interface EditPreview {
  /** Elemento ("Corrosione", "Costituzione"); vuoto per i dati del personaggio. */
  target: string
  /** Campo ("Livello", "Danni") o azione ("Aggiunto", "Eliminato"). */
  field: string
  before: string | null
  after: string | null
}

export interface EditPrompt {
  /** Cosa si modifica, per riproporre la motivazione di una modifica ancora segnalata. */
  filters: readonly EditFilter[]
  /** Prima → dopo; vuoto = nessun valore cambia davvero, non si chiede niente. */
  changes: EditPreview[]
}

/**
 * Chiede la motivazione per una modifica.
 * Restituisce la motivazione (null = nessuna) o lancia `EditCancelled`.
 */
export type ReasonGate = (prompt: EditPrompt) => Promise<string | null>

export const ReasonGateContext = createContext<ReasonGate>(() => Promise.resolve(null))

export function useReasonGate() {
  return useContext(ReasonGateContext)
}

/** Base64 di UTF-8: le intestazioni HTTP non accettano lettere accentate. */
function encodeReason(reason: string): string {
  let binary = ''
  for (const byte of new TextEncoder().encode(reason)) binary += String.fromCharCode(byte)
  return btoa(binary)
}

/** Allega la motivazione alla richiesta; la legge il trigger che registra la modifica. */
export function withReason<T extends { setHeader(name: string, value: string): T }>(builder: T, reason: string | null): T {
  return reason ? builder.setHeader('x-edit-reason', encodeReason(reason)) : builder
}
