'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Layout from '../components/Layout'

const STATUS = {
  inviata:    { label:'Inviata',         color:'#5A6872' },
  presa:      { label:'Presa in Carico', color:'#C97B00' },
  test:       { label:'In Test',         color:'#6B3FA0' },
  completato: { label:'Completato',      color:'#008a4b' },
}
const CATS = ['Bug', 'Miglioramento', 'Nuova funzione', 'Altro']

export default function DashboardPage() {
  const [profilo, setProfilo] = useState(null)
  const [richieste, setRichieste] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => { checkUser() }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data } = await supabase.from('profili').select('*').eq('id', session.user.id).single()
    if (data.ruolo !== 'admin') { router.push('/home'); return }
    setProfilo(data)
    const { data: reqs } = await supabase.from('richieste').select('*,profili(nome,cognome)').order('created_at', { ascending: false })
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

  const total = richieste.length
  const maxCat = Math.max(...CATS.map(c => richieste.filter(r=>r.categoria===c).length), 1)

  return (
    <Layout profilo={profilo}>
      <div style={{ padding: '32px 20px', maxWidth: '900px', margin: '0 auto' }}>
        {/* Hero */}
        <div className="page-hero fade-in">
          <div className="page-hero-eyebrow">Amministrazione</div>
          <div className="page-hero-title">Dashboard segnalazioni</div>
          <div className="page-hero-sub">Panoramica completa delle richieste ricevute</div>
        </div>

        {/* Statistiche */}
        <div className="sec-label">Statistiche</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2,1fr)',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <div className="stat-card" style={{ borderTopColor: '#003087' }}>
            <div className="stat-number" style={{ color: '#003087' }}>
              {total}
            </div>
            <div className="stat-label">Totale</div>
          </div>
          {Object.entries(STATUS).map(([k, s]) => (
            <div
              key={k}
              className="stat-card"
              style={{ borderTopColor: s.color }}
            >
              <div className="stat-number" style={{ color: s.color }}>
                {richieste.filter(r => r.stato === k).length}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Grafico categorie */}
        <div
          className="card"
          style={{ padding: '24px', marginBottom: '16px' }}
        >
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--blu-dark)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '16px',
            }}
          >
            Richieste per categoria
          </div>
          {CATS.map(c => {
            const n = richieste.filter(r=>r.categoria===c).length
            return (
              <div
                key={c}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: '#5A6872',
                    width: '120px',
                    textAlign: 'right',
                    flexShrink: 0,
                  }}
                >
                  {c}
                </div>
                <div
                  style={{
                    flex: 1,
                    background: '#F5F6F7',
                    borderRadius: '3px',
                    height: '22px',
                    overflow: 'hidden',
                    border: '1px solid #E8EAEC',
                  }}
                >
                  <div
                    style={{
                      width: `${(n / maxCat) * 100}%`,
                      height: '100%',
                      background: '#003087',
                      borderRadius: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: '8px',
                      transition: 'width .6s ease',
                    }}
                  >
                    {n > 0 && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: 'white',
                        }}
                      >
                        {n}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Richieste recenti */}
        <div className="card" style={{ padding: '24px' }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--blu-dark)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '16px',
            }}
          >
            Richieste recenti
          </div>
          {richieste.slice(0,8).map(r => {
            const st = STATUS[r.stato] || STATUS.inviata
            return (
              <div
                key={r.id}
                onClick={() => router.push(`/richieste/${r.id}`)}
                className="card-clickable"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid #D6DAE2',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: st.color,
                    flexShrink: 0,
                  }}
                />
                <div style={{flex:1, overflow:'hidden'}}>
                  <div style={{fontSize:'13px', fontWeight:'700', color:'#17324D', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{r.titolo}</div>
                  <div style={{fontSize:'11px', color:'#9AA6B2', marginTop:'2px'}}>{r.profili?.nome} {r.profili?.cognome} · {new Date(r.created_at).toLocaleDateString('it-IT')}</div>
                </div>
                <span style={{fontSize:'16px', color:'#9AA6B2'}}>›</span>
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}