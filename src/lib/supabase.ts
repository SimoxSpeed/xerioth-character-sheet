import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error(
    'Configurazione Supabase mancante: copia .env.example in .env.local e inserisci VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.',
  )
}

export const supabase = createClient<Database>(url, key, {
  // PKCE: al ritorno da Google arriva un ?code= che il client scambia da solo per la sessione.
  auth: { flowType: 'pkce' },
})

/**
 * Lancia l'errore di Supabase (se presente) per farlo gestire da TanStack Query.
 * Senza errore, `data` è presente (select / .single()); per insert/update senza select vale null.
 */
export function unwrap<T>(result: { data: T | null; error: { message: string } | null }): NonNullable<T> {
  if (result.error) throw new Error(result.error.message)
  return result.data as NonNullable<T>
}
