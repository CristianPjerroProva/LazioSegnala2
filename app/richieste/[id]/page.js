'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Layout from '../../components/Layout'

const STATUS = {
  inviata:    { label:'Inviata',         color:'#5A6872' },
  presa:      { label:'Presa in Carico', color:'#C97B00' },
  test:       { label:'In Test',         color:'#6B3FA0' },
  chiarimenti: { label:'Chiarimenti Richiesti', color:'#DC2626' },
  completato: { label:'Completato',      color:'#008a4b' },
}

export default function DettaglioPage() {
  const [profilo, setProfilo] = useState(null)
  const [richiesta, setRichiesta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nota, setNota] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailStatus, setEmailStatus] = useState('')
  const router = useRouter()
  const { id } = useParams()

  useEffect(() => { checkUser() }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data: prof } = await supabase.from('profili').select('*').eq('id', session.user.id).single()
    setProfilo(prof)
    const { data: req } = await supabase.from('richieste').select('*,profili(nome,cognome,email),messaggi(mittente,testo,created_at),timeline(label,by_chi,colore,created_at)').eq('id', id).single()
    if (req) { setRichiesta(req); setNota(req.note_admin || '') }
    setLoading(false)
  }

  async function cambiaStato(stato) {
    const st = STATUS[stato]
    await supabase.from('richieste').update({ stato }).eq('id', id)
    await supabase.from('timeline').insert({ richiesta_id: id, label: `Stato: ${st.label}`, by_chi: 'Admin', colore: st.color })
    checkUser()
  }

  async function salvaNota() {
    await supabase.from('richieste').update({ note_admin: nota }).eq('id', id)
    await supabase.from('timeline').insert({ richiesta_id: id, label: 'Nota aggiunta', by_chi: 'Admin', colore: '#0066CC' })
    checkUser()
  }

  async function inviaEmail() {
    // prova prima con richiesta.email, poi con profili
    let destinatario = richiesta?.email || richiesta?.profili?.email
    let nomeDest = richiesta?.profili?.nome
    let cognomeDest = richiesta?.profili?.cognome
    if (!destinatario && Array.isArray(richiesta?.profili) && richiesta.profili.length) {
      destinatario = richiesta.profili[0]?.email
      nomeDest = richiesta.profili[0]?.nome
      cognomeDest = richiesta.profili[0]?.cognome
    }
    console.log('destinatario:', destinatario)
    if (!destinatario) { setEmailStatus('Nessuna email disponibile'); return }
    if (!nota) { setEmailStatus('Inserisci un messaggio nella nota prima di inviare'); return }
    setEmailLoading(true)
    setEmailStatus('')
    try {
      console.log('inviaEmail chiamata', destinatario)
      console.log('Invio email a:', destinatario, 'nome:', nomeDest, 'cognome:', cognomeDest)
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: destinatario,
          nome: `${nomeDest || ''} ${cognomeDest || ''}`.trim(),
          titolo: richiesta.titolo,
          messaggio: nota,
          richiesta_id: id
        })
      })
      console.log('risposta API:', res.status)
      const data = await res.json()
      if (data?.success) {
        setEmailStatus('Email inviata con successo')
        checkUser()
      } else {
        const errMsg = data?.error || 'Errore durante l\'invio'
        setEmailStatus(errMsg)
      }
    } catch (err) {
      setEmailStatus(err.message || String(err))
    }
    setEmailLoading(false)
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Caricamento…</span>
      </div>
    )
  }
  if (!richiesta) return <div style={{ padding: '24px' }}>Richiesta non trovata</div>

  const st = STATUS[richiesta.stato] || STATUS.inviata
  const tl = [...(richiesta.timeline || [])].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )

  const startEvent = tl.length ? tl[tl.length - 1] : null
  const endEventFromTimeline =
    richiesta.stato === 'completato'
      ? tl.find(t => (t.label || '').toLowerCase().includes('completato'))
      : null
  const startAt = startEvent ? startEvent.created_at : richiesta.created_at
  const endAt = endEventFromTimeline ? endEventFromTimeline.created_at : null

  function formatDateTime(value) {
    if (!value) return '-'
    return new Date(value).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function formatDurationMs(ms) {
    if (ms <= 0) return '0 minuti'
    const totalMinutes = Math.round(ms / 60000)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (hours === 0) return `${minutes} min`
    if (minutes === 0) return `${hours} h`
    return `${hours} h ${minutes} min`
  }

  function handleEmailRichiedente() {
    const email = richiesta.profili?.email
    if (!email) return
    const subject = encodeURIComponent(`Richiesta ${id} - ${richiesta.titolo || ''}`)
    const bodyLines = [
      `Gentile ${richiesta.profili?.nome || ''} ${richiesta.profili?.cognome || ''},`,
      '',
      'in riferimento alla sua richiesta inviata sul portale LazioSegnala,',
      'avremmo bisogno di qualche informazione aggiuntiva per poterla gestire al meglio.',
      '',
      'Dettagli richiesta:',
      `- Titolo: ${richiesta.titolo || ''}`,
      `- Categoria: ${richiesta.categoria || ''}`,
      '',
      'Cordiali saluti,',
      'Protezione Civile Regione Lazio',
    ]
    const body = encodeURIComponent(bodyLines.join('\n'))
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
  }

  return (
    <Layout profilo={profilo}>
      <div style={{ padding: '32px 20px', maxWidth: '800px', margin: '0 auto' }}>

        {/* Storico gestione sintetico */}
        <div
          className="card"
          style={{ padding: '16px 18px', marginBottom: '16px', display: 'grid', gap: '8px' }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
            }}
          >
            Storico gestione
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
            <strong>Inizio:</strong> {formatDateTime(startAt)}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
            <strong>Fine:</strong>{' '}
            {endAt ? formatDateTime(endAt) : 'In corso'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
            <strong>Durata gestione:</strong>{' '}
            {endAt ? formatDurationMs(new Date(endAt) - new Date(startAt)) : 'Non conclusa'}
          </div>
        </div>

        {/* Badge stato, modulo e categoria */}
        <div style={{display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap'}}>
          <span style={{padding:'4px 12px', borderRadius:'3px', fontSize:'12px', fontWeight:'700', background:`${st.color}20`, color:st.color}}>{st.label}</span>
          {richiesta.modulo && <span style={{padding:'4px 12px', borderRadius:'3px', fontSize:'12px', fontWeight:'700', background:'#F0FDF4', color:'#15803D'}}>{richiesta.modulo}</span>}
          <span style={{padding:'4px 12px', borderRadius:'3px', fontSize:'12px', fontWeight:'700', background:'#E8F1FB', color:'#0066CC'}}>{richiesta.categoria}</span>
        </div>

        <h1 style={{fontSize:'24px', fontWeight:'700', color:'#003087', marginBottom:'8px'}}>{richiesta.titolo}</h1>
        <p style={{fontSize:'13px', color:'#9AA6B2', marginBottom:'24px'}}>
          {richiesta.profili?.nome} {richiesta.profili?.cognome} · {new Date(richiesta.created_at).toLocaleDateString('it-IT')}
        </p>

        {/* Contatto via email per admin */}
        {profilo?.ruolo === 'admin' && richiesta.profili?.email && (
          <div
            className="card"
            style={{
              padding: '16px 18px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>Contatta il richiedente</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                Email: {richiesta.profili.email}
              </div>
            </div>
            <button
              type="button"
              onClick={handleEmailRichiedente}
              className="btn-secondary"
              style={{ whiteSpace: 'nowrap' }}
            >
              Scrivi email
            </button>
          </div>
        )}

        {/* Descrizione */}
        <div
          style={{
            background: 'white',
            borderRadius: '8px',
            padding: '20px',
            border: '1px solid #D6DAE2',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#9AA6B2',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '8px',
            }}
          >
            Descrizione
          </div>
          <p style={{ fontSize: '14px', lineHeight: '1.65', color: '#17324D' }}>
            {richiesta.descrizione}
          </p>
        </div>

        {/* Nota admin */}
        {richiesta.note_admin && (
          <div style={{background:'#E8F1FB', borderLeft:'3px solid #0066CC', borderRadius:'0 8px 8px 0', padding:'12px 16px', marginBottom:'16px', fontSize:'14px', color:'#17324D'}}>
            <strong>Nota Admin:</strong> {richiesta.note_admin}
          </div>
        )}

        {/* Sezione admin */}
        {profilo?.ruolo === 'admin' && (
          <>
            <div style={{background:'white', borderRadius:'8px', padding:'20px', border:'1px solid #D6DAE2', marginBottom:'16px'}}>
              <div style={{fontSize:'11px', fontWeight:'700', color:'#9AA6B2', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px'}}>Aggiorna Stato</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                {Object.entries(STATUS).map(([k,s]) => (
                  <button key={k} onClick={()=>cambiaStato(k)} style={{padding:'10px 12px', borderRadius:'8px', border:`2px solid ${richiesta.stato===k ? s.color : '#D6DAE2'}`, background:richiesta.stato===k ? `${s.color}15` : 'white', color:s.color, fontWeight:'700', fontSize:'13px', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', fontFamily:'inherit'}}>
                    <div style={{width:10, height:10, borderRadius:'50%', background:s.color, flexShrink:0}}/>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{background:'white', borderRadius:'8px', padding:'20px', border:'1px solid #D6DAE2', marginBottom:'16px'}}>
              <div style={{fontSize:'11px', fontWeight:'700', color:'#9AA6B2', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px'}}>Note</div>
              <textarea value={nota} onChange={e=>setNota(e.target.value)} placeholder="Aggiungi note visibili al richiedente..." style={{width:'100%', padding:'12px', border:'2px solid #D6DAE2', borderRadius:'8px', fontSize:'14px', minHeight:'80px', boxSizing:'border-box', resize:'vertical', fontFamily:'inherit'}}/>
              <div style={{display:'flex', gap:'8px', marginTop:'8px'}}>
                <button onClick={salvaNota} style={{flex:1, padding:'12px 24px', background:'#003087', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'700', fontSize:'14px', fontFamily:'inherit'}}>Salva nota</button>
              </div>
              {emailStatus && <div style={{marginTop:'8px', fontSize:'13px', color: emailStatus.includes('successo') ? '#0b8043' : '#CC334D'}}>{emailStatus}</div>}
            </div>
          </>
        )}

        {/* Cronologia */}
        {tl.length > 0 && (
          <div style={{background:'white', borderRadius:'8px', padding:'20px', border:'1px solid #D6DAE2'}}>
            <div style={{fontSize:'11px', fontWeight:'700', color:'#9AA6B2', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'16px'}}>Cronologia</div>
            {tl.map((t,i) => (
              <div key={i} style={{display:'flex', gap:'12px', marginBottom:'12px'}}>
                <div style={{width:12, height:12, borderRadius:'50%', background:t.colore, flexShrink:0, marginTop:4}}/>
                <div style={{background:'#F5F6F7', borderRadius:'8px', padding:'10px 14px', flex:1}}>
                  <div style={{fontSize:'13px', fontWeight:'700', color:'#17324D'}}>{t.label}</div>
                  <div style={{fontSize:'11px', color:'#9AA6B2', marginTop:'3px'}}>{t.by_chi} · {new Date(t.created_at).toLocaleDateString('it-IT')}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={()=>router.back()} style={{marginTop:'16px', padding:'12px 24px', background:'white', color:'#003087', border:'2px solid #D6DAE2', borderRadius:'8px', cursor:'pointer', fontWeight:'700', fontSize:'14px', fontFamily:'inherit'}}>← Torna indietro</button>
      </div>
    </Layout>
  )
}