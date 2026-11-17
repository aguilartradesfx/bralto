'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { hostKind } from '@/lib/host-routing'
import { siguienteSeguro } from '@/lib/panel/siguiente'

export async function login(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'El correo o la contraseña no coinciden. Revísalos y prueba de nuevo.' }
  }

  // Al enlace que pidió (si es una ruta segura de este sitio); si no, en knox.bralto.io al centro de mando y en el
  // panel al Inicio
  const siguiente = siguienteSeguro(formData.get('next'))
  redirect(siguiente ?? (hostKind((await headers()).get('host')) === 'knox' ? '/' : '/admin'))
}
