import { Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { LoginPage } from './features/auth/LoginPage'
import { InvitePage } from './features/campaigns/InvitePage'
import { NewCampaignPage } from './features/campaigns/NewCampaignPage'
import { RequireAuth } from './features/auth/RequireAuth'
import { HomePage } from './features/characters/HomePage'
import { NewCharacterPage } from './features/characters/NewCharacterPage'
import { CharacterSheetPage } from './features/characters/sheet/CharacterSheetPage'
import { PrivacyPage } from './features/legal/PrivacyPage'
import { MasterPanelPage } from './features/master/MasterPanelPage'

export function App() {
  return (
    <Routes>
      <Route path="/accesso" element={<LoginPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="campagne/nuova" element={<NewCampaignPage />} />
        <Route path="campagne/:campaignId/nuovo-personaggio" element={<NewCharacterPage />} />
        <Route path="invito/:inviteId" element={<InvitePage />} />
        <Route path="personaggi/:characterId" element={<CharacterSheetPage />} />
        <Route path="campagne/:campaignId/master" element={<MasterPanelPage />} />
        <Route path="*" element={<p className="muted">Pagina non trovata.</p>} />
      </Route>
    </Routes>
  )
}
