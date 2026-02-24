'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Layout from '../components/Layout'

export default function HomePage() {
  const [profilo, setProfilo] = useState(null)
  const [richieste, setRichieste] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => { checkUser() }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data } = await supabase.from('profili').select('*').eq('id', session.user.id).single()
    setProfilo(data)
    let q = supabase.from('richieste').select('*').order('created_at', { ascending: false })
    if (data.ruolo !== 'admin') q = q.eq('user_id', data.id)
    const { data: reqs } = await q
    if (reqs) setRichieste(reqs)
    setLoading(false)
  }

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
      <div style={{ padding: '32px 20px', maxWidth: '900px', margin: '0 auto' }}>
        {/* Avviso Chiarimenti */}
        {richieste.filter(r => r.stato === 'chiarimenti' && r.user_id === profilo?.id).length > 0 && (
          <div onClick={() => { const req = richieste.find(r => r.stato === 'chiarimenti' && r.user_id === profilo?.id); if (req) router.push(`/richieste/${req.id}`); }} style={{background:'#FEF2F2', borderLeft:'4px solid #DC2626', borderRadius:'0 8px 8px 0', padding:'16px', marginBottom:'24px', fontSize:'14px', color:'#DC2626', cursor:'pointer', transition:'background 0.2s'}} onMouseEnter={e => e.currentTarget.style.background='#FEC5C5'} onMouseLeave={e => e.currentTarget.style.background='#FEF2F2'}>
            <strong style={{display:'block', marginBottom:'4px'}}>⚠️ Richieste in Chiarimenti</strong>
            Hai {richieste.filter(r => r.stato === 'chiarimenti' && r.user_id === profilo?.id).length} richiesta/e che richiedono chiarimenti. Clicca per visualizzare.
          </div>
        )}
        {/* Hero */}
        <div className="page-hero fade-in">
          <div className="page-hero-eyebrow">
            {profilo?.ruolo === 'admin' ? 'Pannello Amministratore' : 'Area personale'}
          </div>
          <div className="page-hero-title">Buongiorno, {profilo?.nome}!</div>
          <div className="page-hero-sub">
            Protezione Civile Regione Lazio — Portale segnalazioni
          </div>
        </div>

        {/* Statistiche */}
        <div className="sec-label">Riepilogo</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2,1fr)',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          {[
            { label:'Totale Richieste', value: richieste.length, color:'#003087' },
            { label:'Inviata', value: richieste.filter(r=>r.stato==='inviata').length, color:'#5A6872' },
            { label:'Presa in Carico', value: richieste.filter(r=>r.stato==='presa').length, color:'#C97B00' },            { label:'Chiarimenti Richiesti', value: richieste.filter(r=>r.stato==='chiarimenti').length, color:'#DC2626' },            { label:'Completato', value: richieste.filter(r=>r.stato==='completato').length, color:'#008a4b' },
          ].map((s, i) => (
            <div
              key={i}
              className="stat-card"
              style={{ borderTopColor: s.color }}
            >
              <div
                className="stat-number"
                style={{ color: s.color }}
              >
                {s.value}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Richieste recenti */}
        <div className="sec-label">Richieste recenti</div>
        {richieste.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '48px',
              color: 'var(--muted)',
            }}
          >
            Nessuna richiesta ancora
          </div>
        ) : richieste.slice(0,5).map(r => {
          const colors = { inviata:'#5A6872', presa:'#C97B00', test:'#6B3FA0', completato:'#008a4b' }
          const labels = { inviata:'Inviata', presa:'Presa in Carico', test:'In Test', completato:'Completato' }
          return (
            <div
              key={r.id}
              onClick={() => router.push(`/richieste/${r.id}`)}
              className="req-card card-clickable"
              style={{ borderLeftColor: colors[r.stato] || '#5A6872' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '6px',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '15px',
                    color: '#17324D',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {r.titolo}
                </div>
                <span
                  className={`badge badge-${r.stato || 'inviata'}`}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {labels[r.stato] || 'Inviata'}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#5A6872' }}>
                {r.categoria} · {new Date(r.created_at).toLocaleDateString('it-IT')}
              </div>
            </div>
          )
        })}

        {profilo?.ruolo === 'richiedente' && (
          <div style={{ marginTop: '16px' }}>
            <button
              onClick={() => router.push('/nuova-richiesta')}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              + Invia nuova richiesta
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}