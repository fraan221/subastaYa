import { useState, useEffect } from "react";
import { walletService } from "@/services/walletService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { WalletIcon, ShieldAlertIcon, CheckCircle2Icon } from "lucide-react";

function formatCurrency(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function WalletBalancePage({ user }) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadBalance() {
      setLoading(true);
      setError(null);
      try {
        const data = await walletService.getBalance(user?.id);
        if (!ignore) {
          setBalance(data);
        }
      } catch (err) {
        if (!ignore) {
          const msg = err.message || "Error al consultar los saldos.";
          setError(msg);
          toast.add({
            type: "error",
            title: "Balance",
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
      loadBalance();
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} className="p-6">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-40" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Métrica 1: Saldo Total */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total
              </CardTitle>
              <WalletIcon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {formatCurrency(balance?.saldoTotal)}
              </div>
            </CardContent>
          </Card>

          {/* Métrica 2: Saldo Retenido / En Garantía */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Retenido
              </CardTitle>
              <ShieldAlertIcon className="size-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                {formatCurrency(balance?.saldoRetenido)}
              </div>
            </CardContent>
          </Card>

          {/* Métrica 3: Saldo Disponible */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Disponible
              </CardTitle>
              <CheckCircle2Icon className="size-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {formatCurrency(balance?.saldoDisponible)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
