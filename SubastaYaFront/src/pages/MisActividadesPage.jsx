import { useEffect, useState } from "react";
import { activityService } from "@/services/activityService";
import { BidActivityCard } from "@/components/activity/bid-activity-card";
import { PublicationActivityCard } from "@/components/activity/publication-activity-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { ActivityIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

const CONFIG = {
  bids: {
    fetcher: (params) => activityService.getMyBids(params),
    Card: BidActivityCard,
    errorTitle: "Pujas",
    emptyTitle: "Sin pujas registradas",
    emptyDescription: "Las subastas en las que ofertes aparecerán aquí.",
  },
  listings: {
    fetcher: (params) => activityService.getMyListings(params),
    Card: PublicationActivityCard,
    errorTitle: "Ventas",
    emptyTitle: "Sin publicaciones",
    emptyDescription: "Las subastas que publiques aparecerán aquí.",
  },
};

function ActivitySkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4 bg-card">
      <Skeleton className="aspect-video w-full rounded-lg" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-5 w-3/4" />
      <div className="flex justify-between items-center pt-4 mt-auto">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export function MisActividadesPage({ type }) {
  const config = CONFIG[type] || CONFIG.bids;
  const CardComponent = config.Card;

  const [activities, setActivities] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setPagina(1);
  }, [type]);

  useEffect(() => {
    let ignore = false;

    async function loadActivities() {
      setLoading(true);
      setError(null);

      try {
        const data = await config.fetcher({ pagina, tamaño: 9 });

        if (!ignore) {
          setActivities(data.items || []);
          setTotalPaginas(data.totalPaginas || 1);
        }
      } catch (err) {
        if (!ignore) {
          const message = err.message || "Error al consultar las actividades.";
          setError(message);
          setActivities([]);

          toast.add({
            type: "error",
            title: config.errorTitle,
            description: message,
          });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadActivities();

    return () => {
      ignore = true;
    };
  }, [type, pagina, refreshKey]);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-center justify-between"
        >
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <ActivitySkeleton key={index} />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border border-dashed border-border">
          <ActivityIcon
            className="size-10 text-muted-foreground/60 mb-3"
            aria-hidden="true"
          />
          <h3 className="text-base font-semibold text-foreground">
            {config.emptyTitle}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            {config.emptyDescription}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <CardComponent key={activity.id} activity={activity} />
          ))}
        </div>
      )}

      {totalPaginas > 1 ? (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={pagina <= 1 || loading}
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            aria-label="Página anterior"
          >
            <ChevronLeftIcon className="size-4 mr-1" aria-hidden="true" />
            Anterior
          </Button>

          <span className="text-sm text-muted-foreground px-3">
            Página <strong>{pagina}</strong> de <strong>{totalPaginas}</strong>
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={pagina >= totalPaginas || loading}
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            aria-label="Página siguiente"
          >
            Siguiente
            <ChevronRightIcon className="size-4 ml-1" aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
