import { useState } from 'react'
import { FONT_PRESETS, applyFont, readStoredFont } from '../styles/fonts'
import { FontIcon } from './icons'
import styles from './FontPicker.module.less'

/** Scelta del carattere della scheda, nell'intestazione. */
export function FontPicker() {
  const [font, setFont] = useState(readStoredFont)

  return (
    <label className={styles.picker} title="Carattere">
      <FontIcon aria-hidden />
      <select
        className={styles.select}
        value={font}
        aria-label="Carattere"
        onChange={(e) => {
          setFont(e.target.value)
          applyFont(e.target.value, true)
        }}
      >
        {FONT_PRESETS.map((f) => (
          <option key={f.key} value={f.key} style={{ fontFamily: f.display }}>
            {f.label}
          </option>
        ))}
      </select>
    </label>
  )
}
