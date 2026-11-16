import { Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { LoginPage } from './features/auth/LoginPage'
import { RequireAuth } from './features/auth/RequireAuth'
import { HomePage } from './features/characters/HomePage'
import { NewCharacterPage } from './features/characters/NewCharacterPage'

export function App() {
  return (
    <Routes>
      <Route path="/accesso" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="campagne/:campaignId/nuovo-personaggio" element={<NewCharacterPage />} />
        <Route path="*" element={<p className="muted">Pagina non trovata.</p>} />
      </Route>
    </Routes>
  )
}
