'use client'

import { useState } from 'react'
import { Plus, AlertTriangle, Package, XCircle, ArrowUpDown, MoreHorizontal } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { formatMoney, formatDate } from '@/lib/utils/format'
import { PRODUCT_CATEGORIES } from '@/lib/constants/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge, getMovementTypeBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { ProductFormDialog } from '@/components/inventory/product-form-dialog'
import { MovementFormDialog } from '@/components/inventory/movement-form-dialog'
import { SupplierFormDialog } from '@/components/inventory/supplier-form-dialog'
import { toast } from 'sonner'

export default function InventoryPage() {
  const [tab, setTab] = useState('products')

  // Product state
  const [productSearch, setProductSearch] = useState('')
  const [productCategory, setProductCategory] = useState('')
  const [productPage, setProductPage] = useState(1)
  const [productDialogOpen, setProductDialogOpen] = useState(false)

  // Movement state
  const [movementPage, setMovementPage] = useState(1)
  const [movementDialogOpen, setMovementDialogOpen] = useState(false)

  // Supplier state
  const [supplierSearch, setSupplierSearch] = useState('')
  const [supplierPage, setSupplierPage] = useState(1)
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)

  const debouncedProductSearch = useDebounce(productSearch, 300)
  const debouncedSupplierSearch = useDebounce(supplierSearch, 300)

  const utils = trpc.useUtils()

  // Queries
  const { data: productsData, isLoading: productsLoading } = trpc.inventory.product.list.useQuery({
    page: productPage,
    perPage: 20,
    search: debouncedProductSearch || undefined,
    category: productCategory || undefined,
    active: true,
  })

  const { data: alertsData } = trpc.inventory.alerts.useQuery()

  const { data: movementsData, isLoading: movementsLoading } = trpc.inventory.movement.list.useQuery({
    page: movementPage,
    perPage: 20,
  })

  const { data: suppliersData, isLoading: suppliersLoading } = trpc.inventory.supplier.list.useQuery({
    page: supplierPage,
    perPage: 20,
    search: debouncedSupplierSearch || undefined,
    active: true,
  })

  const archiveProductMutation = trpc.inventory.product.archive.useMutation({
    onSuccess: () => {
      toast.success('Produto arquivado!')
      utils.inventory.product.list.invalidate()
      utils.inventory.alerts.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  const archiveSupplierMutation = trpc.inventory.supplier.archive.useMutation({
    onSuccess: () => {
      toast.success('Fornecedor arquivado!')
      utils.inventory.supplier.list.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  // Summary stats
  const totalProducts = productsData?.total ?? 0
  const lowStockCount = alertsData?.filter((p) => Number(p.qtyCurrent) > 0).length ?? 0
  const outOfStockCount = alertsData?.filter((p) => Number(p.qtyCurrent) === 0).length ?? 0

  function getStockStatus(qtyCurrent: number, qtyMin: number) {
    if (qtyCurrent === 0) return { label: 'Em falta', variant: 'error' as const }
    if (qtyCurrent < qtyMin) return { label: 'Baixo', variant: 'warning' as const }
    return { label: 'Adequado', variant: 'success' as const }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1c1d21]">Estoque</h1>
          <p className="text-[14px] text-[#8181a5] mt-0.5">
            Produtos, lotes, movimentacoes e fornecedores.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setMovementDialogOpen(true)}>
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Movimentacao
          </Button>
          <Button onClick={() => setProductDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#f0f0f3] p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[rgba(94,129,244,0.1)]">
            <Package className="h-5 w-5 text-[#5e81f4]" />
          </div>
          <div>
            <p className="text-[12px] text-[#8181a5]">Total de itens</p>
            <p className="text-[22px] font-bold text-[#1c1d21]">{totalProducts}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#f0f0f3] p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[rgba(244,190,94,0.15)]">
            <AlertTriangle className="h-5 w-5 text-[#7a5a1a]" />
          </div>
          <div>
            <p className="text-[12px] text-[#8181a5]">Abaixo do minimo</p>
            <p className="text-[22px] font-bold text-[#1c1d21]">{lowStockCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#f0f0f3] p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[rgba(255,128,139,0.15)]">
            <XCircle className="h-5 w-5 text-[#cc2d3a]" />
          </div>
          <div>
            <p className="text-[12px] text-[#8181a5]">Em falta</p>
            <p className="text-[22px] font-bold text-[#1c1d21]">{outOfStockCount}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="movements">Movimentacoes</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
        </TabsList>

        {/* ── PRODUCTS TAB ── */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Buscar produto..."
              value={productSearch}
              onChange={(e) => { setProductSearch(e.target.value); setProductPage(1) }}
              className="max-w-sm"
            />
            <Select value={productCategory} onValueChange={(v) => { setProductCategory(v === 'ALL' ? '' : v); setProductPage(1) }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {productsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !productsData || productsData.items.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Nenhum produto"
              description={productSearch || productCategory ? 'Nenhum produto encontrado com os filtros selecionados.' : 'Cadastre seu primeiro produto para comecar.'}
            />
          ) : (
            <>
              <div className="bg-white rounded-xl border border-[#f0f0f3] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#f5f5fa] border-b border-[#f0f0f3]">
                      <th className="text-left text-[12px] font-semibold text-[#8181a5] px-4 py-2.5">Material</th>
                      <th className="text-left text-[12px] font-semibold text-[#8181a5] px-4 py-2.5">Categoria</th>
                      <th className="text-right text-[12px] font-semibold text-[#8181a5] px-4 py-2.5">Qtd. atual</th>
                      <th className="text-right text-[12px] font-semibold text-[#8181a5] px-4 py-2.5">Qtd. minima</th>
                      <th className="text-right text-[12px] font-semibold text-[#8181a5] px-4 py-2.5">Custo medio</th>
                      <th className="text-left text-[12px] font-semibold text-[#8181a5] px-4 py-2.5">Status</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {productsData.items.map((item) => {
                      const qty = Number(item.qtyCurrent)
                      const min = Number(item.qtyMin)
                      const status = getStockStatus(qty, min)
                      const catLabel = PRODUCT_CATEGORIES.find((c) => c.id === item.category)?.name ?? item.category
                      return (
                        <tr key={item.id} className="border-b border-[#f5f5fa] hover:bg-[#fafafa] transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-[13px] font-medium text-[#1c1d21]">{item.name}</p>
                              {item.brand && <p className="text-[11px] text-[#8181a5]">{item.brand}</p>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[13px] text-[#8181a5]">{catLabel}</td>
                          <td className={`px-4 py-3 text-right text-[13px] font-semibold ${qty === 0 ? 'text-[#cc2d3a]' : qty < min ? 'text-[#7a5a1a]' : 'text-[#1c1d21]'}`}>
                            {qty} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-right text-[13px] text-[#8181a5]">{min} {item.unit}</td>
                          <td className="px-4 py-3 text-right text-[13px] text-[#1c1d21]">
                            {Number(item.costAvg) > 0 ? formatMoney(Number(item.costAvg)) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge label={status.label} variant={status.variant} />
                          </td>
                          <td className="px-4 py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => archiveProductMutation.mutate({ id: item.id })}>
                                  Arquivar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {productsData.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{productsData.total} produto{productsData.total !== 1 ? 's' : ''}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={productPage <= 1} onClick={() => setProductPage(productPage - 1)}>Anterior</Button>
                    <span className="flex items-center text-sm text-muted-foreground px-2">{productPage} / {productsData.totalPages}</span>
                    <Button variant="outline" size="sm" disabled={productPage >= productsData.totalPages} onClick={() => setProductPage(productPage + 1)}>Proximo</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ── MOVEMENTS TAB ── */}
        <TabsContent value="movements" className="space-y-4">
          {movementsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !movementsData || movementsData.items.length === 0 ? (
            <EmptyState
              icon={ArrowUpDown}
              title="Nenhuma movimentacao"
              description="Registre compras, consumos e ajustes de estoque."
            />
          ) : (
            <>
              <div className="bg-white rounded-xl border border-[#f0f0f3] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#f5f5fa] border-b border-[#f0f0f3]">
                      <th className="text-left text-[12px] font-semibold text-[#8181a5] px-4 py-2.5">Data</th>
                      <th className="text-left text-[12px] font-semibold text-[#8181a5] px-4 py-2.5">Produto</th>
                      <th className="text-left text-[12px] font-semibold text-[#8181a5] px-4 py-2.5">Tipo</th>
                      <th className="text-right text-[12px] font-semibold text-[#8181a5] px-4 py-2.5">Qtd</th>
                      <th className="text-left text-[12px] font-semibold text-[#8181a5] px-4 py-2.5">Por</th>
                      <th className="text-left text-[12px] font-semibold text-[#8181a5] px-4 py-2.5">Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movementsData.items.map((mov) => {
                      const badge = getMovementTypeBadge(mov.type)
                      return (
                        <tr key={mov.id} className="border-b border-[#f5f5fa] hover:bg-[#fafafa] transition-colors">
                          <td className="px-4 py-3 text-[13px] text-[#8181a5]">{formatDate(mov.createdAt)}</td>
                          <td className="px-4 py-3 text-[13px] font-medium text-[#1c1d21]">{mov.product.name}</td>
                          <td className="px-4 py-3"><StatusBadge label={badge.label} variant={badge.variant} /></td>
                          <td className="px-4 py-3 text-right text-[13px] font-semibold text-[#1c1d21]">{Number(mov.qty)} {mov.product.unit}</td>
                          <td className="px-4 py-3 text-[13px] text-[#8181a5]">{mov.creator.name}</td>
                          <td className="px-4 py-3 text-[13px] text-[#8181a5] max-w-[200px] truncate">{mov.notes || '-'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {movementsData.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{movementsData.total} movimentacao{movementsData.total !== 1 ? 'es' : ''}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={movementPage <= 1} onClick={() => setMovementPage(movementPage - 1)}>Anterior</Button>
                    <span className="flex items-center text-sm text-muted-foreground px-2">{movementPage} / {movementsData.totalPages}</span>
                    <Button variant="outline" size="sm" disabled={movementPage >= movementsData.totalPages} onClick={() => setMovementPage(movementPage + 1)}>Proximo</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ── SUPPLIERS TAB ── */}
        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex items-center justify-between">
            <Input
              placeholder="Buscar fornecedor..."
              value={supplierSearch}
              onChange={(e) => { setSupplierSearch(e.target.value); setSupplierPage(1) }}
              className="max-w-sm"
            />
            <Button onClick={() => setSupplierDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Fornecedor
            </Button>
          </div>

          {suppliersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !suppliersData || suppliersData.items.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Nenhum fornecedor"
              description={supplierSearch ? 'Nenhum fornecedor encontrado.' : 'Cadastre seus fornecedores para rastrear compras.'}
            />
          ) : (
            <>
              <div className="bg-white rounded-xl border border-[#f0f0f3] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#f5f5fa] border-b border-[#f0f0f3]">
                      <th className="text-left text-[12px] font-semibold text-[#8181a5] px-4 py-2.5">Fornecedor</th>
                      <th className="text-left text-[12px] font-semibold text-[#8181a5] px-4 py-2.5">Contato</th>
                      <th className="text-left text-[12px] font-semibold text-[#8181a5] px-4 py-2.5">Email</th>
                      <th className="text-right text-[12px] font-semibold text-[#8181a5] px-4 py-2.5">Produtos</th>
                      <th className="text-right text-[12px] font-semibold text-[#8181a5] px-4 py-2.5">Prazo (dias)</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {suppliersData.items.map((sup) => (
                      <tr key={sup.id} className="border-b border-[#f5f5fa] hover:bg-[#fafafa] transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-[13px] font-medium text-[#1c1d21]">{sup.name}</p>
                            {sup.cnpj && <p className="text-[11px] text-[#8181a5]">{sup.cnpj}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-[#8181a5]">{sup.contactName || '-'}</td>
                        <td className="px-4 py-3 text-[13px] text-[#8181a5]">{sup.email || '-'}</td>
                        <td className="px-4 py-3 text-right text-[13px] text-[#1c1d21]">{sup._count.products}</td>
                        <td className="px-4 py-3 text-right text-[13px] text-[#8181a5]">{sup.leadDays ?? '-'}</td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => archiveSupplierMutation.mutate({ id: sup.id })}>
                                Arquivar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {suppliersData.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{suppliersData.total} fornecedor{suppliersData.total !== 1 ? 'es' : ''}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={supplierPage <= 1} onClick={() => setSupplierPage(supplierPage - 1)}>Anterior</Button>
                    <span className="flex items-center text-sm text-muted-foreground px-2">{supplierPage} / {suppliersData.totalPages}</span>
                    <Button variant="outline" size="sm" disabled={supplierPage >= suppliersData.totalPages} onClick={() => setSupplierPage(supplierPage + 1)}>Proximo</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ProductFormDialog open={productDialogOpen} onOpenChange={setProductDialogOpen} />
      <MovementFormDialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen} />
      <SupplierFormDialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen} />
    </div>
  )
}
