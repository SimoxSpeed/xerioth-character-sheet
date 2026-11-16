import { Link, Outlet, useMatch } from 'react-router'
import { useAuth } from '../features/auth/AuthProvider'
import { FontPicker } from './FontPicker'
import { ThemeToggle } from './ThemeToggle'
import styles from './Layout.module.less'

export function Layout() {
  const { user, signOut } = useAuth()
  // La scheda personaggio occupa tutta la pagina.
  const isSheet = useMatch('/personaggi/:characterId') !== null
  const name = (user?.user_metadata?.display_name as string | undefined) || user?.email

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
