import { Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { LoginPage } from './features/auth/LoginPage'
import { RequireAuth } from './features/auth/RequireAuth'

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
        <Route path="*" element={<p className="muted">Pagina non trovata.</p>} />
      </Route>
    </Routes>
  )
}
