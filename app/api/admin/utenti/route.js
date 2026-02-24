import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { data, error } = await supabase
      .from('profili')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Errore DB:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json(data)
  } catch (err) {
    console.error('Errore API GET:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, nome, cognome, ruolo } = body

    const { data, error } = await supabase
      .from('profili')
      .update({ nome, cognome, ruolo })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Errore DB:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json(data[0])
  } catch (err) {
    console.error('Errore API PUT:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
