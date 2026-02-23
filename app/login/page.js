'use client'
import { useState } from 'react'
import Image from 'next/image'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [userEmail, setUserEmail] = useState('')
  const [userPassword, setUserPassword] = useState('')
  const [userNome, setUserNome] = useState('')
  const [userCognome, setUserCognome] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [userLoading, setUserLoading] = useState(false)
  const [adminLoading, setAdminLoading] = useState(false)
  const [userError, setUserError] = useState('')
  const [adminError, setAdminError] = useState('')
  const [activePanel, setActivePanel] = useState(null)
  const [userMode, setUserMode] = useState('login') // 'login' | 'register'
  const router = useRouter()

  async function handleUserLogin() {
    setUserError('')
    setUserLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: userPassword,
    })
    if (error) {
      setUserError('Email o password non corretti')
    } else if (data?.user) {
      const { data: profilo } = await supabase
        .from('profili')
        .select('ruolo')
        .eq('id', data.user.id)
        .single()

      if (profilo?.ruolo === 'admin') {
        router.push('/dashboard')
      } else {
        router.push('/home')
      }
    }
    setUserLoading(false)
  }

  async function handleUserRegister() {
    setUserError('')
    if (!userEmail || !userPassword || !userNome || !userCognome) {
      setUserError('Compila tutti i campi per registrarti')
      return
    }
    setUserLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: userEmail,
      password: userPassword,
    })
    if (error) {
      setUserError('Registrazione non riuscita, controlla i dati inseriti')
    } else if (data?.user) {
      await supabase
        .from('profili')
        .upsert({
          id: data.user.id,
          nome: userNome,
          cognome: userCognome,
          email: userEmail,
          ruolo: 'richiedente',
        })
      router.push('/home')
    }
    setUserLoading(false)
  }

  async function handleAdminLogin() {
    setAdminError('')
    setAdminLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    })
    if (error) {
      setAdminError('Email o password non corretti')
    } else if (data?.user) {
      const { data: profilo } = await supabase
        .from('profili')
        .select('ruolo')
        .eq('id', data.user.id)
        .single()

      if (profilo?.ruolo === 'admin') {
        router.push('/dashboard')
      } else {
        setAdminError('Questo account non è abilitato come admin')
        await supabase.auth.signOut()
      }
    }
    setAdminLoading(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--blu-dark)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="card fade-in"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '28px 24px 24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          <Image
            src="/logopc.png"
            alt="Protezione Civile Regione Lazio"
            width={70}
            height={70}
          />
          <Image
            src="/logoregione.png"
            alt="Regione Lazio e Lazio Crea"
            width={160}
            height={32}
          />
        </div>

        <h1
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: 'var(--blu-dark)',
            textAlign: 'center',
            marginBottom: '8px',
            letterSpacing: '-0.02em',
          }}
        >
          LazioSegnala
        </h1>

        {/* Switch tra Richiedente e Amministratore */}
        <div style={{ marginTop: '16px', marginBottom: '12px', display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActivePanel(prev => (prev === 'user' ? null : 'user'))}
            className="btn-secondary"
            style={{
              flex: 1,
              justifyContent: 'center',
              background: activePanel === 'user' ? 'var(--blu-dark)' : 'white',
              color: activePanel === 'user' ? 'white' : 'var(--text)',
              borderColor: activePanel === 'user' ? 'var(--blu-dark)' : 'var(--border)',
            }}
          >
            Richiedente
          </button>
          <button
            type="button"
            onClick={() => setActivePanel(prev => (prev === 'admin' ? null : 'admin'))}
            className="btn-secondary"
            style={{
              flex: 1,
              justifyContent: 'center',
              background: activePanel === 'admin' ? 'var(--blu-dark)' : 'white',
              color: activePanel === 'admin' ? 'white' : 'var(--text)',
              borderColor: activePanel === 'admin' ? 'var(--blu-dark)' : 'var(--border)',
            }}
          >
            Amministratore
          </button>
        </div>

        {/* Area login a tendina */}
        <div style={{ marginTop: '4px' }}>
          {activePanel === null && (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--muted)',
                textAlign: 'center',
                marginBottom: '4px',
              }}
            >
              Seleziona se accedere come Richiedente o come Amministratore.
            </div>
          )}

          {activePanel === 'user' && (
            <section
              className="fade-in"
              style={{
                borderRadius: '10px',
                border: '1px solid var(--border)',
                padding: '14px 14px 16px',
                background: 'var(--grigio-f)',
              }}
            >
              {/* Switch interno login / registrazione */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setUserMode('login'); setUserError('') }}
                  className="btn-secondary"
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    background: userMode === 'login' ? 'var(--blu-dark)' : 'white',
                    color: userMode === 'login' ? 'white' : 'var(--text)',
                    borderColor: userMode === 'login' ? 'var(--blu-dark)' : 'var(--border)',
                    padding: '8px 10px',
                  }}
                >
                  Accedi
                </button>
                <button
                  type="button"
                  onClick={() => { setUserMode('register'); setUserError('') }}
                  className="btn-secondary"
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    background: userMode === 'register' ? 'var(--blu-dark)' : 'white',
                    color: userMode === 'register' ? 'white' : 'var(--text)',
                    borderColor: userMode === 'register' ? 'var(--blu-dark)' : 'var(--border)',
                    padding: '8px 10px',
                  }}
                >
                  Registrati
                </button>
              </div>

              {userError && <div className="error-box">{userError}</div>}

              {userMode === 'register' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div className="form-group" style={{ marginBottom: '12px', flex: 1 }}>
                    <label className="form-label">Nome</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nome"
                      value={userNome}
                      onChange={e => setUserNome(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '12px', flex: 1 }}>
                    <label className="form-label">Cognome</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Cognome"
                      value={userCognome}
                      onChange={e => setUserCognome(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="nome@email.it"
                  value={userEmail}
                  onChange={e => setUserEmail(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={userPassword}
                  onChange={e => setUserPassword(e.target.value)}
                />
              </div>

              <button
                onClick={userMode === 'login' ? handleUserLogin : handleUserRegister}
                disabled={userLoading}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {userLoading
                  ? userMode === 'login'
                    ? 'Accesso in corso…'
                    : 'Registrazione in corso…'
                  : userMode === 'login'
                    ? 'Accedi come richiedente'
                    : 'Registrati come richiedente'}
              </button>
            </section>
          )}

          {activePanel === 'admin' && (
            <section
              className="fade-in"
              style={{
                borderRadius: '10px',
                border: '1px solid var(--border)',
                padding: '14px 14px 16px',
                background: 'white',
                marginTop: activePanel === 'admin' ? 0 : 12,
              }}
            >
              {adminError && <div className="error-box">{adminError}</div>}

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="nome@regione.lazio.it"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                />
              </div>

              <button
                onClick={handleAdminLogin}
                disabled={adminLoading}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {adminLoading ? 'Accesso in corso…' : 'Accedi come amministratore'}
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}