import { Link, Outlet, useMatch } from 'react-router'
import { useAuth } from '../features/auth/AuthProvider'
import { FontPicker } from './FontPicker'
import { ThemeToggle } from './ThemeToggle'
import styles from './Layout.module.less'

export function Layout() {
  const { user, signOut } = useAuth()
  // La scheda personaggio occupa tutta la pagina.
  const isSheet = useMatch('/personaggi/:characterId') !== null
  const meta = user?.user_metadata as { display_name?: string; full_name?: string } | undefined
  const name = meta?.display_name || meta?.full_name || user?.email

  return (
    <div className={isSheet ? styles.shellFixed : styles.shell}>
      <header className={isSheet ? styles.topbarStatic : styles.topbar}>
        <Link to="/" className={styles.brand}>
          Xerioth
        </Link>
        <nav className={styles.nav}>
          <FontPicker />
          <ThemeToggle />
          <span className={styles.user}>{name}</span>
          <button className="btn btn--ghost btn--small" onClick={signOut}>
            Esci
          </button>
        </nav>
      </header>
      <main className={isSheet ? styles.contentWide : styles.content}>
        <Outlet />
      </main>
    </div>
  )
}
