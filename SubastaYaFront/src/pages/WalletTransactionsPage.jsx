import { useState, useEffect } from "react";
import { walletService } from "@/services/walletService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReceiptTextIcon } from "lucide-react";

function formatCurrency(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatDate(isoDate) {
  if (!isoDate) return "-";
  try {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  } catch {
    return isoDate;
  }
}

const TIPO_CONFIG = {
  Deposito: {
    label: "Depósito",
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    prefix: "+",
  },
  Retencion: {
    label: "Retención",
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    prefix: "-",
  },
  Liberacion: {
    label: "Liberación",
    className:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
    prefix: "+",
  },
  Pago: {
    label: "Pago",
    className:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
    prefix: "-",
  },
  Cobro: {
    label: "Cobro",
    className:
      "bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20",
    prefix: "+",
  },
};

export function WalletTransactionsPage({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadTransactions() {
      setLoading(true);
      setError(null);
      try {
        const data = await walletService.getTransactions(user?.id);
        if (!ignore) {
          setTransactions(data || []);
        }
      } catch (err) {
        if (!ignore) {
          const msg = err.message || "Error al consultar los movimientos.";
          setError(msg);
          toast.add({
            type: "error",
            title: "Movimientos",
            description: msg,
          });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (user?.id) {
      loadTransactions();
    }

    return () => {
      ignore = true;
    };
  }, [user?.id, refreshKey]);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey((k) => k + 1)}
          >
            Reintentar
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Tipo</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Referencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border border-dashed border-border">
          <ReceiptTextIcon className="size-10 text-muted-foreground/60 mb-3" />
          <h3 className="text-base font-semibold text-foreground">
            Sin movimientos
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Aún no se registraron operaciones en la billetera.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Tipo</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Referencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => {
                const config = TIPO_CONFIG[tx.tipo] || {
                  label: tx.tipo,
                  className: "bg-muted text-muted-foreground",
                  prefix: "",
                };

                return (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <Badge variant="outline" className={config.className}>
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {config.prefix} {formatCurrency(tx.monto)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDate(tx.fecha)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {tx.subastaTitulo
                        ? tx.subastaTitulo
                        : tx.subastaId
                          ? `Subasta #${tx.subastaId}`
                          : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
