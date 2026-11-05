'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { hostKind } from '@/lib/host-routing'

export async function login(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Credenciales incorrectas. Verificá tu correo y contraseña.' }
  }

  // En knox.bralto.io se entra directo al centro de mando; en el panel, al Inicio
  redirect(hostKind((await headers()).get('host')) === 'knox' ? '/' : '/admin')
}
