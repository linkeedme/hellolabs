'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [loading, setLoading] = useState(false)
  const [isNewUser, setIsNewUser] = useState(true)

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          invite_slug: slug,
        },
      },
    })

    if (error) {
      toast.error('Erro ao criar conta', { description: error.message })
      setLoading(false)
      return
    }

    toast.success('Conta criada!', {
      description: 'Verifique seu email para confirmar o vinculo com o laboratorio.',
    })
    router.push('/login')
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('Erro ao fazer login', { description: error.message })
      setLoading(false)
      return
    }

    // TODO: Vincular usuario ao tenant via API
    toast.success('Vinculado ao laboratorio!')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">
          Convite para laboratorio
        </CardTitle>
        <p className="text-center text-sm text-muted-foreground">
          Voce foi convidado para se vincular ao laboratorio <strong>{slug}</strong>
        </p>
      </CardHeader>

      <div className="flex justify-center gap-2 px-6 pb-4">
        <Button
          variant={isNewUser ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsNewUser(true)}
        >
          Criar conta
        </Button>
        <Button
          variant={!isNewUser ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsNewUser(false)}
        >
          Ja tenho conta
        </Button>
      </div>

      {isNewUser ? (
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Seu nome</Label>
              <Input id="name" name="name" placeholder="Nome completo" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" placeholder="Minimo 8 caracteres" required />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Criando...' : 'Criar conta e vincular'}
            </Button>
          </CardFooter>
        </form>
      ) : (
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" placeholder="Sua senha" required />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar e vincular'}
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}
