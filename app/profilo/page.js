'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Layout from '../components/Layout'

export default function ProfiloPage() {
  const [profilo, setProfilo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [form, setForm] = useState({
    nome: '',
    cognome: '',
  })
  const [profileImage, setProfileImage] = useState(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('profili')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (data) {
        setProfilo(data)
        setForm({
          nome: data.nome || '',
          cognome: data.cognome || '',
        })
        setProfileImage(data.foto_profilo || null)
      }
      setLoading(false)
    } catch (error) {
      console.error('Errore nel caricamento profilo:', error)
      setLoading(false)
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setSaving(true)
      setMessage('')

      // Validazione file
      if (!file.type.startsWith('image/')) {
        setMessage('Per favore seleziona un file immagine')
        setMessageType('error')
        setSaving(false)
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        setMessage('Il file deve essere più piccolo di 5MB')
        setMessageType('error')
        setSaving(false)
        return
      }

      // Carica l'immagine su Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${profilo.id}-${Date.now()}.${fileExt}`
      const filePath = `profile-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Ottieni l'URL pubblico
      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath)

      const imageUrl = data.publicUrl

      // Aggiorna il profilo nel database
      const { error: updateError } = await supabase
        .from('profili')
        .update({ foto_profilo: imageUrl })
        .eq('id', profilo.id)

      if (updateError) throw updateError

      setProfileImage(imageUrl)
      setMessage('Foto profilo aggiornata con successo!')
      setMessageType('success')
    } catch (error) {
      console.error('Errore nel caricamento immagine:', error)
      setMessage('Errore nel caricamento della foto')
      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveProfilo() {
    try {
      if (!form.nome.trim() || !form.cognome.trim()) {
        setMessage('Nome e cognome sono obbligatori')
        setMessageType('error')
        return
      }

      setSaving(true)
      setMessage('')

      const { error } = await supabase
        .from('profili')
        .update({
          nome: form.nome.trim(),
          cognome: form.cognome.trim(),
        })
        .eq('id', profilo.id)

      if (error) throw error

      setProfilo(prev => ({
        ...prev,
        nome: form.nome.trim(),
        cognome: form.cognome.trim(),
      }))

      setMessage('Profilo aggiornato con successo!')
      setMessageType('success')
    } catch (error) {
      console.error('Errore nel salvataggio:', error)
      setMessage('Errore nel salvataggio del profilo')
      setMessageType('error')
    } finally {
      setSaving(false)
    }
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
      <div style={{ padding: '32px 20px', maxWidth: '600px', margin: '0 auto' }}>
        {/* Hero */}
        <div className="page-hero fade-in">
          <div className="page-hero-eyebrow">Impostazioni Account</div>
          <div className="page-hero-title">Il tuo Profilo</div>
          <div className="page-hero-sub">
            Modifica i tuoi dati personali
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              backgroundColor: messageType === 'success' ? '#f0fdf4' : '#fef2f2',
              color: messageType === 'success' ? '#166534' : '#991b1b',
              border: `1px solid ${messageType === 'success' ? '#bbf7d0' : '#fecaca'}`,
            }}
          >
            {message}
          </div>
        )}

        {/* Card Foto Profilo */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid var(--border)',
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.1rem', fontWeight: 600 }}>
            Foto Profilo
          </h3>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '20px',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: 'var(--blu-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '2px solid var(--border)',
              }}
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profilo"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <span style={{ fontSize: '40px' }}>📷</span>
              )}
            </div>

            {/* Upload Area */}
            <div style={{ flex: 1 }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={saving}
                style={{ display: 'none' }}
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                style={{
                  display: 'inline-block',
                  padding: '10px 16px',
                  backgroundColor: 'var(--blu-dark)',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                  fontSize: '14px',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Caricamento...' : 'Carica Foto'}
              </label>
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                JPG, PNG, WebP • Max 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Card Dati Personali */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid var(--border)',
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem', fontWeight: 600 }}>
            Dati Personali
          </h3>

          {/* Campo Email (Non modificabile) */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '8px',
                color: 'var(--text)',
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={profilo?.email || ''}
              disabled
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#f5f5f5',
                color: 'var(--muted)',
              }}
            />
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>
              L'email non può essere modificata
            </p>
          </div>

          {/* Campo Nome */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '8px',
                color: 'var(--text)',
              }}
            >
              Nome
            </label>
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleInputChange}
              disabled={saving}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
              }}
              placeholder="Inserisci il tuo nome"
            />
          </div>

          {/* Campo Cognome */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '8px',
                color: 'var(--text)',
              }}
            >
              Cognome
            </label>
            <input
              type="text"
              name="cognome"
              value={form.cognome}
              onChange={handleInputChange}
              disabled={saving}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
              }}
              placeholder="Inserisci il tuo cognome"
            />
          </div>

          {/* Bottone Salva */}
          <button
            onClick={handleSaveProfilo}
            disabled={saving}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: 'var(--blu-dark)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Salvataggio in corso...' : 'Salva Modifiche'}
          </button>
        </div>
      </div>
    </Layout>
  )
}
