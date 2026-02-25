'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Layout from '../components/Layout'

const STATUS = {
  inviata:    { label:'Inviata',         color:'#5A6872' },
  presa:      { label:'Presa in Carico', color:'#C97B00' },
  test:       { label:'In Test',         color:'#6B3FA0' },
  chiarimenti: { label:'Chiarimenti Richiesti', color:'#DC2626' },
  completato: { label:'Completato',      color:'#008a4b' },
}
const CATS = ['Bug', 'Miglioramento', 'Nuova funzione', 'Altro']
const MODULI = ['WEBSOR', 'MGO', 'MGEP', 'ALERTEAM']
const CAT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A']
const MOD_COLORS = ['#0052CC', '#5B21B6', '#EA580C', '#16A34A']

function PieChart({ data, colors, size = 200 }) {
  const total = data.reduce((a, b) => a + b, 0)
  if (total === 0) return <div style={{textAlign:'center', color:'#9AA6B2', padding:'24px'}}>Nessun dato disponibile</div>
  
  let currentAngle = -90
  const slices = data.map((value, i) => {
    const percentage = value / total
    const angle = percentage * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180
    const cx = size / 2, cy = size / 2, r = size / 2 - 8
    
    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)
    
    const largeArc = angle > 180 ? 1 : 0
    const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
    
    currentAngle = endAngle
    return { pathData, color: colors[i % colors.length], percentage }
  })
  
  return (
    <svg width={size} height={size} style={{marginBottom:'12px'}}>
      {slices.map((slice, i) => (
        <path key={i} d={slice.pathData} fill={slice.color} stroke="white" strokeWidth="2" />
      ))}
    </svg>
  )
}

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
  const maxMod = Math.max(...MODULI.map(m => richieste.filter(r=>r.modulo===m).length), 1)

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

        {/* Grafico moduli */}
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
              marginBottom: '24px',
            }}
          >
            Richieste per Modulo
          </div>
          <div style={{display:'flex', gap:'32px', alignItems:'flex-start'}}>
            <div>
              <PieChart data={MODULI.map(m => richieste.filter(r=>r.modulo===m).length)} colors={MOD_COLORS} size={180} />
            </div>
            <div style={{flex:1}}>
              {MODULI.map((m, i) => {
                const n = richieste.filter(r=>r.modulo===m).length
                const pct = total > 0 ? ((n / total) * 100).toFixed(1) : 0
                return (
                  <div key={m} style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px'}}>
                    <div style={{width:'12px', height:'12px', borderRadius:'2px', background:MOD_COLORS[i % MOD_COLORS.length], flexShrink:0}}></div>
                    <div style={{fontSize:'13px', color:'#5A6872', flex:1}}>{m}</div>
                    <div style={{fontSize:'13px', fontWeight:'600', color:'#003087', minWidth:'45px', textAlign:'right'}}>{n} ({pct}%)</div>
                  </div>
                )
              })}
            </div>
          </div>
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
              marginBottom: '24px',
            }}
          >
            Richieste per Categoria
          </div>
          <div style={{display:'flex', gap:'32px', alignItems:'flex-start'}}>
            <div>
              <PieChart data={CATS.map(c => richieste.filter(r=>r.categoria===c).length)} colors={CAT_COLORS} size={180} />
            </div>
            <div style={{flex:1}}>
              {CATS.map((c, i) => {
                const n = richieste.filter(r=>r.categoria===c).length
                const pct = total > 0 ? ((n / total) * 100).toFixed(1) : 0
                return (
                  <div key={c} style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px'}}>
                    <div style={{width:'12px', height:'12px', borderRadius:'2px', background:CAT_COLORS[i % CAT_COLORS.length], flexShrink:0}}></div>
                    <div style={{fontSize:'13px', color:'#5A6872', flex:1}}>{c}</div>
                    <div style={{fontSize:'13px', fontWeight:'600', color:'#003087', minWidth:'45px', textAlign:'right'}}>{n} ({pct}%)</div>
                  </div>
                )
              })}
            </div>
          </div>
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
                  <div style={{fontSize:'11px', color:'#9AA6B2', marginTop:'2px'}}>{r.profili?.nome} {r.profili?.cognome} · {r.modulo} · {new Date(r.created_at).toLocaleDateString('it-IT')}</div>
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