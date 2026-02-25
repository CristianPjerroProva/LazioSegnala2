'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function Layout({ children, profilo }) {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Istituzionale */}
      <header
        style={{
          backgroundColor: 'white',
          borderBottom: '2px solid var(--blu-dark)',
          padding: '10px 20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* Logo Regione Lazio */}
            <img
              src="/logoregione.png"
              style={{ height: '35px', width: 'auto' }}
              alt="Regione Lazio"
            />
            {/* Divisore */}
            <div style={{ width: '1px', height: '25px', backgroundColor: '#ddd' }}></div>
            {/* Logo Protezione Civile */}
            <img
              src="/logopc.png"
              style={{ height: '45px', width: 'auto' }}
              alt="Protezione Civile"
            />
            <span
              style={{
                fontWeight: 800,
                color: 'var(--blu-dark)',
                fontSize: '1.25rem',
                marginLeft: '10px',
                letterSpacing: '-0.02em',
              }}
            >
              LazioSegnala
            </span>
          </div>

          <nav style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link
              href="/home"
              style={{
                textDecoration: 'none',
                color: 'var(--blu-dark)',
                fontWeight: 500,
                fontSize: '14px',
              }}
            >
              Home
            </Link>
            {profilo?.ruolo === 'admin' && (
              <>
                <Link
                  href="/dashboard"
                  style={{
                    textDecoration: 'none',
                    color: 'var(--blu-dark)',
                    fontWeight: 500,
                    fontSize: '14px',
                  }}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/utenti"
                  style={{
                    textDecoration: 'none',
                    color: 'var(--blu-dark)',
                    fontWeight: 500,
                    fontSize: '14px',
                  }}
                >
                  Utenti
                </Link>
              </>
            )}
            <Link
              href="/richieste"
              style={{
                textDecoration: 'none',
                color: 'var(--blu-dark)',
                fontWeight: 500,
                fontSize: '14px',
              }}
            >
              Richieste
            </Link>
            <Link
              href="/profilo"
              style={{
                textDecoration: 'none',
                color: 'var(--blu-dark)',
                fontWeight: 500,
                fontSize: '14px',
              }}
            >
              Profilo
            </Link>
            <Link
              href="/nuova-richiesta"
              style={{
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: '999px',
                padding: '8px 18px',
                background: 'var(--arancio)',
                color: 'white',
              }}
            >
              Invia segnalazione
            </Link>
            <button
              onClick={handleLogout}
              style={{
                marginLeft: '4px',
                background: 'transparent',
                border: 'none',
                color: 'var(--muted)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Esci
            </button>
          </nav>
        </div>
      </header>

      {/* Contenuto Principale */}
      <main style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '20px' }}>
        {children}
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: 'white',
          borderTop: '1px solid var(--border)',
          color: 'var(--muted)',
          fontSize: '0.85rem',
        }}
      >
        © 2026 Protezione Civile - Regione Lazio
      </footer>
    </div>
  );
}