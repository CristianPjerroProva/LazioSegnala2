'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Layout from '../components/Layout'

const MODULI = ['WEBSOR', 'MGO', 'MGEP', 'ALERTEAM']

const TIPI_RICHIESTA = ['Bug', 'Miglioramento', 'Nuova funzione', 'Altro']

export default function NuovaRichiesta() {
  const [profilo, setProfilo] = useState(null)
  const [form, setForm] = useState({ titolo: '', descrizione: '', modulo: '', tipo: 'Bug' })
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => { checkUser() }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data } = await supabase.from('profili').select('*').eq('id', session.user.id).single()
    setProfilo(data)
    setPageLoading(false)
  }

  async function handleSubmit() {
    setError('')
    if (!form.titolo || !form.descrizione || !form.modulo || !form.tipo) { setError('Compila tutti i campi obbligatori'); return }
    setLoading(true)
    const { data: req, error: err } = await supabase.from('richieste').insert({
      user_id: profilo.id,
      titolo: form.titolo,
      descrizione: form.descrizione,
      modulo: form.modulo,
      tipo: form.tipo,
      categoria: form.tipo,
      stato: 'inviata'
    }).select().single()

    if (err) { console.error('Supabase insert error:', err); setError(err.message || err.details || JSON.stringify(err)); setLoading(false); return }

    await supabase.from('timeline').insert({
      richiesta_id: req.id,
      label: 'Richiesta inviata',
      by_chi: 'Sistema',
      colore: '#5A6872'
    })

    router.push('/richieste')
  }

  if (pageLoading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}>Caricamento...</div>

  return (
    <Layout profilo={profilo}>
      <div style={{padding:'32px 20px', maxWidth:'700px', margin:'0 auto'}}>

        {/* Hero */}
        <div style={{background:'white', borderRadius:'8px', padding:'24px', border:'1px solid #D6DAE2', borderTop:'3px solid #003087', marginBottom:'24px'}}>
          <div style={{fontSize:'26px', fontWeight:'700', color:'#003087'}}>Nuova Richiesta</div>
          <div style={{fontSize:'14px', color:'#5A6872', marginTop:'4px'}}>Compila il modulo per inviare una nuova segnalazione</div>
        </div>

        {/* Form */}
        <div style={{background:'white', borderRadius:'8px', padding:'24px', border:'1px solid #D6DAE2'}}>

          {error && (
            <div style={{background:'#FDECEA', borderLeft:'3px solid #CC334D', padding:'12px 16px', borderRadius:'0 8px 8px 0', marginBottom:'20px', fontSize:'13px', color:'#CC334D'}}>
              {error}
            </div>
          )}

          {/* Titolo */}
          <div style={{marginBottom:'20px'}}>
            <label style={{display:'block', fontSize:'13px', fontWeight:'700', color:'#5A6872', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px'}}>
              Titolo *
            </label>
            <input
              placeholder="Descrivi brevemente la richiesta"
              value={form.titolo}
              onChange={e=>setForm({...form, titolo:e.target.value})}
              style={{width:'100%', padding:'12px 14px', border:'2px solid #D6DAE2', borderRadius:'8px', fontSize:'15px', fontFamily:'inherit', outline:'none', boxSizing:'border-box'}}
            />
          </div>

          

          {/* Modulo */}
          <div style={{marginBottom:'20px'}}>
            <label style={{display:'block', fontSize:'13px', fontWeight:'700', color:'#5A6872', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px'}}>
              Modulo *
            </label>
            <select
              value={form.modulo}
              onChange={e=>setForm({...form, modulo:e.target.value})}
              style={{width:'100%', padding:'12px 14px', border:'2px solid #D6DAE2', borderRadius:'8px', fontSize:'15px', fontFamily:'inherit', outline:'none', background:'white', boxSizing:'border-box'}}
            >
              <option value="">Seleziona un modulo</option>
              {MODULI.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Tipo richiesta */}
          <div style={{marginBottom:'20px'}}>
            <label style={{display:'block', fontSize:'13px', fontWeight:'700', color:'#5A6872', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px'}}>
              Tipo richiesta *
            </label>
            <select
              value={form.tipo}
              onChange={e=>setForm({...form, tipo:e.target.value})}
              style={{width:'100%', padding:'12px 14px', border:'2px solid #D6DAE2', borderRadius:'8px', fontSize:'15px', fontFamily:'inherit', outline:'none', background:'white', boxSizing:'border-box'}}
            >
              {TIPI_RICHIESTA.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Descrizione */}
          <div style={{marginBottom:'24px'}}>
            <label style={{display:'block', fontSize:'13px', fontWeight:'700', color:'#5A6872', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px'}}>
              Descrizione *
            </label>
            <textarea
              placeholder="Fornisci tutti i dettagli utili per comprendere la richiesta..."
              value={form.descrizione}
              onChange={e=>setForm({...form, descrizione:e.target.value})}
              rows={5}
              style={{width:'100%', padding:'12px 14px', border:'2px solid #D6DAE2', borderRadius:'8px', fontSize:'15px', fontFamily:'inherit', outline:'none', resize:'vertical', boxSizing:'border-box', lineHeight:'1.55'}}
            />
          </div>

          {/* Bottoni */}
          <div style={{display:'flex', gap:'12px'}}>
            <button
              onClick={()=>router.back()}
              style={{flex:1, padding:'13px', background:'white', color:'#17324D', border:'2px solid #D6DAE2', borderRadius:'8px', fontSize:'15px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit'}}
            >
              Annulla
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{flex:1, padding:'13px', background:'#003087', color:'white', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit', opacity:loading?0.7:1}}
            >
              {loading ? 'Invio in corso...' : 'Invia richiesta'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}