'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Building2, Phone, Mail, MapPin, Globe, Clock, Save, Loader2,
  Plus, MoreHorizontal, Pencil, XCircle, CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BranchFormDialog } from '@/components/settings/branch-form-dialog'
import { PriceTableManager } from '@/components/settings/price-table-manager'

// ── Lab data form schema ──────────────────────────────────────────
const labFormSchema = z.object({
  name: z.string().min(2, 'Nome obrigatorio'),
  document: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email invalido').optional().or(z.literal('')),
  address: z.string().optional(),
})

type LabFormValues = z.input<typeof labFormSchema>

// ── Preferences form schema ───────────────────────────────────────
const CURRENCIES = [
  { value: 'BRL', label: 'BRL — Real' },
  { value: 'USD', label: 'USD — Dolar' },
] as const

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo (UTC-3)' },
  { value: 'America/Manaus', label: 'America/Manaus (UTC-4)' },
  { value: 'America/Bahia', label: 'America/Bahia (UTC-3)' },
  { value: 'America/Recife', label: 'America/Recife (UTC-3)' },
] as const

const LANGUAGES = [
  { value: 'pt-BR', label: 'Portugues (Brasil)' },
  { value: 'en', label: 'English' },
] as const

export default function SettingsGeneralPage() {
  // ── State ─────────────────────────────────────────────────────
  const [branchDialogOpen, setBranchDialogOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<{ id: string } & Record<string, unknown> | undefined>()
  const [currency, setCurrency] = useState('BRL')
  const [timezone, setTimezone] = useState('America/Sao_Paulo')
  const [language, setLanguage] = useState('pt-BR')

  // ── Queries ───────────────────────────────────────────────────
  const { data: tenant, isLoading: tenantLoading } = trpc.tenant.getCurrent.useQuery()
  const { data: branchData, isLoading: branchLoading } = trpc.branch.list.useQuery({ page: 1, perPage: 50 })
  const utils = trpc.useUtils()

  // ── Lab data form ─────────────────────────────────────────────
  const labForm = useForm<LabFormValues>({
    resolver: zodResolver(labFormSchema),
    defaultValues: { name: '', document: '', phone: '', email: '', address: '' },
  })

  useEffect(() => {
    if (tenant) {
      const settings = (tenant.settings ?? {}) as Record<string, unknown>
      labForm.reset({
        name: tenant.name ?? '',
        document: (settings.document as string) ?? '',
        phone: (settings.phone as string) ?? '',
        email: (settings.email as string) ?? '',
        address: (settings.address as string) ?? '',
      })
      setCurrency((settings.currency as string) ?? 'BRL')
      setTimezone((settings.timezone as string) ?? 'America/Sao_Paulo')
      setLanguage((settings.language as string) ?? 'pt-BR')
    }
  }, [tenant, labForm])

  // ── Mutations ─────────────────────────────────────────────────
  const updateTenantMutation = trpc.tenant.update.useMutation({
    onSuccess: () => {
      toast.success('Dados do laboratorio salvos!')
      utils.tenant.getCurrent.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  const updateSettingsMutation = trpc.tenant.updateSettings.useMutation({
    onSuccess: () => {
      toast.success('Preferencias salvas!')
      utils.tenant.getCurrent.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  const deactivateBranchMutation = trpc.branch.deactivate.useMutation({
    onSuccess: () => {
      toast.success('Filial desativada')
      utils.branch.list.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  const reactivateBranchMutation = trpc.branch.reactivate.useMutation({
    onSuccess: () => {
      toast.success('Filial reativada')
      utils.branch.list.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  // ── Handlers ──────────────────────────────────────────────────
  const handleSaveLab = (values: LabFormValues) => {
    updateTenantMutation.mutate({
      name: values.name,
      settings: {
        document: values.document,
        phone: values.phone,
        email: values.email,
        address: values.address,
      },
    })
  }

  const handleSavePreferences = () => {
    updateSettingsMutation.mutate({ currency, timezone, language })
  }

  const branches = branchData?.items ?? []

  if (tenantLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-[22px] font-bold text-[#1c1d21]">Configuracoes</h1>
          <p className="text-[14px] text-[#8181a5] mt-0.5">Dados e configuracoes do laboratorio.</p>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-[#f0f0f3] p-5 h-48 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#1c1d21]">Configuracoes</h1>
        <p className="text-[14px] text-[#8181a5] mt-0.5">
          Dados e configuracoes do laboratorio.
        </p>
      </div>

      {/* ── Secao 1: Dados do Laboratorio ─────────────────────────── */}
      <form onSubmit={labForm.handleSubmit(handleSaveLab)} className="bg-white rounded-xl border border-[#f0f0f3] p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="h-8 w-8 rounded-lg bg-[rgba(94,129,244,0.1)] flex items-center justify-center">
            <Building2 className="h-4 w-4 text-[#5e81f4]" />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-[#1c1d21]">Dados do Laboratorio</h2>
            <p className="text-[12px] text-[#8181a5]">Informacoes que aparecem nos documentos e portal.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-[#8181a5]">Nome do Laboratorio *</Label>
              <Input {...labForm.register('name')} />
              {labForm.formState.errors.name && (
                <p className="text-[11px] text-destructive">{labForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-[#8181a5]">CNPJ</Label>
              <Input {...labForm.register('document')} placeholder="00.000.000/0001-00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-[#8181a5]">
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> Telefone</span>
              </Label>
              <Input {...labForm.register('phone')} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-[#8181a5]">
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> E-mail</span>
              </Label>
              <Input {...labForm.register('email')} type="email" placeholder="contato@lab.com.br" />
              {labForm.formState.errors.email && (
                <p className="text-[11px] text-destructive">{labForm.formState.errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-[#8181a5]">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Endereco</span>
            </Label>
            <Input {...labForm.register('address')} placeholder="Endereco completo" />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateTenantMutation.isPending} size="sm">
              {updateTenantMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar dados
            </Button>
          </div>
        </div>
      </form>

      {/* ── Secao 2: Preferencias ─────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#f0f0f3] p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="h-8 w-8 rounded-lg bg-[rgba(94,129,244,0.1)] flex items-center justify-center">
            <Globe className="h-4 w-4 text-[#5e81f4]" />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-[#1c1d21]">Preferencias</h2>
            <p className="text-[12px] text-[#8181a5]">Configuracoes regionais e de exibicao.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-[#8181a5]">Moeda</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-[#8181a5]">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Fuso horario</span>
              </Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-[#8181a5]">Idioma</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSavePreferences} disabled={updateSettingsMutation.isPending} size="sm">
              {updateSettingsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar preferencias
            </Button>
          </div>
        </div>
      </div>

      {/* ── Secao 3: Filiais ──────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#f0f0f3] p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[rgba(94,129,244,0.1)] flex items-center justify-center">
              <Building2 className="h-4 w-4 text-[#5e81f4]" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-[#1c1d21]">Filiais</h2>
              <p className="text-[12px] text-[#8181a5]">Gerencie as filiais do laboratorio.</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingBranch(undefined)
              setBranchDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Filial
          </Button>
        </div>

        {branchLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 bg-[#f5f5fa] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[13px] text-[#8181a5]">Nenhuma filial cadastrada.</p>
          </div>
        ) : (
          <div className="border border-[#f0f0f3] rounded-lg overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#f5f5fa] text-[12px] text-[#8181a5] font-semibold">
                  <th className="text-left px-4 py-2.5">Nome</th>
                  <th className="text-left px-4 py-2.5">Endereco</th>
                  <th className="text-left px-4 py-2.5">Responsavel</th>
                  <th className="text-center px-4 py-2.5">Status</th>
                  <th className="text-center px-4 py-2.5">Casos</th>
                  <th className="text-right px-4 py-2.5">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch: {
                  id: string
                  name: string
                  address: string | null
                  managerName: string | null
                  cpfCnpj: string | null
                  active: boolean
                  casesCount: number
                  equipmentCount: number
                }) => (
                  <tr key={branch.id} className="border-t border-[#f0f0f3] hover:bg-[#fafafe] transition-colors">
                    <td className="px-4 py-3 font-medium text-[#1c1d21]">{branch.name}</td>
                    <td className="px-4 py-3 text-[#8181a5]">{branch.address || '—'}</td>
                    <td className="px-4 py-3 text-[#8181a5]">{branch.managerName || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      {branch.active
                        ? <span className="inline-flex items-center gap-1 text-[#1a7a4a] text-[11px] font-medium"><CheckCircle2 className="h-3.5 w-3.5" /> Ativa</span>
                        : <span className="inline-flex items-center gap-1 text-[#8181a5] text-[11px] font-medium"><XCircle className="h-3.5 w-3.5" /> Inativa</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-center text-[#8181a5]">{branch.casesCount}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-[#f5f5fa] transition-colors">
                            <MoreHorizontal className="h-4 w-4 text-[#8181a5]" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingBranch({
                                id: branch.id,
                                name: branch.name,
                                address: branch.address,
                                managerName: branch.managerName,
                                cpfCnpj: branch.cpfCnpj,
                              })
                              setBranchDialogOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {branch.active ? (
                            <DropdownMenuItem
                              onClick={() => {
                                if (confirm(`Desativar filial ${branch.name}?`)) {
                                  deactivateBranchMutation.mutate({ id: branch.id })
                                }
                              }}
                              className="text-destructive"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Desativar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => reactivateBranchMutation.mutate({ id: branch.id })}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Reativar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Secao 4: Tabelas de Preco ──────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#f0f0f3] p-5">
        <PriceTableManager />
      </div>

      {/* Branch Dialog */}
      <BranchFormDialog
        open={branchDialogOpen}
        onOpenChange={setBranchDialogOpen}
        editData={editingBranch}
      />
    </div>
  )
}
