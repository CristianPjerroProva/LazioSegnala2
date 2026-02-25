'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Layout from '../../components/Layout'

const RUOLI = ['richiedente', 'admin']

export default function UtentiPage() {
  const [profilo, setProfilo] = useState(null)
  const [utenti, setUtenti] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [utenteModifica, setUtenteModifica] = useState(null)
  const [formData, setFormData] = useState({ nome: '', cognome: '', ruolo: 'richiedente' })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()

  useEffect(() => { checkUser() }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data: prof } = await supabase.from('profili').select('*').eq('id', session.user.id).single()
    if (prof?.ruolo !== 'admin') { router.push('/home'); return }
    setProfilo(prof)
    await caricaUtenti()
  }

  async function caricaUtenti() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      const res = await fetch('/api/admin/utenti', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) setUtenti(data)
    } catch (err) {
      console.error('Errore nel caricamento utenti:', err)
    }
    setLoading(false)
  }

  function apriModale(utente) {
    setUtenteModifica(utente)
    setFormData({ nome: utente.nome || '', cognome: utente.cognome || '', ruolo: utente.ruolo })
    setModalOpen(true)
  }

  function chiudiModale() {
    setModalOpen(false)
    setUtenteModifica(null)
    setFormData({ nome: '', cognome: '', ruolo: 'richiedente' })
  }

  async function salvaModifiche() {
    if (!formData.nome || !formData.cognome) { alert('Nome e cognome sono obbligatori'); return }
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      const res = await fetch('/api/admin/utenti', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: utenteModifica.id,
          nome: formData.nome,
          cognome: formData.cognome,
          ruolo: formData.ruolo
        })
      })
      
      if (res.ok) {
        await caricaUtenti()
        chiudiModale()
      } else {
        alert('Errore nel salvataggio')
      }
    } catch (err) {
      console.error('Errore:', err)
      alert('Errore nel salvataggio')
    }
    setSaving(false)
  }

  const filtrati = utenti.filter(u =>
    u.nome?.toLowerCase().includes(search.toLowerCase()) ||
    u.cognome?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Caricamento…</span>
      </div>
    )
  }

  return (
    <Layout profilo={profilo}>
      <div style={{ padding: '32px 20px', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Hero */}
        <div className="page-hero fade-in">
          <div className="page-hero-eyebrow">Amministrazione</div>
          <div className="page-hero-title">Gestione Utenti</div>
          <div className="page-hero-sub">Visualizza e modifica le impostazioni degli utenti registrati</div>
        </div>

        {/* Ricerca */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'white',
            borderRadius: '8px',
            padding: '12px 16px',
            border: '2px solid #D6DAE2',
            marginBottom: '24px',
          }}
        >
          <span>🔍</span>
          <input
            placeholder="Cerca per nome, cognome o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '15px', fontFamily: 'inherit' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9AA6B2', fontSize: '16px' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Statistiche */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <div className="stat-card" style={{ borderTopColor: '#003087' }}>
            <div className="stat-number" style={{ color: '#003087' }}>{utenti.length}</div>
            <div className="stat-label">Totale Utenti</div>
          </div>
          <div className="stat-card" style={{ borderTopColor: '#5A6872' }}>
            <div className="stat-number" style={{ color: '#5A6872' }}>{utenti.filter(u => u.ruolo === 'richiedente').length}</div>
            <div className="stat-label">Richiedenti</div>
          </div>
          <div className="stat-card" style={{ borderTopColor: '#C97B00' }}>
            <div className="stat-number" style={{ color: '#C97B00' }}>{utenti.filter(u => u.ruolo === 'admin').length}</div>
            <div className="stat-label">Amministratori</div>
          </div>
        </div>

        {/* Tabella Utenti */}
        <div className="card" style={{ padding: '24px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #D6DAE2' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#5A6872', textTransform: 'uppercase' }}>Nome</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#5A6872', textTransform: 'uppercase' }}>Email</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#5A6872', textTransform: 'uppercase' }}>Ruolo</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#5A6872', textTransform: 'uppercase' }}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filtrati.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: '#9AA6B2' }}>
                    Nessun utente trovato
                  </td>
                </tr>
              ) : (
                filtrati.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #D6DAE2' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#17324D', fontWeight: '500' }}>
                      {u.nome} {u.cognome}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#5A6872' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: u.ruolo === 'admin' ? '#FEF3C7' : '#D1FAE5',
                          color: u.ruolo === 'admin' ? '#B45309' : '#047857',
                        }}
                      >
                        {u.ruolo === 'admin' ? 'Amministratore' : 'Richiedente'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => apriModale(u)}
                        style={{
                          padding: '6px 14px',
                          background: '#003087',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Modifica
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modale Modifica */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={chiudiModale}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '24px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#003087', marginBottom: '20px' }}>
              Modifica Utente
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#5A6872', marginBottom: '6px', textTransform: 'uppercase' }}>
                Nome *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', border: '2px solid #D6DAE2', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#5A6872', marginBottom: '6px', textTransform: 'uppercase' }}>
                Cognome *
              </label>
              <input
                type="text"
                value={formData.cognome}
                onChange={e => setFormData({ ...formData, cognome: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', border: '2px solid #D6DAE2', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#5A6872', marginBottom: '6px', textTransform: 'uppercase' }}>
                Ruolo
              </label>
              <select
                value={formData.ruolo}
                onChange={e => setFormData({ ...formData, ruolo: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', border: '2px solid #D6DAE2', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', background: 'white', boxSizing: 'border-box' }}
              >
                {RUOLI.map(r => (
                  <option key={r} value={r}>
                    {r === 'admin' ? 'Amministratore' : 'Richiedente'}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={chiudiModale}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'white',
                  color: '#17324D',
                  border: '2px solid #D6DAE2',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Annulla
              </button>
              <button
                onClick={salvaModifiche}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#003087',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Salvataggio...' : 'Salva Modifiche'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
