import { Link } from 'react-router'
import { ThemeToggle } from '../../components/ThemeToggle'
import styles from './PrivacyPage.module.less'

// Pagina pubblica: Google la chiede per l'accesso con Google (Branding → privacy policy).
export function PrivacyPage() {
  return (
    <main className={styles.page}>
      <div className={styles.corner}>
        <ThemeToggle />
      </div>
      <article className={styles.panel}>
        <header>
          <h1>Privacy</h1>
          <p className="muted">Xerioth — schede dei personaggi · aggiornata il 17 novembre 2026</p>
        </header>

        <section>
          <h2>Cosa salva l'app</h2>
          <ul>
            <li>Email e nome visualizzato del tuo account. Se entri con Google, solo email e nome dell'account Google.</li>
            <li>Quello che scrivi nell'app: schede dei personaggi, tiri di dado, diario, domande al Master.</li>
          </ul>
        </section>

        <section>
          <h2>A cosa servono</h2>
          <p>Solo a far funzionare l'app: accesso, schede, condivisione con il Master e con il gruppo di gioco.</p>
        </section>

        <section>
          <h2>Chi li vede</h2>
          <ul>
            <li>Tu.</li>
            <li>Il Master della tua campagna.</li>
            <li>Il gruppo della campagna vede totale ed esito dei tuoi tiri, tranne quelli nascosti.</li>
          </ul>
        </section>

        <section>
          <h2>Dove stanno</h2>
          <p>
            Nel database Supabase (Unione Europea, Francoforte). Il sito è pubblicato su Cloudflare Pages. Nel browser restano
            solo la sessione di accesso e le preferenze (tema e carattere).
          </p>
        </section>

        <section>
          <h2>Cosa non fa</h2>
          <p>
            Niente pubblicità, niente tracciamento, niente cookie di profilazione. I dati non vengono venduti né ceduti a
            nessuno. I dati ricevuti da Google si usano solo per l'accesso, secondo le{' '}
            <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
              norme sui dati utente dei servizi API di Google
            </a>
            .
          </p>
        </section>

        <section>
          <h2>Cancellazione</h2>
          <p>Chiedi a chi gestisce il gruppo di gioco: account e dati vengono eliminati.</p>
        </section>

        <Link to="/" className={styles.back}>
          Torna all'app
        </Link>
      </article>
    </main>
  )
}
