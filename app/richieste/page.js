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

export default function RichiestePage() {
  const [profilo, setProfilo] = useState(null)
  const [richieste, setRichieste] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState('Tutti')
  const router = useRouter()

  useEffect(() => { checkUser() }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data } = await supabase.from('profili').select('*').eq('id', session.user.id).single()
    setProfilo(data)
    let q = supabase.from('richieste').select('*,profili(nome,cognome)').order('created_at', { ascending: false })
    if (data.ruolo !== 'admin') q = q.eq('user_id', data.id)
    const { data: reqs } = await q
    if (reqs) setRichieste(reqs)
    setLoading(false)
  }

  const filtered = richieste.filter(r => {
    const ms = r.titolo?.toLowerCase().includes(search.toLowerCase()) || r.descrizione?.toLowerCase().includes(search.toLowerCase())
    const mf = filtro === 'Tutti' || r.stato === filtro
    return ms && mf
  })

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
        <div className="page-hero fade-in">
          <div className="page-hero-eyebrow">Elenco segnalazioni</div>
          <div className="page-hero-title">Tutte le richieste</div>
          <div className="page-hero-sub">
            {filtered.length} richieste trovate
          </div>
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
            marginBottom: '12px',
          }}
        >
          <span>🔍</span>
          <input placeholder="Cerca per titolo o descrizione..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1, border:'none', outline:'none', fontSize:'15px', fontFamily:'inherit'}}/>
          {search && <button onClick={()=>setSearch('')} style={{background:'none', border:'none', cursor:'pointer', color:'#9AA6B2', fontSize:'16px'}}>✕</button>}
        </div>

        {/* Filtri */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '16px',
            flexWrap: 'wrap',
          }}
        >
          {['Tutti', ...Object.keys(STATUS)].map(f => (
            <button key={f} onClick={()=>setFiltro(f)} style={{padding:'6px 16px', borderRadius:'20px', fontSize:'13px', fontWeight:'600', border:`1.5px solid ${filtro===f ? '#003087' : '#D6DAE2'}`, background:filtro===f ? '#003087' : 'white', color:filtro===f ? 'white' : '#5A6872', cursor:'pointer'}}>
              {f === 'Tutti' ? 'Tutti' : STATUS[f].label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '48px',
              color: 'var(--muted)',
            }}
          >
            Nessuna richiesta trovata
          </div>
        ) : filtered.map(r => {
          const st = STATUS[r.stato] || STATUS.inviata
          return (
            <div
              key={r.id}
              onClick={() => router.push(`/richieste/${r.id}`)}
              className="req-card card-clickable"
              style={{ borderLeftColor: st.color }}
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
                    fontWeight: '700',
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
                  {st.label}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#5A6872', marginBottom: '8px' }}>
                {r.descrizione?.substring(0, 100)}...
              </div>
              <div style={{ fontSize: '11px', color: '#9AA6B2' }}>
                {r.categoria} · {new Date(r.created_at).toLocaleDateString('it-IT')}
                {profilo?.ruolo === 'admin' && r.profili ? ` · ${r.profili.nome} ${r.profili.cognome}` : ''}
              </div>
            </div>
          )
        })}
      </div>
    </Layout>
  )
}