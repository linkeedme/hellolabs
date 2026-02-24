'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Send,
  FileText,
  Calendar,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { StatusBadge, getCaseStatusBadge, getPriorityBadge } from '@/components/shared/status-badge'
import { CaseTimeline } from '@/components/portal/case-timeline'

export default function PortalCaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const caseId = params.id as string

  const [commentText, setCommentText] = useState('')
  const [rejectNotes, setRejectNotes] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  const utils = trpc.useUtils()

  const { data: caseData, isLoading } = trpc.portal.caseDetail.useQuery({ caseId })

  const approveMutation = trpc.portal.approve.useMutation({
    onSuccess: () => {
      utils.portal.caseDetail.invalidate({ caseId })
      utils.portal.cases.invalidate()
      setShowRejectDialog(false)
      setRejectNotes('')
    },
  })

  const commentMutation = trpc.portal.addComment.useMutation({
    onSuccess: () => {
      utils.portal.caseDetail.invalidate({ caseId })
      setCommentText('')
    },
  })

  if (isLoading) {
    return (
      <div className="text-center py-20 text-[#8181a5] text-[13px]">Carregando...</div>
    )
  }

  if (!caseData) {
    return (
      <div className="text-center py-20">
        <p className="text-[15px] font-medium text-[#1c1d21]">Caso nao encontrado</p>
        <Link
          href={`/portal/${slug}/cases`}
          className="text-[13px] text-[#5e81f4] hover:underline mt-2 inline-block"
        >
          Voltar para meus casos
        </Link>
      </div>
    )
  }

  const statusBadge = getCaseStatusBadge(caseData.status)
  const priorityBadge = getPriorityBadge(caseData.priority)
  const isWaitingApproval = caseData.status === 'WAITING_APPROVAL'

  return (
    <div className="space-y-6">
      {/* ── Back + Header ─────────────────────────── */}
      <div>
        <Link
          href={`/portal/${slug}/cases`}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#8181a5] hover:text-[#5e81f4] transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1c1d21]">
              Caso #{caseData.caseNumber}
            </h1>
            <p className="text-[13px] text-[#8181a5] mt-0.5">
              {caseData.prosthesisType}
              {caseData.subtype && ` — ${caseData.subtype}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge label={priorityBadge.label} variant={priorityBadge.variant} />
            <StatusBadge label={statusBadge.label} variant={statusBadge.variant} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left: Case Info + Comments ───────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Case Info */}
          <div className="bg-white rounded-xl border border-[#f0f0f3] p-5">
            <h2 className="text-[15px] font-bold text-[#1c1d21] mb-4">Informacoes</h2>
            <div className="grid grid-cols-2 gap-4 text-[13px]">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[#8181a5]" />
                <div>
                  <p className="text-[#8181a5]">Paciente</p>
                  <p className="font-medium text-[#1c1d21]">{caseData.patientName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#8181a5]" />
                <div>
                  <p className="text-[#8181a5]">Modalidade</p>
                  <p className="font-medium text-[#1c1d21]">{caseData.modality}</p>
                </div>
              </div>
              {caseData.shade && (
                <div>
                  <p className="text-[#8181a5]">Cor</p>
                  <p className="font-medium text-[#1c1d21]">{caseData.shade}</p>
                </div>
              )}
              {caseData.teeth.length > 0 && (
                <div>
                  <p className="text-[#8181a5]">Dentes</p>
                  <p className="font-medium text-[#1c1d21]">{caseData.teeth.join(', ')}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#8181a5]" />
                <div>
                  <p className="text-[#8181a5]">Recebido em</p>
                  <p className="font-medium text-[#1c1d21]">
                    {format(new Date(caseData.receivedAt), 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>
              {caseData.slaDate && (
                <div>
                  <p className="text-[#8181a5]">Prazo (SLA)</p>
                  <p className="font-medium text-[#1c1d21]">
                    {format(new Date(caseData.slaDate), 'dd/MM/yyyy')}
                  </p>
                </div>
              )}
            </div>
            {caseData.notes && (
              <div className="mt-4 pt-4 border-t border-[#f5f5fa]">
                <p className="text-[12px] text-[#8181a5] mb-1">Observacoes</p>
                <p className="text-[13px] text-[#1c1d21]">{caseData.notes}</p>
              </div>
            )}
          </div>

          {/* Approve / Reject Actions */}
          {isWaitingApproval && (
            <div className="bg-[rgba(244,190,94,0.1)] rounded-xl border border-[#f4be5e] p-5">
              <h2 className="text-[15px] font-bold text-[#1c1d21] mb-2">Aprovacao Pendente</h2>
              <p className="text-[13px] text-[#8181a5] mb-4">
                Este caso esta aguardando sua aprovacao. Verifique os detalhes e decida.
              </p>
              {showRejectDialog ? (
                <div className="space-y-3">
                  <textarea
                    placeholder="Motivo da rejeicao..."
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    className="w-full h-20 px-3 py-2 rounded-lg border border-[#f0f0f3] bg-white text-[13px] text-[#1c1d21] placeholder:text-[#8181a5] focus:outline-none focus:ring-2 focus:ring-[#ff808b]/30 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        approveMutation.mutate({
                          caseId,
                          action: 'reject',
                          notes: rejectNotes || undefined,
                        })
                      }}
                      disabled={approveMutation.isPending}
                      className="h-9 px-4 rounded-lg bg-[#ff808b] text-white text-[13px] font-bold hover:bg-[#e06b76] transition-colors disabled:opacity-50"
                    >
                      {approveMutation.isPending ? 'Enviando...' : 'Confirmar Rejeicao'}
                    </button>
                    <button
                      onClick={() => { setShowRejectDialog(false); setRejectNotes('') }}
                      className="h-9 px-4 rounded-lg border border-[#f0f0f3] bg-white text-[13px] text-[#8181a5] hover:bg-[#f5f5fa] transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => approveMutation.mutate({ caseId, action: 'approve' })}
                    disabled={approveMutation.isPending}
                    className="h-10 px-5 rounded-lg bg-[#7ce7ac] text-[#1a7a4a] text-[13px] font-bold hover:bg-[#6dd69d] transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {approveMutation.isPending ? 'Aprovando...' : 'Aprovar'}
                  </button>
                  <button
                    onClick={() => setShowRejectDialog(true)}
                    disabled={approveMutation.isPending}
                    className="h-10 px-5 rounded-lg bg-white border border-[#ff808b] text-[#cc2d3a] text-[13px] font-bold hover:bg-[rgba(255,128,139,0.1)] transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Rejeitar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Files */}
          {caseData.files.length > 0 && (
            <div className="bg-white rounded-xl border border-[#f0f0f3] p-5">
              <h2 className="text-[15px] font-bold text-[#1c1d21] mb-3">Arquivos</h2>
              <div className="space-y-2">
                {caseData.files.map((f: { id: string; fileName: string; fileType: string; fileUrl: string; createdAt: Date }) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between text-[13px] p-2 rounded-lg bg-[#f5f5fa]"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#5e81f4]" />
                      <span className="text-[#1c1d21] font-medium">{f.fileName}</span>
                    </div>
                    <span className="text-[#8181a5]">{f.fileType}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="bg-white rounded-xl border border-[#f0f0f3] p-5">
            <h2 className="text-[15px] font-bold text-[#1c1d21] mb-4">Comentarios</h2>

            {caseData.comments.length === 0 ? (
              <p className="text-[13px] text-[#8181a5] mb-4">Nenhum comentario ainda.</p>
            ) : (
              <div className="space-y-3 mb-4">
                {caseData.comments.map((c: { id: string; content: string; createdAt: Date; userName: string; userAvatar: string | null }) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-[rgba(94,129,244,0.1)] flex items-center justify-center shrink-0">
                      <span className="text-[#5e81f4] text-[11px] font-bold">
                        {c.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-[#1c1d21]">{c.userName}</span>
                        <span className="text-[11px] text-[#8181a5]">
                          {format(new Date(c.createdAt), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#1c1d21] mt-0.5">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Escreva um comentario..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && commentText.trim()) {
                    commentMutation.mutate({ caseId, content: commentText.trim() })
                  }
                }}
                className="flex-1 h-10 px-3 rounded-lg border border-[#f0f0f3] bg-[#f5f5fa] text-[13px] text-[#1c1d21] placeholder:text-[#8181a5] focus:outline-none focus:ring-2 focus:ring-[#5e81f4]/30 focus:bg-white"
              />
              <button
                onClick={() => {
                  if (commentText.trim()) {
                    commentMutation.mutate({ caseId, content: commentText.trim() })
                  }
                }}
                disabled={!commentText.trim() || commentMutation.isPending}
                className="h-10 w-10 rounded-lg bg-[#5e81f4] text-white flex items-center justify-center hover:bg-[#4d70e0] transition-colors disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: Timeline ─────────────────────── */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-[#f0f0f3] p-5">
            <h2 className="text-[15px] font-bold text-[#1c1d21] mb-4">Etapas</h2>
            <CaseTimeline stages={caseData.stages} />
          </div>

          {/* Quick Info */}
          <div className="bg-white rounded-xl border border-[#f0f0f3] p-5 space-y-3 text-[13px]">
            <h2 className="text-[15px] font-bold text-[#1c1d21]">Resumo</h2>
            <div className="flex justify-between">
              <span className="text-[#8181a5]">Caso</span>
              <span className="font-medium text-[#1c1d21]">#{caseData.caseNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8181a5]">Status</span>
              <StatusBadge label={statusBadge.label} variant={statusBadge.variant} />
            </div>
            <div className="flex justify-between">
              <span className="text-[#8181a5]">Prioridade</span>
              <StatusBadge label={priorityBadge.label} variant={priorityBadge.variant} />
            </div>
            {caseData.slaDate && (
              <div className="flex justify-between">
                <span className="text-[#8181a5]">Prazo</span>
                <span className="font-medium text-[#1c1d21]">
                  {format(new Date(caseData.slaDate), 'dd/MM/yyyy')}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#8181a5]">Etapas</span>
              <span className="font-medium text-[#1c1d21]">
                {caseData.stages.filter((s: { status: string }) => s.status === 'COMPLETED').length} / {caseData.stages.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8181a5]">Comentarios</span>
              <span className="font-medium text-[#1c1d21]">{caseData.comments.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
