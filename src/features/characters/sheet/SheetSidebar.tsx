import type { ReactNode } from 'react'
import { ATTRIBUTES, ATTRIBUTE_KEYS, type AttributeKey } from '../../../game/data/attributes'
import { SUPPORT_SKILLS } from '../../../game/data/training'
import { attributeModifier, attributeNextCost, availableUnlocks } from '../../../game/rules'
import { NumberField } from '../../../components/NumberField'
import { ArmorIcon, DiceIcon, InventoryIcon, WeaponIcon } from '../../../components/icons'
import { attributeValues, useUpdateAttribute, type CharacterSheet } from '../api'
import { AskMasterButton } from '../../threads/AskMasterButton'
import { useCanRoll, useRollTrigger } from './sheetContext'
import { NoRoll, ProgressLine } from './SheetBits'
import { ThreadDot } from './ThreadDot'
import styles from './SheetSidebar.module.less'

export function Box({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`${styles.box} ${className ?? ''}`}>
      <h2 className={styles.caption}>{title}</h2>
      {children}
    </section>
  )
}

export function AttributesBox({ sheet }: { sheet: CharacterSheet }) {
  return (
    <Box title="Caratteristiche">
      <div className={styles.attributes} role="list">
        {ATTRIBUTE_KEYS.map((key) => (
          <AttributeRow key={key} sheet={sheet} attribute={key} />
        ))}
      </div>
    </Box>
  )
}

/**
 * Riga di una caratteristica, sempre modificabile come sulla carta:
 * clic sul valore = lo modifichi, clic sui punti = aggiungi/togli, clic sul resto = tiro.
 */
function AttributeRow({ sheet, attribute }: { sheet: CharacterSheet; attribute: AttributeKey }) {
  const update = useUpdateAttribute(sheet.id)
  const row = sheet.character_attributes.find((a) => a.attribute === attribute)
  const value = row?.value ?? 10
  const advancement = row?.advancement ?? 0
  const modifier = attributeModifier(value)
  const nextCost = attributeNextCost(attribute, value)
  const def = ATTRIBUTES[attribute]
  const trigger = useRollTrigger({ label: def.label, attribute, level: null, attributeOnly: true })
  const canRoll = useCanRoll()

  return (
    <div
      className={canRoll ? `${styles.attribute} ${styles.rollable}` : styles.attribute}
      {...(canRoll && { role: 'button', tabIndex: 0, 'aria-label': `Tira ${def.label}` })}
      {...trigger}
    >
      {/* Gerarchia: nome, valore e modificatore in evidenza; avanzamento sottile sotto il nome */}
      <span className={styles.main}>
        <span className={styles.attributeName}>
          {def.label}
          <ThreadDot characterId={sheet.id} targetType="attribute" targetId={attribute} />
        </span>
        <ProgressLine
          name={def.label}
          value={advancement}
          max={nextCost}
          onChange={(v) => update.mutate({ attribute, advancement: v })}
        />
      </span>
      <DiceIcon aria-hidden className={styles.dice} />
      {/* Etichetta accanto al numero, niente colonne da tabella */}
      <span className={styles.pair}>
        <small>Val</small>
        <NoRoll>
          <NumberField
            className={styles.value}
            label={def.label}
            value={value}
            min={0}
            onCommit={(v) => update.mutate({ attribute, value: v ?? 0 })}
          />
        </NoRoll>
      </span>
      <span className={styles.pair}>
        <small>Mod</small>
        <span className={styles.modifier}>+{modifier}</span>
      </span>
      <NoRoll className={styles.ask}>
        <AskMasterButton
          characterId={sheet.id}
          ownerId={sheet.owner_id}
          targetType="attribute"
          targetId={attribute}
          defaultTitle={`Caratteristica: ${def.label}`}
        />
      </NoRoll>
    </div>
  )
}

export function UnlocksBox({ sheet }: { sheet: CharacterSheet }) {
  const values = attributeValues(sheet)
  const skillLevels = Object.fromEntries(sheet.character_skills.map((s) => [s.skill_key ?? '', s.level]))
  const unlocks = availableUnlocks({ characterLevel: sheet.level, attributes: values, skillLevels })
  if (unlocks.length === 0) return null
  return (
    <Box title="Sbloccabili">
      <ul className={styles.unlocks}>
        {unlocks.map((key) => (
          <li key={key}>
            {SUPPORT_SKILLS.find((s) => s.key === key)?.name ?? key} <small>liv. 1</small>
          </li>
        ))}
      </ul>
    </Box>
  )
}

export function EquippedBox({ sheet }: { sheet: CharacterSheet }) {
  const equipped = sheet.character_items.filter((i) => i.equipped)
  return (
    <Box title="Equipaggiato">
      {equipped.length === 0 ? (
        <p className={styles.empty}>—</p>
      ) : (
        <ul className={styles.equipped}>
          {equipped.map((item) => {
            const Icon = item.slot === 'armor' ? ArmorIcon : item.slot === 'weapon' ? WeaponIcon : InventoryIcon
            return (
              <li key={item.id} title={item.description || undefined}>
                <Icon aria-hidden className={styles.slotIcon} />
                <span className={styles.itemName}>{item.name}</span>
              </li>
            )
          })}
        </ul>
      )}
    </Box>
  )
}
