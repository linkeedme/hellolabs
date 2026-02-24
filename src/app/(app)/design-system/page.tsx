'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { StatusBadge, getCaseStatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { toast } from 'sonner'
import {
  Palette,
  Type,
  Square,
  MousePointerClick,
  FormInput,
  LayoutGrid,
  Bell,
  Loader,
  BoxSelect,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { tokens } from '@/design-system/tokens'

export default function DesignSystemPage() {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Design System</h1>
        <p className="text-muted-foreground">
          Componentes, cores, tipografia e padroes visuais do Hello Labs.
        </p>
      </div>

      <Tabs defaultValue="colors">
        <TabsList className="flex-wrap">
          <TabsTrigger value="colors"><Palette className="mr-1.5 h-3.5 w-3.5" />Cores</TabsTrigger>
          <TabsTrigger value="typography"><Type className="mr-1.5 h-3.5 w-3.5" />Tipografia</TabsTrigger>
          <TabsTrigger value="buttons"><MousePointerClick className="mr-1.5 h-3.5 w-3.5" />Botoes</TabsTrigger>
          <TabsTrigger value="inputs"><FormInput className="mr-1.5 h-3.5 w-3.5" />Inputs</TabsTrigger>
          <TabsTrigger value="cards"><LayoutGrid className="mr-1.5 h-3.5 w-3.5" />Cards</TabsTrigger>
          <TabsTrigger value="badges"><Square className="mr-1.5 h-3.5 w-3.5" />Badges</TabsTrigger>
          <TabsTrigger value="alerts"><Bell className="mr-1.5 h-3.5 w-3.5" />Alerts</TabsTrigger>
          <TabsTrigger value="loading"><Loader className="mr-1.5 h-3.5 w-3.5" />Loading</TabsTrigger>
          <TabsTrigger value="empty"><BoxSelect className="mr-1.5 h-3.5 w-3.5" />Empty States</TabsTrigger>
        </TabsList>

        {/* CORES */}
        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paleta de Cores</CardTitle>
              <CardDescription>Cores provisionais — serao atualizadas quando o design for definido.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-semibold">Primary</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(tokens.colors.primary).filter(([k]) => k !== 'DEFAULT').map(([shade, hex]) => (
                    <div key={shade} className="text-center">
                      <div className="h-12 w-12 rounded-lg border" style={{ backgroundColor: hex }} />
                      <span className="mt-1 text-[10px] text-muted-foreground">{shade}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-3 text-sm font-semibold">Semanticas</h3>
                <div className="grid gap-4 sm:grid-cols-4">
                  {(['success', 'warning', 'error', 'info'] as const).map((name) => (
                    <div key={name}>
                      <span className="text-xs font-medium capitalize">{name}</span>
                      <div className="mt-1 flex gap-1">
                        {Object.entries(tokens.colors[name]).filter(([k]) => k !== 'DEFAULT').map(([shade, hex]) => (
                          <div key={shade} className="h-8 w-8 rounded border" style={{ backgroundColor: hex }} title={`${name}-${shade}: ${hex}`} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-3 text-sm font-semibold">CSS Variables (ativas no tema)</h3>
                <div className="grid gap-2 sm:grid-cols-3">
                  {['primary', 'secondary', 'accent', 'muted', 'destructive', 'background', 'foreground', 'card', 'popover', 'border'].map((name) => (
                    <div key={name} className="flex items-center gap-2">
                      <div className={`h-6 w-6 rounded border bg-${name}`} />
                      <span className="text-xs text-muted-foreground">--{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TIPOGRAFIA */}
        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tipografia</CardTitle>
              <CardDescription>Fonte: Inter. Escala e pesos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-4xl font-bold">Heading 4XL (36px Bold)</div>
              <div className="text-3xl font-bold">Heading 3XL (30px Bold)</div>
              <div className="text-2xl font-semibold">Heading 2XL (24px Semibold)</div>
              <div className="text-xl font-semibold">Heading XL (20px Semibold)</div>
              <div className="text-lg font-medium">Heading LG (18px Medium)</div>
              <Separator />
              <div className="text-base">Body Base (16px Regular)</div>
              <div className="text-sm">Body SM (14px Regular)</div>
              <div className="text-xs">Caption XS (12px Regular)</div>
              <Separator />
              <div className="text-sm font-medium">Label (14px Medium)</div>
              <div className="text-sm text-muted-foreground">Muted text (14px Muted)</div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BOTOES */}
        <TabsContent value="buttons" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Botoes</CardTitle>
              <CardDescription>Variantes e tamanhos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-semibold">Variantes</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="default">Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="mb-3 text-sm font-semibold">Tamanhos</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon"><Palette className="h-4 w-4" /></Button>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="mb-3 text-sm font-semibold">Estados</h3>
                <div className="flex flex-wrap gap-3">
                  <Button>Normal</Button>
                  <Button disabled>Disabled</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INPUTS */}
        <TabsContent value="inputs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inputs e Formularios</CardTitle>
            </CardHeader>
            <CardContent className="max-w-md space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ds-name">Nome</Label>
                <Input id="ds-name" placeholder="Digite seu nome" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ds-email">Email</Label>
                <Input id="ds-email" type="email" placeholder="seu@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ds-disabled">Desabilitado</Label>
                <Input id="ds-disabled" placeholder="Nao editavel" disabled />
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <Checkbox id="ds-check" />
                <Label htmlFor="ds-check">Concordo com os termos</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="ds-switch" />
                <Label htmlFor="ds-switch">Notificacoes por email</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CARDS */}
        <TabsContent value="cards" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Card Padrao</CardTitle>
                <CardDescription>Descricao do card.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Conteudo do card.</p>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle>Card Destaque</CardTitle>
                <CardDescription>Com cor de fundo.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Conteudo destacado.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Metrica</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">42</div>
                <p className="text-xs text-muted-foreground">+12% vs mes anterior</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* BADGES */}
        <TabsContent value="badges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Badges e Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-semibold">shadcn/ui Badge</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="mb-3 text-sm font-semibold">Status Badges (custom)</h3>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label="Sucesso" variant="success" />
                  <StatusBadge label="Alerta" variant="warning" />
                  <StatusBadge label="Erro" variant="error" />
                  <StatusBadge label="Info" variant="info" />
                  <StatusBadge label="Inativo" variant="muted" />
                  <StatusBadge label="Padrao" variant="default" />
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="mb-3 text-sm font-semibold">Status de Caso</h3>
                <div className="flex flex-wrap gap-2">
                  {['OPEN', 'IN_PROGRESS', 'WAITING_APPROVAL', 'APPROVED', 'REVISION', 'READY', 'DELIVERED', 'CANCELLED'].map((s) => {
                    const badge = getCaseStatusBadge(s)
                    return <StatusBadge key={s} label={badge.label} variant={badge.variant} />
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ALERTS */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alerts e Toast</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Informacao</AlertTitle>
                <AlertDescription>Esta e uma mensagem informativa.</AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>Algo deu errado.</AlertDescription>
              </Alert>
              <Separator />
              <div>
                <h3 className="mb-3 text-sm font-semibold">Toast (Sonner)</h3>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => toast.success('Sucesso!')}>
                    <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Success
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toast.error('Erro ao salvar.')}>
                    <XCircle className="mr-1.5 h-3.5 w-3.5" /> Error
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toast.warning('Atencao!')}>
                    <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Warning
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toast.info('Informacao.')}>
                    <Info className="mr-1.5 h-3.5 w-3.5" /> Info
                  </Button>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="mb-3 text-sm font-semibold">Confirm Dialog</h3>
                <Button size="sm" variant="destructive" onClick={() => setConfirmOpen(true)}>
                  Deletar item (abre dialog)
                </Button>
                <ConfirmDialog
                  open={confirmOpen}
                  onOpenChange={setConfirmOpen}
                  title="Deletar item?"
                  description="Esta acao nao pode ser desfeita."
                  confirmLabel="Deletar"
                  variant="destructive"
                  onConfirm={() => {
                    toast.success('Item deletado!')
                    setConfirmOpen(false)
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LOADING */}
        <TabsContent value="loading" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Loading States</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-semibold">Skeleton</h3>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EMPTY STATES */}
        <TabsContent value="empty" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={BoxSelect}
                title="Nenhum resultado"
                description="Nao encontramos nenhum item com os filtros selecionados."
                actionLabel="Limpar filtros"
                onAction={() => toast.info('Filtros limpos!')}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
