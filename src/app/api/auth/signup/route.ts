import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { rawDb } from '@/server/db/client'

/**
 * Server-side signup using service_role key.
 * Creates user with email_confirm = true (skips email verification).
 * Creates a User record in the DB (linked via supabaseId).
 * Then signs them in automatically.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, senha e nome sao obrigatorios.' },
        { status: 400 },
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter no minimo 8 caracteres.' },
        { status: 400 },
      )
    }

    // Create user via admin API (service_role) — skips email confirmation
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (adminError) {
      // User already exists
      if (adminError.message?.includes('already been registered')) {
        return NextResponse.json(
          { error: 'Este email ja esta cadastrado. Tente fazer login.' },
          { status: 409 },
        )
      }
      return NextResponse.json({ error: adminError.message }, { status: 400 })
    }

    // Create User record in our DB (linked to Supabase Auth via supabaseId)
    await rawDb.user.create({
      data: {
        email,
        name: fullName,
        supabaseId: adminData.user.id,
      },
    })

    // Now sign them in to create a session cookie
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          },
        },
      },
    )

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      // User was created but sign-in failed — they can still login manually
      return NextResponse.json(
        { error: 'Conta criada, mas erro ao fazer login automatico. Tente fazer login manualmente.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, userId: adminData.user.id })
  } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 },
    )
  }
}
