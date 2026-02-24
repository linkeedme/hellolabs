'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

import { TeethSelector } from './teeth-selector'
import { trpc } from '@/lib/trpc/client'
import { caseCreateSchema } from '@/lib/validators/case'
import type { z } from 'zod'

// Use input type (before transforms/defaults) for the form
type CaseFormValues = z.input<typeof caseCreateSchema>
import {
  PROSTHESIS_TYPES,
  PROSTHESIS_CATEGORIES,
  getProsthesisTypeById,
  type ProsthesisType,
} from '@/lib/constants/prosthesis-types'
import { formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from 'lucide-react'

interface CaseFormProps {
  mode: 'create' | 'edit'
  defaultValues?: Partial<CaseFormValues>
  onSubmit: (data: CaseFormValues) => void
  isLoading?: boolean
}

// Group prosthesis types by category
const groupedTypes = Object.entries(PROSTHESIS_CATEGORIES).map(([key, label]) => ({
  category: key as ProsthesisType['category'],
  label,
  types: PROSTHESIS_TYPES.filter((t) => t.category === key),
}))

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    const dow = result.getDay()
    if (dow !== 0 && dow !== 6) added++
  }
  return result
}

export function CaseForm({ mode, defaultValues, onSubmit, isLoading }: CaseFormProps) {
  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseCreateSchema),
    defaultValues: {
      clientId: '',
      patientName: '',
      prosthesisType: '',
      modality: 'ANALOG',
      teeth: [],
      priority: 'NORMAL',
      ...defaultValues,
    },
  })

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form

  const prosthesisTypeId = watch('prosthesisType')
  const selectedType = prosthesisTypeId ? getProsthesisTypeById(prosthesisTypeId) : null
  const teeth = watch('teeth')
  const slaDate = watch('slaDate')
  const clientId = watch('clientId')
  const priority = watch('priority')
  const modality = watch('modality')

  // Fetch clients and team members
  const { data: clientsData } = trpc.clients.list.useQuery({ page: 1, perPage: 100 })
  const { data: teamData } = trpc.team.list.useQuery()

  const clients = clientsData?.items ?? []
  const members = teamData ?? []

  // Auto-update SLA when prosthesis type changes
  const handleProsthesisTypeChange = (typeId: string) => {
    setValue('prosthesisType', typeId)
    const type = getProsthesisTypeById(typeId)
    if (type && !slaDate) {
      setValue('slaDate', addBusinessDays(new Date(), type.estimatedDays))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 1. Cliente e Paciente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cliente e Paciente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {/* Client selector */}
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn('w-full justify-between', !clientId && 'text-muted-foreground')}
                >
                  {clientId
                    ? clients.find((c) => c.id === clientId)?.name ?? 'Selecionar...'
                    : 'Selecionar cliente...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar cliente..." />
                  <CommandList>
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                      {clients.map((client) => (
                        <CommandItem
                          key={client.id}
                          value={client.name}
                          onSelect={() => setValue('clientId', client.id)}
                        >
                          <Check className={cn('mr-2 h-4 w-4', clientId === client.id ? 'opacity-100' : 'opacity-0')} />
                          {client.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.clientId && <p className="text-sm text-destructive">{errors.clientId.message}</p>}
          </div>

          {/* Patient name */}
          <div className="space-y-2">
            <Label htmlFor="patientName">Paciente *</Label>
            <Input id="patientName" placeholder="Nome do paciente" {...register('patientName')} />
            {errors.patientName && <p className="text-sm text-destructive">{errors.patientName.message}</p>}
          </div>

          {/* Patient DOB */}
          <div className="space-y-2">
            <Label>Data de Nascimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !watch('patientDob') && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watch('patientDob') ? formatDate(new Date(watch('patientDob') as string | Date)) : 'Selecionar...'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={watch('patientDob') ? new Date(watch('patientDob') as string | Date) : undefined}
                  onSelect={(date) => setValue('patientDob', date ?? null)}
                  captionLayout="dropdown"
                  fromYear={1920}
                  toYear={new Date().getFullYear()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* 2. Tipo de Protese */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tipo de Protese</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={prosthesisTypeId} onValueChange={handleProsthesisTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar tipo..." />
              </SelectTrigger>
              <SelectContent>
                {groupedTypes.map((group) => (
                  <SelectGroup key={group.category}>
                    <SelectLabel>{group.label}</SelectLabel>
                    {group.types.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            {errors.prosthesisType && <p className="text-sm text-destructive">{errors.prosthesisType.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtype">Subtipo</Label>
            <Input id="subtype" placeholder="Ex: e.max, zirconia..." {...register('subtype')} />
          </div>

          {/* Modality */}
          <div className="space-y-2 sm:col-span-2">
            <Label>Modalidade</Label>
            <RadioGroup
              value={modality}
              onValueChange={(val) => setValue('modality', val as CaseFormValues['modality'])}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ANALOG" id="mod-analog" />
                <Label htmlFor="mod-analog" className="font-normal">Analogico</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="DIGITAL" id="mod-digital" />
                <Label htmlFor="mod-digital" className="font-normal">Digital</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="HYBRID" id="mod-hybrid" />
                <Label htmlFor="mod-hybrid" className="font-normal">Hibrido</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* 3. Dentes e Cor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dentes e Cor</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <TeethSelector
            value={teeth ?? []}
            onChange={(t) => setValue('teeth', t)}
          />
          <div className="max-w-xs space-y-2">
            <Label htmlFor="shade">Cor / Escala</Label>
            <Input id="shade" placeholder="Ex: A2, B1, OM3..." {...register('shade')} />
          </div>
        </CardContent>
      </Card>

      {/* 4. Prioridade e SLA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prioridade e Prazo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <RadioGroup
              value={priority}
              onValueChange={(val) => setValue('priority', val as CaseFormValues['priority'])}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="NORMAL" id="pri-normal" />
                <Label htmlFor="pri-normal" className="font-normal">Normal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="URGENT" id="pri-urgent" />
                <Label htmlFor="pri-urgent" className="font-normal text-amber-600">Urgente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CRITICAL" id="pri-critical" />
                <Label htmlFor="pri-critical" className="font-normal text-red-600">Critico</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Data SLA</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !slaDate && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {slaDate ? formatDate(new Date(slaDate as string | Date)) : 'Automatico pelo tipo'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={slaDate ? new Date(slaDate as string | Date) : undefined}
                  onSelect={(date) => setValue('slaDate', date ?? null)}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
            {selectedType && !slaDate && (
              <p className="text-xs text-muted-foreground">SLA padrao: {selectedType.estimatedDays} dias uteis</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 5. Atribuicao */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atribuicao</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm space-y-2">
            <Label>Responsavel</Label>
            <Select
              value={watch('assignedTo') ?? '__none__'}
              onValueChange={(val) => setValue('assignedTo', val === '__none__' ? null : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nao atribuido" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nao atribuido</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    {m.name} ({m.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 6. Valores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Valores</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="osValue">Valor OS (R$)</Label>
            <Input
              id="osValue"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              {...register('osValue', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="materialCost">Custo Material (R$)</Label>
            <Input
              id="materialCost"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              {...register('materialCost', { valueAsNumber: true })}
            />
          </div>
        </CardContent>
      </Card>

      {/* 7. Observacoes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observacoes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Instrucoes especiais, detalhes do caso..."
            rows={4}
            {...register('notes')}
          />
          {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
        </CardContent>
      </Card>

      {/* 8. Preview Etapas */}
      {selectedType && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Etapas de Producao</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-sm text-muted-foreground">
              {selectedType.name} — {selectedType.defaultStages.length} etapas
            </p>
            <ol className="list-inside list-decimal space-y-1 text-sm">
              {selectedType.defaultStages.map((stage, i) => (
                <li key={i} className="text-muted-foreground">{stage}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Criar Caso' : 'Salvar Alteracoes'}
        </Button>
      </div>
    </form>
  )
}
