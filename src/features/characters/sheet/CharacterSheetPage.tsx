import { useCallback, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { useCharacterSheet, type CharacterSheet } from '../api'
import { useIsMaster } from '../../campaigns/api'
import { useUser } from '../../auth/AuthProvider'
import { useCharacterThreads, useCharacterThreadsRealtime } from '../../threads/api'
import { useDiceRealtime } from '../../dice/api'
import { DiceRoller, FreeRoller } from '../../dice/DiceRoller'
import { Dialog } from '../../../components/Dialog'
import {
  AskIcon,
  DiceIcon,
  InventoryIcon,
  MoreIcon,
  PowersIcon,
  SkillsIcon,
  StoryIcon,
  TrainingIcon,
  type LucideIcon,
} from '../../../components/icons'
import { SheetHeader } from './SheetHeader'
import { AttributesBox, EquippedBox, UnlocksBox } from './SheetSidebar'
import { SkillsTab } from './skills/SkillsTab'
import { PowersTab } from './powers/PowersTab'
import { sheetPowerSections } from './sheetHelpers'
import { InventoryTab } from './inventory/InventoryTab'
import { JournalTab } from './journal/JournalTab'
import { QuestionsTab } from './questions/QuestionsTab'
import { DiceTab } from './dice/DiceTab'
import { TrainingTab } from './training/TrainingTab'
import { CanRollContext, IsOwnerContext, RollContext, type RollRequest } from './sheetContext'
import { openEdits, useMasterEdits, useMasterEditsRealtime, type EditFilter } from '../../masterEdits/api'
import { ReasonGateProvider } from '../../masterEdits/ReasonGateProvider'
import { useMediaQuery } from '../../../lib/useMediaQuery'

/** Tutte le modifiche segnalabili, per il badge di Domande. */
const ALL_EDITS: EditFilter[] = (['character', 'class', 'attribute', 'resource', 'skill', 'power', 'item', 'xp'] as const).map((type) => ({ type }))
import styles from './CharacterSheetPage.module.less'

type TabKey = 'capacita' | 'poteri' | 'inventario' | 'diario' | 'allenamenti' | 'domande' | 'tiri'

interface TabDef {
  key: TabKey
  label: string
  icon: LucideIcon
  badge: number | null
}

/** Linguette nella barra in basso su telefono; le altre stanno in "Altro". */
const PRIMARY_MOBILE: TabKey[] = ['capacita', 'poteri', 'inventario', 'diario']

/**
 * Scheda personaggio: intestazione con tutti i dati a vista, colonna delle
 * caratteristiche e sezioni a linguette. Su telefono la navigazione è in basso.
 */
export function CharacterSheetPage() {
  const { characterId = '' } = useParams()
  const { data: sheet, isPending, error } = useCharacterSheet(characterId)
  useCharacterThreadsRealtime(characterId)
  useMasterEditsRealtime(characterId)
  useDiceRealtime(sheet?.campaign_id)

  if (isPending) return <p className="muted">Caricamento scheda…</p>
  if (error) return <p className="error-box">Scheda non disponibile: {error.message}</p>
  return <Sheet sheet={sheet} />
}

function Sheet({ sheet }: { sheet: CharacterSheet }) {
  const [params, setParams] = useSearchParams()
  const user = useUser()
  const isMaster = useIsMaster(sheet.campaign_id)
  const { data: threads } = useCharacterThreads(sheet.id)
  const [rollRequest, setRollRequest] = useState<(RollRequest & { n: number }) | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)

  const roll = useCallback((request: RollRequest) => setRollRequest((r) => ({ ...request, n: (r?.n ?? 0) + 1 })), [])

  const { data: edits } = useMasterEdits(sheet.id)
  // Caratteristiche dentro la linguetta Capacità (schermi stretti)
  const attributesInSkills = useMediaQuery('(max-width: 1099px)')

  const isOwner = sheet.owner_id === user.id
  // Badge: al giocatore le risposte da leggere, al Master le domande in attesa.
  const pendingQuestions = (threads ?? []).filter((t) => t.status === (isOwner ? 'answered' : 'open')).length

  // Modifiche del Master con il segno ancora presente (le vede solo il giocatore)
  const marked = (filters: EditFilter[]) => (isOwner ? openEdits(edits, filters).length : 0)
  const count = (n: number) => (n > 0 ? n : null)
  const skillMarks = marked([{ type: 'skill' }, ...(attributesInSkills ? [{ type: 'attribute' as const }] : [])])
  const allMarks = marked(ALL_EDITS)

  // Una sezione per ogni tipo di potere concesso dalle classi ("Miracoli", "Incantesimi"…).
  const powerSections = sheetPowerSections(sheet)
  const tabs: TabDef[] = [
    { key: 'capacita', label: 'Capacità', icon: SkillsIcon, badge: count(skillMarks) },
    ...(powerSections.length > 0
      ? [
          {
            key: 'poteri' as const,
            label: powerSections.length === 1 ? powerSections[0]!.label : 'Poteri',
            icon: PowersIcon,
            badge: count(marked([{ type: 'power' }])),
          },
        ]
      : []),
    { key: 'inventario', label: 'Inventario', icon: InventoryIcon, badge: count(marked([{ type: 'item' }])) },
    { key: 'diario', label: 'Diario', icon: StoryIcon, badge: null },
    { key: 'allenamenti', label: 'Allenamenti', icon: TrainingIcon, badge: null },
    // Domande: risposte da leggere più modifiche del Master da vedere
    { key: 'domande', label: 'Domande', icon: AskIcon, badge: count(pendingQuestions + allMarks) },
    { key: 'tiri', label: 'Tiri', icon: DiceIcon, badge: null },
  ]
  const tab = tabs.find((t) => t.key === params.get('scheda'))?.key ?? 'capacita'
  const powerSection = powerSections.find((s) => s.kind === params.get('tipo')) ?? powerSections[0]

  function go(key: TabKey, extra: Record<string, string> = {}) {
    setParams({ scheda: key, ...extra }, { replace: true })
    setMoreOpen(false)
  }

  const mobileTabs = tabs.filter((t) => PRIMARY_MOBILE.includes(t.key))
  const otherTabs = tabs.filter((t) => !PRIMARY_MOBILE.includes(t.key))
  const otherActive = otherTabs.some((t) => t.key === tab)
  // "Altro" somma le linguette che contiene; Domande comprende già tutte le modifiche
  const otherBadge = otherTabs.reduce((n, t) => n + (t.badge ?? 0), 0)

  return (
    // Si tira solo sui propri personaggi: il Master non tira per i giocatori.
    // Sulla scheda di un giocatore ogni modifica del Master chiede la motivazione.
    <ReasonGateProvider characterId={sheet.id} enabled={isMaster && !isOwner}>
    <IsOwnerContext.Provider value={isOwner}>
    <CanRollContext.Provider value={isOwner}>
    <RollContext.Provider value={roll}>
        <div className={styles.sheet}>
          {isMaster && !isOwner && <p className={styles.masterNote}>Vista Master</p>}

          <SheetHeader sheet={sheet} />

          <div className={styles.body}>
            {/* Colonna sinistra: scorre per conto suo */}
            <aside className={styles.sidebar}>
              <AttributesBox sheet={sheet} />
              <div className={styles.notWide}>
                <UnlocksBox sheet={sheet} />
                <EquippedBox sheet={sheet} />
              </div>
            </aside>

            <section className={styles.main}>
              <nav className={styles.tabs} role="tablist" aria-label="Sezioni della scheda">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    role="tab"
                    aria-selected={tab === t.key}
                    className={tab === t.key ? styles.tabActive : styles.tab}
                    onClick={() => go(t.key)}
                  >
                    <t.icon aria-hidden />
                    {t.label}
                    {t.badge !== null && <span className={styles.badge}>{t.badge}</span>}
                  </button>
                ))}
              </nav>

              {/* Il pannello scorre per conto suo; cambiando linguetta riparte dall'alto */}
              <div role="tabpanel" className={styles.panel} key={`${tab}-${powerSection?.kind ?? ''}`}>
                {tab === 'capacita' && (
                  <>
                    {/* Su schermi stretti le caratteristiche stanno in cima alle capacità */}
                    <div className={styles.narrowOnly}>
                      <AttributesBox sheet={sheet} />
                      <UnlocksBox sheet={sheet} />
                    </div>
                    <SkillsTab sheet={sheet} />
                  </>
                )}
                {tab === 'poteri' && powerSection && (
                  <>
                    {powerSections.length > 1 && (
                      <div className={styles.segmented} role="group" aria-label="Tipo di potere">
                        {powerSections.map((s) => (
                          <button
                            key={s.kind}
                            type="button"
                            aria-pressed={s.kind === powerSection.kind}
                            className={s.kind === powerSection.kind ? styles.segmentActive : styles.segment}
                            onClick={() => go('poteri', { tipo: s.kind })}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <PowersTab key={powerSection.kind} sheet={sheet} section={powerSection} />
                  </>
                )}
                {tab === 'allenamenti' && <TrainingTab sheet={sheet} />}
                {tab === 'inventario' && <InventoryTab sheet={sheet} />}
                {tab === 'diario' && <JournalTab sheet={sheet} />}
                {tab === 'domande' && <QuestionsTab sheet={sheet} />}
                {tab === 'tiri' && <DiceTab sheet={sheet} />}
              </div>
            </section>

            {/* Schermi larghi: terza colonna con sbloccabili ed equipaggiamento */}
            <aside className={styles.aside}>
              <UnlocksBox sheet={sheet} />
              <EquippedBox sheet={sheet} />
            </aside>
          </div>

          {/* Dado per i tiri liberi (desktop) */}
          {isOwner && (
            <button type="button" className={styles.fab} onClick={() => roll({ immediate: false })} aria-label="Tiro libero" title="Tiro libero">
              <DiceIcon aria-hidden />
            </button>
          )}

          {/* Barra in basso (telefono), con il dado al centro */}
          <nav className={isOwner ? styles.bottomNav : `${styles.bottomNav} ${styles.bottomNavNoDice}`} data-bottom-nav aria-label="Sezioni della scheda">
            {mobileTabs.slice(0, 2).map((t) => (
              <NavButton key={t.key} tab={t} active={tab === t.key} onClick={() => go(t.key)} />
            ))}
            {isOwner && (
              <button type="button" className={styles.navDice} onClick={() => roll({ immediate: false })} aria-label="Tiro libero">
                <DiceIcon aria-hidden />
              </button>
            )}
            {mobileTabs.slice(2).map((t) => (
              <NavButton key={t.key} tab={t} active={tab === t.key} onClick={() => go(t.key)} />
            ))}
            <NavButton
              tab={{ key: 'tiri', label: 'Altro', icon: MoreIcon, badge: otherBadge > 0 ? otherBadge : null }}
              active={otherActive}
              onClick={() => setMoreOpen(true)}
            />
          </nav>

          <Dialog open={moreOpen} onClose={() => setMoreOpen(false)} title="Altro" width={360}>
            <div className={styles.moreList}>
              {otherTabs.map((t) => (
                <button key={t.key} type="button" className={tab === t.key ? styles.moreItemActive : styles.moreItem} onClick={() => go(t.key)}>
                  <t.icon aria-hidden />
                  {t.label}
                  {t.badge !== null && <span className={styles.badge}>{t.badge}</span>}
                </button>
              ))}
            </div>
          </Dialog>

          <Dialog
            open={rollRequest !== null}
            onClose={() => setRollRequest(null)}
            title={rollRequest?.target?.label ?? 'Tiro libero'}
            width={440}
          >
            {rollRequest &&
              (rollRequest.target ? (
                <DiceRoller key={rollRequest.n} sheet={sheet} target={rollRequest.target} autoRoll={rollRequest.immediate} />
              ) : (
                <FreeRoller key={rollRequest.n} sheet={sheet} />
              ))}
          </Dialog>
        </div>
    </RollContext.Provider>
    </CanRollContext.Provider>
    </IsOwnerContext.Provider>
    </ReasonGateProvider>
  )
}

function NavButton({ tab, active, onClick }: { tab: TabDef; active: boolean; onClick: () => void }) {
  return (
    <button type="button" className={active ? styles.navActive : styles.navItem} onClick={onClick} aria-current={active ? 'page' : undefined}>
      <span className={styles.navIcon}>
        <tab.icon aria-hidden />
        {tab.badge !== null && <span className={styles.navBadge}>{tab.badge}</span>}
      </span>
      <span className={styles.navLabel}>{tab.label}</span>
    </button>
  )
}
