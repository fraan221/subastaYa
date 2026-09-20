import { useState, useEffect } from "react";
import { auctionService } from "@/services/auctionService";
import { AuctionCard } from "@/components/auction-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FilterXIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SlidersHorizontalIcon,
} from "lucide-react";

const ESTADOS = [
  { value: "todos", label: "Todos los estados" },
  { value: "Activa", label: "Activas" },
  { value: "Programada", label: "Próximas" },
  { value: "Finalizada", label: "Finalizadas" },
  { value: "Desierta", label: "Desiertas" },
];

const ORDENAMIENTOS = [
  { value: "recientes", label: "Más recientes" },
  { value: "tiempo", label: "Menor tiempo restante" },
  { value: "mayor_puja", label: "Mayor oferta" },
];

export function CatalogPage({ initialEstado = "todos" }) {
  const [auctions, setAuctions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Opciones de categorías para el Select
  const categoryItems = [
    { value: "todas", label: "Todas las categorías" },
    ...categories.map((c) => ({ value: String(c.id), label: c.nombre })),
  ];

  // Filtros simplificados
  const [estado, setEstado] = useState(initialEstado);
  const [categoriaId, setCategoriaId] = useState("todas");
  const [precioMinInput, setPrecioMinInput] = useState("");
  const [precioMaxInput, setPrecioMaxInput] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [ordenamiento, setOrdenamiento] = useState("recientes");

  // Paginación
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // Debounce para precio
  useEffect(() => {
    const timer = setTimeout(() => {
      setPrecioMin(precioMinInput);
      setPrecioMax(precioMaxInput);
      setPagina(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [precioMinInput, precioMaxInput]);


  // Cargar categorías disponibles (una sola vez)
  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        const data = await auctionService.getCategories();
        if (isMounted) setCategories(data);
      } catch (err) {
        console.error("No se pudieron cargar las categorías:", err);
      }
    }
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Carga de subastas filtradas
  useEffect(() => {
    let ignore = false;

    async function loadAuctions() {
      setLoading(true);
      setError(null);
      try {
        const data = await auctionService.getAuctions({
          pagina,
          tamaño: 9,
          estado: estado === "todos" ? undefined : estado,
          categoriaId:
            categoriaId === "todas" ? undefined : Number(categoriaId),
          precioMin: precioMin !== "" ? Number(precioMin) : undefined,
          precioMax: precioMax !== "" ? Number(precioMax) : undefined,
          ordenamiento: ordenamiento === "recientes" ? undefined : ordenamiento,
        });

        if (!ignore) {
          setAuctions(data.items || []);
          setTotalPaginas(data.totalPaginas || 1);
        }
      } catch (err) {
        if (!ignore) {
          const msg = err.message || "Error al consultar las subastas.";
          setError(msg);
          setAuctions([]);
          toast.add({
            type: "error",
            title: "Catálogo",
            description: msg,
          });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadAuctions();

    return () => {
      ignore = true;
    };
  }, [
    pagina,
    estado,
    categoriaId,
    precioMin,
    precioMax,
    ordenamiento,
    refreshKey,
  ]);

  // Resetear filtros
  const handleResetFilters = () => {
    setEstado(initialEstado);
    setCategoriaId("todas");
    setPrecioMinInput("");
    setPrecioMaxInput("");
    setPrecioMin("");
    setPrecioMax("");
    setOrdenamiento("recientes");
    setPagina(1);
  };

  const hasActiveFilters =
    estado !== initialEstado ||
    categoriaId !== "todas" ||
    precioMinInput !== "" ||
    precioMaxInput !== "" ||
    ordenamiento !== "recientes";

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {initialEstado === "Activa" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
          <span className="size-2.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-sm">Salas de Subastas en Tiempo Real</h2>
            <p className="text-xs text-muted-foreground">
              Participá en vivo con pujas instantáneas, alertas de superación y cronómetro anti-sniping.
            </p>
          </div>
        </div>
      )}

      {/* Barra Simplificada de Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro Estado */}
          <div className="flex items-center gap-1.5">
            <Select
              items={ESTADOS}
              value={estado}
              onValueChange={(val) => {
                setEstado(val);
                setPagina(1);
              }}
            >
              <SelectTrigger className="h-9 min-w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {ESTADOS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro Categoría */}
          <div className="flex items-center gap-1.5">
            <Select
              items={categoryItems}
              value={categoriaId}
              onValueChange={(val) => {
                setCategoriaId(val);
                setPagina(1);
              }}
            >
              <SelectTrigger className="h-9 min-w-45">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {categoryItems.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Rango de Precios */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="catalog-precio-min" className="sr-only">
              Precio mínimo
            </label>
            <Input
              id="catalog-precio-min"
              type="number"
              min="0"
              placeholder="Mín $"
              value={precioMinInput}
              onChange={(e) => setPrecioMinInput(e.target.value)}
              className="h-9 w-24 tabular-nums"
            />
            <span className="text-muted-foreground text-xs" aria-hidden="true">-</span>
            <label htmlFor="catalog-precio-max" className="sr-only">
              Precio máximo
            </label>
            <Input
              id="catalog-precio-max"
              type="number"
              min="0"
              placeholder="Máx $"
              value={precioMaxInput}
              onChange={(e) => setPrecioMaxInput(e.target.value)}
              className="h-9 w-24 tabular-nums"
            />
          </div>

          {/* Botón Limpiar */}
          {hasActiveFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 text-muted-foreground hover:text-foreground"
            >
              <FilterXIcon className="size-4" />
            </Button>
          ) : null}
        </div>

        {/* Ordenamiento a la derecha */}
        <div className="flex items-center gap-1.5 ml-auto">
          <Select
            items={ORDENAMIENTOS}
            value={ordenamiento}
            onValueChange={(val) => {
              setOrdenamiento(val);
              setPagina(1);
            }}
          >
            <SelectTrigger className="h-9 min-w-45">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {ORDENAMIENTOS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Estado de Error */}
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

      {/* Grid de Subastas / Skeleton Loading */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-3 rounded-xl border border-border p-4 bg-card"
            >
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-3/4" />
              <div className="flex justify-between items-center pt-4 mt-auto">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : auctions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border border-dashed border-border">
          <SlidersHorizontalIcon className="size-10 text-muted-foreground/60 mb-3" />
          <h3 className="text-base font-semibold text-foreground">
            No se encontraron subastas
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
            No hay subastas que coincidan con los filtros seleccionados.
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Restablecer filtros
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPaginas > 1 ? (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={pagina <= 1 || loading}
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
          >
            <ChevronLeftIcon className="size-4 mr-1" />
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
          >
            Siguiente
            <ChevronRightIcon className="size-4 ml-1" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
