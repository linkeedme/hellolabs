'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Loader2, Send } from 'lucide-react'

interface Comment {
  id: string
  content: string
  isInternal: boolean
  createdAt: string | Date
  user: { id: string; name: string; avatarUrl: string | null }
}

interface CommentThreadProps {
  caseId: string
  comments: Comment[]
  showInternalToggle?: boolean
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function timeAgo(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin}min`
  if (diffHrs < 24) return `${diffHrs}h`
  if (diffDays < 30) return `${diffDays}d`
  return new Date(date).toLocaleDateString('pt-BR')
}

export function CommentThread({ caseId, comments, showInternalToggle = true }: CommentThreadProps) {
  const [content, setContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)

  const utils = trpc.useUtils()

  const addComment = trpc.case.addComment.useMutation({
    onSuccess: () => {
      setContent('')
      utils.case.getById.invalidate({ id: caseId })
      toast.success('Comentario adicionado!')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    addComment.mutate({ caseId, content: content.trim(), isInternal })
  }

  return (
    <div className="space-y-4">
      {/* Comment list */}
      <div className="space-y-3">
        {comments.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">Nenhum comentario ainda.</p>
        )}
        {comments.map((comment) => (
          <div
            key={comment.id}
            className={cn(
              'flex gap-3 rounded-lg border p-3',
              comment.isInternal && 'border-l-2 border-l-amber-400 bg-amber-50/50 dark:bg-amber-950/20',
            )}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{getInitials(comment.user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{comment.user.name}</span>
                <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                {comment.isInternal && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300">
                    Interno
                  </Badge>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escreva um comentario..."
          rows={3}
        />
        <div className="flex items-center justify-between">
          {showInternalToggle && (
            <div className="flex items-center gap-2">
              <Switch
                id="internal"
                checked={isInternal}
                onCheckedChange={setIsInternal}
              />
              <Label htmlFor="internal" className="text-sm text-muted-foreground">
                Comentario interno (visivel apenas no lab)
              </Label>
            </div>
          )}
          <Button type="submit" size="sm" disabled={!content.trim() || addComment.isPending}>
            {addComment.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Enviar
          </Button>
        </div>
      </form>
    </div>
  )
}
