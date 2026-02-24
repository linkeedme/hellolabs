'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { StatusBadge, getCaseStatusBadge, getPriorityBadge } from '@/components/shared/status-badge'
import { StageTimeline } from '@/components/cases/stage-timeline'
import { CommentThread } from '@/components/cases/comment-thread'
import { trpc } from '@/lib/trpc/client'
import { getProsthesisTypeById } from '@/lib/constants/prosthesis-types'
import { formatDate, formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import {
  ArrowLeft,
  Loader2,
  Truck,
  Ban,
  FileText,
  User,
  Calendar,
  Palette,
  Activity,
} from 'lucide-react'

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const { data: caseData, isLoading } = trpc.case.getById.useQuery({ id })
  const { data: auditLog } = trpc.case.getAuditLog.useQuery({ caseId: id })

  const [deliveryMethod, setDeliveryMethod] = useState('')

  const utils = trpc.useUtils()

  const deliverMutation = trpc.case.deliver.useMutation({
    onSuccess: () => {
      toast.success('Caso marcado como entregue!')
      utils.case.getById.invalidate({ id })
    },
    onError: (e) => toast.error(e.message),
  })

  const cancelMutation = trpc.case.cancel.useMutation({
    onSuccess: () => {
      toast.success('Caso cancelado.')
      utils.case.getById.invalidate({ id })
    },
    onError: (e) => toast.error(e.message),
  })

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Caso nao encontrado.</p>
        <Link href="/cases" className="text-primary hover:underline">Voltar aos casos</Link>
      </div>
    )
  }

  const statusInfo = getCaseStatusBadge(caseData.status)
  const priorityInfo = getPriorityBadge(caseData.priority)
  const prosthesisType = getProsthesisTypeById(caseData.prosthesisType)
  const completedStages = caseData.stages.filter((s) => s.status === 'COMPLETED' || s.status === 'SKIPPED').length
  const totalStages = caseData.stages.length
  const progress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0

  const canManage = caseData.status !== 'DELIVERED' && caseData.status !== 'CANCELLED'

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cases"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[20px] font-bold text-[#1c1d21]">#{caseData.caseNumber} {caseData.patientName}</h1>
              <StatusBadge label={statusInfo.label} variant={statusInfo.variant} />
              {caseData.priority !== 'NORMAL' && (
                <StatusBadge label={priorityInfo.label} variant={priorityInfo.variant} />
              )}
            </div>
            <p className="text-[13px] text-[#8181a5] mt-0.5">
              {prosthesisType?.name ?? caseData.prosthesisType} — {caseData.client.name}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        {canManage && (
          <div className="flex gap-2">
            {/* Deliver */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Truck className="mr-2 h-4 w-4" />
                  Entregar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Marcar como Entregue</DialogTitle>
                  <DialogDescription>
                    Confirme o metodo de entrega para o caso #{caseData.caseNumber}.
                  </DialogDescription>
                </DialogHeader>
                <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Metodo de entrega" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entregador">Entregador</SelectItem>
                    <SelectItem value="Retirada no lab">Retirada no lab</SelectItem>
                    <SelectItem value="Correios">Correios</SelectItem>
                    <SelectItem value="Motoboy">Motoboy</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <DialogFooter>
                  <Button
                    onClick={() => deliverMutation.mutate({ id, deliveryMethod })}
                    disabled={!deliveryMethod || deliverMutation.isPending}
                  >
                    {deliverMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmar Entrega
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Cancel */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Ban className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancelar Caso</DialogTitle>
                  <DialogDescription>
                    Tem certeza? Esta acao nao pode ser desfeita.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="destructive"
                    onClick={() => cancelMutation.mutate({ id })}
                    disabled={cancelMutation.isPending}
                  >
                    {cancelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cancelar Caso
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Informacoes</TabsTrigger>
          <TabsTrigger value="stages">Etapas</TabsTrigger>
          <TabsTrigger value="files">Arquivos</TabsTrigger>
          <TabsTrigger value="comments">
            Comentarios ({caseData.comments.length})
          </TabsTrigger>
          <TabsTrigger value="history">Historico</TabsTrigger>
        </TabsList>

        {/* TAB: Info */}
        <TabsContent value="info" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Patient & Client */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" /> Paciente e Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow label="Paciente" value={caseData.patientName} />
                {caseData.patientDob && (
                  <InfoRow label="Nascimento" value={formatDate(new Date(caseData.patientDob))} />
                )}
                <InfoRow label="Cliente" value={caseData.client.name} />
                {caseData.client.email && <InfoRow label="Email" value={caseData.client.email} />}
                {caseData.client.phone && <InfoRow label="Telefone" value={caseData.client.phone} />}
              </CardContent>
            </Card>

            {/* Prosthesis info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Palette className="h-4 w-4" /> Protese
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow label="Tipo" value={prosthesisType?.name ?? caseData.prosthesisType} />
                {caseData.subtype && <InfoRow label="Subtipo" value={caseData.subtype} />}
                <InfoRow label="Modalidade" value={caseData.modality} />
                {caseData.shade && <InfoRow label="Cor" value={caseData.shade} />}
                {caseData.teeth.length > 0 && (
                  <InfoRow label="Dentes" value={caseData.teeth.join(', ')} />
                )}
              </CardContent>
            </Card>

            {/* Dates & SLA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" /> Datas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow label="Recebido" value={formatDate(new Date(caseData.receivedAt))} />
                {caseData.slaDate && <InfoRow label="SLA" value={formatDate(new Date(caseData.slaDate))} />}
                {caseData.deliveredAt && <InfoRow label="Entregue" value={formatDate(new Date(caseData.deliveredAt))} />}
                {caseData.deliveryMethod && <InfoRow label="Metodo" value={caseData.deliveryMethod} />}
              </CardContent>
            </Card>

            {/* Values */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" /> Valores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {caseData.osValue && (
                  <InfoRow label="Valor OS" value={`R$ ${Number(caseData.osValue).toFixed(2)}`} />
                )}
                {caseData.materialCost && (
                  <InfoRow label="Custo Material" value={`R$ ${Number(caseData.materialCost).toFixed(2)}`} />
                )}
                {caseData.notes && <InfoRow label="Observacoes" value={caseData.notes} />}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: Stages */}
        <TabsContent value="stages">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4" /> Etapas de Producao
                </CardTitle>
                <span className="text-sm text-muted-foreground">{progress}% concluido</span>
              </div>
              {/* Progress bar */}
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <StageTimeline caseId={id} stages={caseData.stages} canManage={canManage} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Files */}
        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Arquivos</CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.files.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhum arquivo enviado ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {caseData.files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between rounded border p-3">
                      <div>
                        <p className="text-sm font-medium">{file.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.fileType} — v{file.version}
                          {file.fileSize && ` — ${(file.fileSize / 1024 / 1024).toFixed(1)} MB`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* File upload will be added in Phase E */}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Comments */}
        <TabsContent value="comments">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comentarios</CardTitle>
            </CardHeader>
            <CardContent>
              <CommentThread caseId={id} comments={caseData.comments} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: History */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historico de Auditoria</CardTitle>
            </CardHeader>
            <CardContent>
              {!auditLog || auditLog.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Nenhum registro.</p>
              ) : (
                <div className="space-y-3">
                  {auditLog.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 text-sm">
                      <div className="h-2 w-2 mt-1.5 rounded-full bg-muted-foreground/50" />
                      <div>
                        <p>
                          <span className="font-medium">{log.user?.name ?? 'Sistema'}</span>
                          {' — '}
                          <span className="text-muted-foreground">{log.action}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(new Date(log.createdAt))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}
