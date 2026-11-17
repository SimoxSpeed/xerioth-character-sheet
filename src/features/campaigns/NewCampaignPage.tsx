import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { BackIcon } from '../../components/icons'
import { useCreateCampaign } from './api'
import styles from './NewCampaignPage.module.less'

/** Nuova campagna: chi la crea ne diventa Master e va al pannello per invitare gli altri. */
export function NewCampaignPage() {
  const navigate = useNavigate()
  const create = useCreateCampaign()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const id = await create.mutateAsync({ name: name.trim(), description: description.trim() })
    navigate(`/campagne/${id}/master`)
  }

  return (
    <form className={styles.page} onSubmit={handleSubmit}>
      <header>
        <Link to="/" className="muted">
          <BackIcon aria-hidden /> Campagne
        </Link>
        <h1>Nuova campagna</h1>
      </header>

      <section className={`card ${styles.section}`}>
        <label className="field">
          <span>Nome</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </label>
        <label className="field">
          <span>Descrizione</span>
          <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        {create.error && <p className="error-box">{create.error.message}</p>}
        <div className={styles.actions}>
          <button className="btn btn--primary" type="submit" disabled={create.isPending || name.trim() === ''}>
            Crea campagna
          </button>
        </div>
      </section>
    </form>
  )
}
