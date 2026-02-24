import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabaseServer = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export async function POST(req) {
  try {
    const { to, nome, titolo, messaggio, richiesta_id } = await req.json()

    if (!to || !nome || !titolo || !messaggio) {
      return new Response(JSON.stringify({ error: 'Campi mancanti' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const html = `
      <html>
        <body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
          <table role="presentation" width="100%" style="background:#f5f7fa;padding:24px 0;">
            <tr>
              <td align="center">
                <table role="presentation" width="600" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e6e9ef;">
                  <tr style="background:#003087;color:#ffffff;">
                    <td style="padding:18px 24px;font-weight:700;font-size:18px;">LazioSegnala</td>
                  </tr>
                  <tr>
                    <td style="padding:20px 24px;color:#17324D;">
                      <p style="margin:0 0 12px 0;font-size:15px;">Gentile ${escapeHtml(nome)},</p>
                      <p style="margin:0 0 12px 0;font-size:14px;color:#17324D;">Di seguito un aggiornamento relativo alla sua richiesta: <strong>${escapeHtml(titolo)}</strong></p>
                      <div style="margin:12px 0;padding:14px;border-radius:6px;background:#F5F8FB;border:1px solid #E6EEF9;color:#17324D;font-size:14px;">
                        ${escapeHtml(messaggio).replace(/\n/g, '<br/>')}
                      </div>
                      <p style="margin:14px 0 0 0;font-size:13px;color:#6b7280;">Cordiali saluti,<br/>Protezione Civile Regione Lazio</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:12px 24px;font-size:12px;color:#8b95a6;background:#ffffff;border-top:1px solid #eef2f6;">Questa è una comunicazione automatica inviata da LazioSegnala.</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to,
      subject: `Aggiornamento richiesta: ${titolo}`,
      html,
    })

    // Inserisci evento in timeline se è stato fornito l'id della richiesta
    if (richiesta_id) {
      try {
        await supabaseServer.from('timeline').insert({
          richiesta_id: richiesta_id,
          label: 'Email inviata',
          by_chi: 'Admin',
          colore: '#0066CC'
        })
      } catch (e) {
        console.error('Errore insert timeline:', e)
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

function escapeHtml(unsafe) {
  if (!unsafe) return ''
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
