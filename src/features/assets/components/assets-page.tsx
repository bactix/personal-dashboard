"use client"

import { DeleteButton } from "@/components/dashboard/delete-button"
import { ListPagination } from "@/components/dashboard/list-pagination"
import { WidgetCard } from "@/components/dashboard/widget-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePagination } from "@/hooks/use-pagination"
import { formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"

import { useAssets, useDeleteAsset } from "../hooks"
import { changeCents, changePercent } from "../totals"
import { AssetDialog } from "./asset-dialog"

export function AssetsPage() {
  const query = useAssets()
  const deleteAsset = useDeleteAsset()
  const assets = query.data ?? []
  const pagination = usePagination(assets)

  return (
    <div className="px-4 lg:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <WidgetCard
          title="Assets"
          description={query.data ? `${assets.length} total` : undefined}
          query={query}
          action={<AssetDialog />}
          isEmpty={assets.length === 0}
          emptyMessage="No assets yet. Use Add asset to record something you own."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Purchased</TableHead>
                <TableHead className="text-right">Current value</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="w-20">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.pageItems.map((asset) => {
                const change = changeCents(asset)
                return (
                  <TableRow key={asset.id}>
                    <TableCell className="whitespace-normal break-words">
                      <p className="font-medium">{asset.name}</p>
                      {asset.category && (
                        <p className="text-xs text-muted-foreground">{asset.category}</p>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      <p>{formatMoney(asset.purchaseCents, asset.currency)}</p>
                      <p className="text-xs text-muted-foreground">{asset.purchaseDate}</p>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMoney(asset.currentValueCents, asset.currency)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums",
                        change > 0 && "text-green-600 dark:text-green-500",
                        change < 0 && "text-destructive"
                      )}
                    >
                      <p>
                        {change > 0 ? "+" : change < 0 ? "−" : ""}
                        {formatMoney(Math.abs(change), asset.currency)}
                      </p>
                      <p className="text-xs">
                        {changePercent(asset) > 0 ? "+" : ""}
                        {changePercent(asset)}%
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <AssetDialog asset={asset} />
                        <DeleteButton
                          itemLabel={`asset “${asset.name}”`}
                          onDelete={() => deleteAsset.mutateAsync(asset.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <ListPagination pagination={pagination} />
        </WidgetCard>
      </div>
    </div>
  )
}
