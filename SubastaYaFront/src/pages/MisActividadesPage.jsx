import { useEffect, useState } from "react"
import { activityService } from "@/services/activityService"
import { BidActivityCard } from "@/components/activity/bid-activity-card"
import { PublicationActivityCard } from "@/components/activity/publication-activity-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import {
  ActivityIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"

function ActivitySkeleton() {
  return (
    <div className="flex flex-col gap-4 overflow-hidden rounded-4xl bg-card p-4 shadow-md">
      <Skeleton className="aspect-video w-full rounded-3xl" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-16 w-full" />
    </div>
  )
}

export function MisActividadesPage({ type }) {
  const isBidsView = type === "bids"
  const [activities, setActivities] = useState([])
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let ignore = false

    async function loadActivities() {
      setLoading(true)
      setError(null)

      try {
        const data = isBidsView
          ? await activityService.getMyBids({ pagina, tamaño: 9 })
          : await activityService.getMyListings({ pagina, tamaño: 9 })

        if (ignore) return

        setActivities(data.items || [])
        setTotalPaginas(data.totalPaginas || 1)
      } catch (err) {
        if (ignore) return

        const message =
          err.message || "No se pudieron cargar tus actividades."

        setError(message)
        setActivities([])

        toast.add({
          type: "error",
          title: "Mis actividades",
          description: message,
        })
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadActivities()

    return () => {
      ignore = true
    }
  }, [isBidsView, pagina, refreshKey])

  const title = isBidsView
    ? "Mis Compras / Pujas"
    : "Mis Publicaciones"

  const description = isBidsView
    ? "Subastas en las que participaste."
    : "Subastas que publicaste."

  const emptyTitle = isBidsView
    ? "Todavía no participaste en ninguna subasta"
    : "Todavía no publicaste ninguna subasta"

  const emptyDescription = isBidsView
    ? "Cuando realices una puja, aparecerá aquí."
    : "Cuando publiques una subasta, aparecerá aquí."

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {error ? (
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey((value) => value + 1)}
          >
            Reintentar
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <ActivitySkeleton key={index} />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-16 text-center">
          <ActivityIcon className="mb-3 size-10 text-muted-foreground/60" />
          <h2 className="text-base font-semibold">{emptyTitle}</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {emptyDescription}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) =>
            isBidsView ? (
              <BidActivityCard key={activity.id} activity={activity} />
            ) : (
              <PublicationActivityCard
                key={activity.id}
                activity={activity}
              />
            )
          )}
        </div>
      )}

      {totalPaginas > 1 ? (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={pagina <= 1 || loading}
            onClick={() =>
              setPagina((currentPage) => Math.max(1, currentPage - 1))
            }
          >
            <ChevronLeftIcon className="mr-1 size-4" />
            Anterior
          </Button>

          <span className="px-3 text-sm text-muted-foreground">
            Página <strong>{pagina}</strong> de{" "}
            <strong>{totalPaginas}</strong>
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={pagina >= totalPaginas || loading}
            onClick={() =>
              setPagina((currentPage) =>
                Math.min(totalPaginas, currentPage + 1)
              )
            }
          >
            Siguiente
            <ChevronRightIcon className="ml-1 size-4" />
          </Button>
        </div>
      ) : null}
    </div>
  )
}
