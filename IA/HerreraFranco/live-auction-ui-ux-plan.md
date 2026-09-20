# Plan de Implementación UI/UX: Sala de Subastas en Vivo (Filosofía Minimalista)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevar la experiencia de usuario y accesibilidad (WCAG 2.2 AA) de la sala de subastas en vivo (`feat/live-auction-room`) bajo una estricta **filosofía minimalista**, reduciendo fricción cognitiva, eliminando animaciones estridentes y priorizando la claridad operativa del postor.

**Architecture:** Refactorización quirúrgica de los componentes de presentación en `SubastaYaFront/src/components/live/`, `LiveAuctionPage.jsx` y filtros del catálogo. Sin capas de abstracción adicionales ni librerías externas superfluas; uso exclusivo de primitivos semánticos de React 19, Tailwind CSS v4, Lucide y Shadcn.

**Tech Stack:** React 19, Tailwind CSS v4, Lucide React, Shadcn UI primitives, `@fontsource-variable/inter`.

**Spec:** Auditoría de accesibilidad WCAG 2.2 AA y principios de diseño minimalista inspirados en [`WalletController.cs`](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYa/Controllers/WalletController.cs) y [`CatalogPage.jsx`](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/pages/CatalogPage.jsx).

---

## Filosofía Minimalista de Diseño y Código

Inspirada en la arquitectura directa de `WalletController.cs` y la ergonomía limpia de `CatalogPage.jsx`:

1. **Pragmatismo sobre exceso:** Cada elemento en pantalla debe cumplir un propósito operativo inmediato (conocer el tiempo, saber quién lidera, ofertar sin fricción). Cero adornos vacíos o gradientes genéricos.
2. **Calma visual y sobriedad:** Eliminar animaciones perpetuas (`animate-bounce` o pulsos infinitos que fatigan al usuario). La tensión de la subasta se transmite con tipografía tabular legible, jerarquía espacial limpia y colores de estado sobrios.
3. **Accesibilidad nativa sin overhead:** Usar HTML semántico (`<ol>`, `<time>`, `<label className="sr-only">`), roles ARIA directos (`role="alert"`, `role="log"`) y contrastes firmes (≥ 4.5:1) sin dependencias adicionales.
4. **Manejo honesto y proactivo de estados:** Mostrar con claridad el saldo insuficiente antes de pulsar, estados de vendedor transparentes y skeletons limpios que preserven la geometría sin saltos de layout.

---

## Global Constraints

- **Alcance estrictamente visual y de accesibilidad:** Modificar únicamente archivos frontend de presentación. Ninguna alteración a controladores backend, endpoints, Hubs de SignalR ni servicios de datos.
- **Cumplimiento WCAG 2.2 Nivel AA:** Contraste mínimo de 4.5:1 en textos, botones y áreas táctiles de al menos 24×24px (44×44px en controles clave), soporte para lectores de pantalla con regiones en vivo.
- **Respeto a preferencias de usuario:** Soporte estricto para `motion-reduce:animate-none` en cualquier transición visual.
- **Cero desplazamiento numérico:** Tipografía monoespaciada con cifras tabulares fijas (`tabular-nums`) en temporizador, montos y pujas.

---

## Review Focus

1. **Contraste de alertas anti-sniping:** Garantizar fondo ámbar sobrio con texto de alto contraste (≥ 5.5:1) en modo claro y oscuro, eliminando el texto blanco sobre ámbar brillante (1.6:1).
2. **Entrega a lectores de pantalla:** Asegurar que superaciones de puja (*outbid*), extensiones y errores se anuncien mediante `role="alert"` o `aria-live="polite"`.
3. **Etiquetas accesibles en formularios:** Incorporar etiquetas programáticas a todos los inputs numéricos (puja personalizada y rango de precios del catálogo).
4. **Disposición 'Above the fold':** En pantallas de escritorio y laptops, la consola de puja, el temporizador y el monto líder deben ser visibles simultáneamente sin requerir scroll vertical.
5. **Ergonomía de incremento rápido:** Incorporar botones compactos de incremento (`+$1.000`, `+$5.000`, `+$10.000`) para ofertar con un solo clic.

---

## Diagnóstico Sintético de Hallazgos

| Archivo | Problema Detectado | Solución Minimalista |
| :--- | :--- | :--- |
| [`auction-alerts.jsx`](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/components/live/auction-alerts.jsx) | Contraste ilegible 1.6:1 en alerta anti-sniping; botón cerrar de 20px; sin soporte ARIA. | Paleta ámbar accesible (5.5:1), botón con touch target de 36px, `role="region"` y `role="alert"`. |
| [`live-timer.jsx`](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/components/live/live-timer.jsx) | `animate-bounce` invasivo en zona crítica; dígitos saltarines; finalización confusa. | Cifras fijas `tabular-nums`, pulso sutil con `motion-reduce`, tarjeta de estado finalizado sobria. |
| [`bidding-console.jsx`](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/components/live/bidding-console.jsx) | Input sin `<label>`; sin botones de incremento rápido; rebote eterno en *outbid*; aviso de saldo pasivo. | `<label className="sr-only">`, chips minimalistas `+$X`, aviso preventivo de recarga de saldo y panel vendedor sobrio. |
| [`bid-history.jsx`](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/components/live/bid-history.jsx) | `div`s genéricos sin semántica de log; entradas bruscas sin animación suave; fechas sin `<time>`. | `<ol>` semántico con `role="log"`, `<time dateTime="...">` y animación de entrada suave. |
| [`LiveAuctionPage.jsx`](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/pages/LiveAuctionPage.jsx) | Spinner central básico; scroll innecesario para llegar a la consola; indicador de conexión mudo para lectores. | *Skeleton screen* geométrico, panel de historial `sticky` y `role="status"` en el indicador de conexión. |
| [`CatalogPage.jsx`](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/pages/CatalogPage.jsx) | Inputs de precio mínimo y máximo sin etiquetas accesibles. | Incorporación de `<label htmlFor="..." className="sr-only">`. |

---

## Tareas de Implementación

### Task 1: Alertas en Vivo Minimalistas y Accesibles

**Archivos:**
- Modificar: `SubastaYaFront/src/components/live/auction-alerts.jsx`

**Interfaces:**
- Consume: `alerts` (`Array<{ id, type, message }>`)
- Produce: Contenedor flotante con contraste AA, área táctil de descarte ergonómica y roles ARIA.

- [ ] **Paso 1: Implementar `auction-alerts.jsx` con contraste WCAG AA y semántica de alertas**

```jsx
// File: SubastaYaFront/src/components/live/auction-alerts.jsx
import { useState, useCallback, useEffect } from 'react'
import { AlertCircle, CheckCircle2, Flame, Clock, X } from 'lucide-react'

function ToastItem({ alert, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(alert.id)
    }, 5500)
    return () => clearTimeout(timer)
  }, [alert.id, onDismiss])

  const isAntiSniping = alert.type === 'antisniping'
  const isSuccess = alert.type === 'success'
  const isOutbid = alert.type === 'outbid'
  const isRejected = alert.type === 'rejected'

  // Contraste sobrio y minimalista WCAG AA (>= 4.5:1)
  const styles = isAntiSniping
    ? 'bg-amber-100 text-amber-950 border-amber-400 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-700'
    : isSuccess
    ? 'bg-emerald-700 text-white border-emerald-800 dark:bg-emerald-900 dark:border-emerald-700'
    : isOutbid || isRejected
    ? 'bg-red-700 text-white border-red-800 dark:bg-red-950 dark:text-red-100 dark:border-red-800'
    : 'bg-card text-card-foreground border-border'

  const role = isOutbid || isRejected ? 'alert' : 'status'

  return (
    <div
      role={role}
      aria-atomic="true"
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-md border backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 motion-reduce:animate-none ${styles}`}
    >
      {isAntiSniping && <Flame className="size-4.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />}
      {isSuccess && <CheckCircle2 className="size-4.5 shrink-0 text-emerald-200" aria-hidden="true" />}
      {(isOutbid || isRejected) && <Clock className="size-4.5 shrink-0 text-red-200" aria-hidden="true" />}
      {!isAntiSniping && !isSuccess && !isOutbid && !isRejected && <AlertCircle className="size-4.5 shrink-0" aria-hidden="true" />}

      <div className="flex-1 text-xs leading-snug">
        <span className="font-semibold block uppercase tracking-wide text-[10px] opacity-85 mb-0.5">
          {isAntiSniping
            ? 'Anti-Sniping (+2 min)'
            : isOutbid
            ? 'Superado en la puja'
            : isSuccess
            ? 'Puja confirmada'
            : isRejected
            ? 'Oferta rechazada'
            : 'Aviso'}
        </span>
        {alert.message}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(alert.id)}
        className="shrink-0 flex items-center justify-center min-w-[32px] min-h-[32px] -mr-1 -mt-1 p-1 rounded-md opacity-75 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current cursor-pointer"
        aria-label="Cerrar notificación"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export function AuctionAlerts({ alerts = [] }) {
  const [dismissedIds, setDismissedIds] = useState(() => new Set())

  const handleDismiss = useCallback((id) => {
    setDismissedIds((prev) => {
      const updated = new Set(prev)
      updated.add(id)
      return updated
    })
  }, [])

  const visibleAlerts = alerts.filter((a) => !dismissedIds.has(a.id))

  if (visibleAlerts.length === 0) return null

  return (
    <aside
      aria-label="Notificaciones de subasta en vivo"
      aria-live="polite"
      aria-relevant="additions text"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {visibleAlerts.map((alert) => (
        <ToastItem key={alert.id} alert={alert} onDismiss={handleDismiss} />
      ))}
    </aside>
  )
}
```

- [ ] **Paso 2: Verificar compilación**
Ejecutar: `pnpm --filter SubastaYaFront build`
Resultado esperado: 0 errores.

---

### Task 2: Temporizador en Vivo Sobrio y Números Tabulares

**Archivos:**
- Modificar: `SubastaYaFront/src/components/live/live-timer.jsx`

**Interfaces:**
- Consume: `fechaFin` (ISO), `estado` (string)
- Produce: Componente de cuenta regresiva con cifras fijas (`tabular-nums`), sin temblores de layout y respetuoso de `motion-reduce`.

- [ ] **Paso 1: Implementar `live-timer.jsx`**

```jsx
// File: SubastaYaFront/src/components/live/live-timer.jsx
import { useCountdown } from '@/hooks/use-countdown'
import { Clock, AlertTriangle, CheckCircle, Ban } from 'lucide-react'

export function LiveTimer({ fechaFin, estado }) {
  const { days, hours, minutes, seconds, totalSeconds, isExpired } = useCountdown(fechaFin)

  if (estado === 'Finalizada' || isExpired) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-between p-3.5 rounded-xl bg-muted/50 border text-foreground"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="size-5" aria-hidden="true" />
          </div>
          <div>
            <span className="text-[11px] uppercase font-semibold tracking-wider block text-muted-foreground">
              Estado
            </span>
            <span className="text-base font-bold">Subasta Finalizada</span>
          </div>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted border text-muted-foreground">
          Cerrada
        </span>
      </div>
    )
  }

  if (estado === 'Desierta') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-between p-3.5 rounded-xl bg-muted/50 border text-muted-foreground"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Ban className="size-5" aria-hidden="true" />
          </div>
          <div>
            <span className="text-[11px] uppercase font-semibold tracking-wider block">
              Estado
            </span>
            <span className="text-base font-bold">Subasta Desierta</span>
          </div>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted border">
          Sin ofertas
        </span>
      </div>
    )
  }

  const isCritical = totalSeconds <= 60 && totalSeconds > 0
  const isWarning = totalSeconds > 60 && totalSeconds <= 300
  const formatUnit = (val) => String(val).padStart(2, '0')

  return (
    <div
      role="region"
      aria-label="Temporizador de subasta en tiempo real"
      className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors duration-300 ${
        isCritical
          ? 'bg-red-500/10 border-red-500/40 text-red-600 dark:text-red-400'
          : isWarning
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
          : 'bg-card border-border text-foreground'
      }`}
    >
      <div className="flex items-center gap-3">
        {isCritical ? (
          <div className="p-2 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400">
            <AlertTriangle className="size-5 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
          </div>
        ) : (
          <div className="p-2 rounded-lg bg-muted text-muted-foreground">
            <Clock className="size-5" aria-hidden="true" />
          </div>
        )}
        <div>
          <span className="text-[11px] uppercase font-semibold tracking-wider block text-muted-foreground">
            {isCritical ? '¡Cierre Inminente!' : 'Tiempo Restante'}
          </span>
          <span className="text-2xl font-mono font-bold tracking-tight tabular-nums">
            {days > 0 && `${days}d `}
            {formatUnit(hours)}:{formatUnit(minutes)}:{formatUnit(seconds)}
          </span>
        </div>
      </div>

      {isCritical && (
        <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-600 text-white">
          Último Minuto
        </span>
      )}
    </div>
  )
}
```

- [ ] **Paso 2: Verificar compilación**
Ejecutar: `pnpm --filter SubastaYaFront build`
Resultado esperado: 0 errores.

---

### Task 3: Consola de Puja Minimalista con Incremento Rápido y Saldo Proactivo

**Archivos:**
- Modificar: `SubastaYaFront/src/components/live/bidding-console.jsx`

**Interfaces:**
- Consume: `auction`, `currentUser`, `bids`, `latestBid`, `onBidSuccess`
- Produce: Interfaz ergonómica con botón de puja rápida, micro-chips de incremento, validación anticipada de saldo y panel sobrio para el vendedor.

- [ ] **Paso 1: Implementar `bidding-console.jsx`**

```jsx
// File: SubastaYaFront/src/components/live/bidding-console.jsx
import { useState } from 'react'
import { useBidding } from '@/hooks/use-bidding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Zap, AlertCircle, CheckCircle2, TrendingUp, Wallet, ShieldCheck, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

export function BiddingConsole({ auction, currentUser, bids, latestBid, onBidSuccess }) {
  const bidsOrLatest = bids && bids.length > 0 ? bids : latestBid
  const {
    balance,
    suggestedBid,
    userStatus,
    customAmount,
    setCustomAmount,
    submitBid,
    submitting,
    error,
  } = useBidding(auction, currentUser, bidsOrLatest, onBidSuccess)

  const [localError, setLocalError] = useState(null)

  const formatCurrency = (val) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val)

  const isSeller = currentUser?.id && auction?.vendedorId && currentUser.id === auction.vendedorId
  const isLeading = userStatus === 'leading'
  const isFinished = auction?.estado === 'Finalizada' || auction?.estado === 'Desierta'
  const hasInsufficientBalance = balance !== null && balance < suggestedBid

  const handleQuickBid = async () => {
    setLocalError(null)
    try {
      await submitBid(suggestedBid)
    } catch (err) {
      setLocalError(err.message)
    }
  }

  const handleQuickIncrement = (delta) => {
    setLocalError(null)
    const base = Number(customAmount) > suggestedBid ? Number(customAmount) : suggestedBid
    setCustomAmount(String(base + delta))
  }

  const handleCustomBid = async (e) => {
    e.preventDefault()
    setLocalError(null)
    const val = Number(customAmount)

    if (!val || val < suggestedBid) {
      setLocalError(`El monto debe ser como mínimo: ${formatCurrency(suggestedBid)}`)
      return
    }

    try {
      await submitBid(val)
    } catch (err) {
      setLocalError(err.message)
    }
  }

  if (isSeller) {
    return (
      <div className="bg-card rounded-xl border p-4 space-y-2">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
          <ShieldCheck className="size-4.5" />
          <span>Modo Vendedor (Monitor en vivo)</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Estás supervisando tu subasta. Por políticas de integridad de la plataforma, el titular del lote no puede realizar ofertas.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border p-4.5 space-y-3.5 shadow-xs">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" aria-hidden="true" />
          Consola de Puja
        </h3>

        {isFinished ? (
          latestBid?.compradorId === currentUser?.id ? (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              ¡Ganaste esta subasta!
            </span>
          ) : (
            <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted font-medium">
              Subasta Finalizada
            </span>
          )
        ) : isLeading ? (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            Liderando la subasta
          </span>
        ) : userStatus === 'outbid' ? (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30">
            <AlertCircle className="size-3.5" aria-hidden="true" />
            Superado por otro postor
          </span>
        ) : (
          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted font-medium">
            Modo Espectador
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg">
        <span>
          Incremento Mínimo: <strong className="text-foreground">{formatCurrency(auction?.incrementoMinimo || 0)}</strong>
        </span>
        <span className="flex items-center gap-1">
          <Wallet className="size-3.5" aria-hidden="true" />
          Saldo:{' '}
          <strong className={hasInsufficientBalance ? 'text-red-600 dark:text-red-400' : 'text-foreground'}>
            {balance !== null ? formatCurrency(balance) : 'Cargando...'}
          </strong>
        </span>
      </div>

      {hasInsufficientBalance && !isFinished && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
          <span>Saldo insuficiente para la siguiente puja sugerida.</span>
          <Link to="/billetera/cargar" className="font-semibold underline ml-2 shrink-0 hover:text-amber-950 dark:hover:text-amber-100">
            Cargar Saldo
          </Link>
        </div>
      )}

      {/* Sugerencia Automática y Botón Rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <Button
          type="button"
          onClick={handleQuickBid}
          disabled={submitting || isLeading || isFinished || hasInsufficientBalance}
          className="w-full h-11 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          aria-label={`Pujar rápidamente ${formatCurrency(suggestedBid)}`}
        >
          <Zap className="size-4" aria-hidden="true" />
          Pujar {formatCurrency(suggestedBid)}
        </Button>

        {/* Monto Personalizado Superior */}
        <form onSubmit={handleCustomBid} className="flex gap-2">
          <div className="relative flex-1">
            <label htmlFor="custom-bid-amount" className="sr-only">
              Monto de puja personalizada
            </label>
            <Input
              id="custom-bid-amount"
              type="number"
              placeholder={`Mayor a ${formatCurrency(suggestedBid)}`}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              disabled={submitting || isFinished}
              min={suggestedBid}
              className="h-11 text-sm tabular-nums"
              aria-describedby={localError || error ? 'bid-error-msg' : undefined}
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            disabled={submitting || isFinished || !customAmount}
            className="h-11 px-3.5 text-sm font-medium cursor-pointer disabled:cursor-not-allowed"
            aria-label="Confirmar oferta con monto personalizado"
          >
            Ofertar
          </Button>
        </form>
      </div>

      {/* Chips de incremento rápido */}
      {!isFinished && (
        <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1 mr-1">
            <Plus className="size-3" aria-hidden="true" /> Incrementar:
          </span>
          {[1000, 5000, 10000, 50000].map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => handleQuickIncrement(step)}
              className="px-2 py-0.5 text-xs font-medium rounded-md border bg-muted/40 hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              +{formatCurrency(step)}
            </button>
          ))}
        </div>
      )}

      {/* Errores */}
      {(localError || error) && (
        <div
          id="bid-error-msg"
          role="alert"
          aria-live="assertive"
          className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-1.5">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            <span>{localError || error}</span>
          </div>
          {(localError || error)?.includes('Saldo') && (
            <Link to="/billetera/cargar" className="underline font-bold shrink-0 hover:text-red-900">
              Cargar saldo
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Paso 2: Verificar compilación**
Ejecutar: `pnpm --filter SubastaYaFront build`
Resultado esperado: 0 errores.

---

### Task 4: Historial de Ofertas Semántico y Limpio

**Archivos:**
- Modificar: `SubastaYaFront/src/components/live/bid-history.jsx`

**Interfaces:**
- Consume: `bids` (`Array<Puja>`), `currentUserId`
- Produce: Lista semántica ordenada (`<ol>`) con `role="log"`, `<time>` y estado vacío sobrio.

- [ ] **Paso 1: Implementar `bid-history.jsx`**

```jsx
// File: SubastaYaFront/src/components/live/bid-history.jsx
import { Shield, Trophy, Clock } from 'lucide-react'

export function BidHistory({ bids = [], currentUserId }) {
  const formatCurrency = (val) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val)

  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--:--'
    const d = new Date(dateStr)
    return d.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <section
      aria-label="Historial de ofertas en vivo"
      className="flex flex-col h-full bg-card rounded-xl border p-4 shadow-xs"
    >
      <div className="flex items-center justify-between pb-3 border-b">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Trophy className="size-4 text-amber-500" aria-hidden="true" />
          Historial de Ofertas
        </h3>
        <span className="text-xs text-muted-foreground font-medium">
          {bids.length} {bids.length === 1 ? 'oferta' : 'ofertas'}
        </span>
      </div>

      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        className="flex-1 overflow-y-auto mt-3 space-y-2 max-h-[460px] pr-1"
      >
        {bids.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-xs flex flex-col items-center">
            <div className="p-2.5 rounded-full bg-muted mb-2">
              <Shield className="size-5 opacity-50" aria-hidden="true" />
            </div>
            <p className="font-medium text-foreground">Aún no hay ofertas registradas</p>
            <p className="text-muted-foreground mt-0.5">Sé el primero en posicionarte como líder.</p>
          </div>
        ) : (
          <ol className="space-y-2 list-none p-0 m-0">
            {bids.map((bid, index) => {
              const isMe = currentUserId && bid.compradorId === currentUserId
              const isHighest = index === 0

              return (
                <li
                  key={bid.pujaId || `${bid.compradorId}-${bid.fechaPuja}-${index}`}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all animate-in fade-in slide-in-from-top-1 motion-reduce:animate-none ${
                    isHighest
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-muted/30 border-border/50'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-xs">
                        {bid.compradorSeudonimo || `Postor #${bid.compradorId}`}
                      </span>
                      {isMe && (
                        <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-primary/20 text-primary">
                          Tú
                        </span>
                      )}
                      {isHighest && (
                        <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-emerald-600 text-white">
                          Líder
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="size-3" aria-hidden="true" />
                      <time dateTime={bid.fechaPuja}>{formatTime(bid.fechaPuja)}</time>
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-mono font-bold text-sm tabular-nums ${
                        isHighest
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-foreground'
                      }`}
                    >
                      {formatCurrency(bid.monto)}
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Paso 2: Verificar compilación**
Ejecutar: `pnpm --filter SubastaYaFront build`
Resultado esperado: 0 errores.

---

### Task 5: Orquestador `LiveAuctionPage` con Carga Geométrica y Feedback de Conexión

**Archivos:**
- Modificar: `SubastaYaFront/src/pages/LiveAuctionPage.jsx`

**Interfaces:**
- Consume: `id` (parámetro de ruta), `user` (objeto usuario autenticado)
- Produce: Sala en vivo con esqueleto geométrico, indicador de conexión accesible (`role="status"`) y panel lateral *sticky*.

- [ ] **Paso 1: Implementar `LiveAuctionPage.jsx`**

```jsx
// File: SubastaYaFront/src/pages/LiveAuctionPage.jsx
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { auctionService } from '@/services/auctionService'
import { bidService } from '@/services/bidService'
import { useAuctionHub } from '@/hooks/use-auction-hub'
import { LiveTimer } from '@/components/live/live-timer'
import { BidHistory } from '@/components/live/bid-history'
import { BiddingConsole } from '@/components/live/bidding-console'
import { AuctionAlerts } from '@/components/live/auction-alerts'
import { ArrowLeft, Tag, Radio, ShieldCheck } from 'lucide-react'

function LiveAuctionSkeleton() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-pulse" aria-label="Cargando sala en vivo">
      <div className="h-5 w-32 bg-muted rounded-md" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="aspect-video w-full bg-muted rounded-xl" />
          <div className="space-y-2">
            <div className="h-7 w-2/3 bg-muted rounded-md" />
            <div className="h-4 w-full bg-muted rounded-md" />
          </div>
          <div className="h-16 bg-muted rounded-xl" />
          <div className="h-44 bg-muted rounded-xl" />
        </div>
        <div className="h-[440px] bg-muted rounded-xl" />
      </div>
    </div>
  )
}

export function LiveAuctionPage({ user }) {
  const { id } = useParams()
  const [auction, setAuction] = useState(null)
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState([])

  const addAlert = useCallback((alert) => {
    setAlerts((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, ...alert }])
  }, [])

  useEffect(() => {
    let ignore = false

    async function fetchData() {
      try {
        setLoading(true)
        const [auctionData, bidsData] = await Promise.all([
          auctionService.getAuctionById(id),
          bidService.getBidHistory(id).catch(() => []),
        ])

        if (!ignore) {
          setAuction(auctionData)
          setBids(bidsData)
        }
      } catch (err) {
        console.error('Error cargando sala en vivo:', err)
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    if (id) {
      fetchData()
    }

    return () => {
      ignore = true
    }
  }, [id])

  const handleNewBid = useCallback(
    (newBid) => {
      setBids((prev) => {
        const previousLeader = prev[0]
        if (
          user?.id &&
          newBid.compradorId !== user.id &&
          previousLeader &&
          previousLeader.compradorId === user.id
        ) {
          addAlert({
            type: 'outbid',
            message: `¡Te han superado! ${newBid.compradorSeudonimo || 'Otro postor'} ofertó $${newBid.monto}.`,
          })
        }
        return [newBid, ...prev.filter((b) => b.pujaId !== newBid.pujaId)]
      })
      setAuction((prev) => {
        if (!prev) return prev
        const updated = {
          ...prev,
          montoActual: newBid.monto,
          cantidadPujas: (prev.cantidadPujas || 0) + 1,
          ultimaPujaComprador: newBid.compradorSeudonimo,
        }
        const extDate = newBid.nuevaFechaFin || newBid.NuevaFechaFin
        if ((newBid.fueAntiSniping || newBid.FueAntiSniping) && extDate) {
          updated.fechaFin = extDate
        }
        return updated
      })
    },
    [user, addAlert]
  )

  const handleAuctionExtended = useCallback(
    (data) => {
      const nuevaFecha = data.nuevaFechaFin || data.NuevaFechaFin
      setAuction((prev) => (prev ? { ...prev, fechaFin: nuevaFecha || prev.fechaFin } : prev))
      addAlert({
        type: 'antisniping',
        message: '¡Regla Anti-Sniping! La subasta se extendió 2 minutos adicionales.',
      })
    },
    [addAlert]
  )

  const handleBidRejected = useCallback(
    (data) => {
      const targetUserId = data.compradorId ?? data.CompradorId
      const motivo = data.motivo || data.Motivo || 'Oferta no válida.'
      if (targetUserId === user?.id) {
        addAlert({
          type: 'rejected',
          message: `Oferta rechazada: ${motivo}`,
        })
      }
    },
    [user, addAlert]
  )

  const handleAuctionFinalized = useCallback(
    (data) => {
      setAuction((prev) => (prev ? { ...prev, estado: 'Finalizada' } : prev))
      const winnerId = data.ganadorId ?? data.GanadorId
      const finalAmount = data.montoFinal ?? data.MontoFinal
      const isWinner = user?.id && winnerId === user.id
      addAlert({
        type: isWinner ? 'success' : 'info',
        message: isWinner
          ? `¡Felicitaciones! Has ganado la subasta por $${finalAmount}.`
          : `Subasta finalizada. Ganador: Postor #${winnerId} por $${finalAmount}.`,
      })
    },
    [user, addAlert]
  )

  const handleAuctionDeserted = useCallback(() => {
    setAuction((prev) => (prev ? { ...prev, estado: 'Desierta' } : prev))
    addAlert({
      type: 'info',
      message: 'La subasta finalizó sin ofertas (Desierta).',
    })
  }, [addAlert])

  const hubCallbacks = useMemo(
    () => ({
      onNewBid: handleNewBid,
      onAuctionExtended: handleAuctionExtended,
      onBidRejected: handleBidRejected,
      onAuctionFinalized: handleAuctionFinalized,
      onAuctionDeserted: handleAuctionDeserted,
    }),
    [
      handleNewBid,
      handleAuctionExtended,
      handleBidRejected,
      handleAuctionFinalized,
      handleAuctionDeserted,
    ]
  )

  const { isConnected } = useAuctionHub(id, hubCallbacks)

  if (loading) {
    return <LiveAuctionSkeleton />
  }

  if (!auction) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-12 bg-card rounded-xl border p-6">
        <h2 className="text-base font-semibold">Subasta no encontrada</h2>
        <p className="text-xs text-muted-foreground mt-1">
          No se pudo recuperar la información del lote solicitado.
        </p>
        <Link
          to="/subastas"
          className="text-primary font-medium underline mt-4 inline-block text-xs focus-visible:outline-2"
        >
          Volver al catálogo
        </Link>
      </div>
    )
  }

  const latestBid = bids[0] || null

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <nav aria-label="Navegación secundaria" className="flex items-center justify-between">
        <Link
          to="/subastas"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 rounded-md"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver al catálogo
        </Link>

        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2"
        >
          <span
            className={`size-2 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse motion-reduce:animate-none' : 'bg-amber-500'
            }`}
            aria-hidden="true"
          />
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <Radio className={`size-3 ${isConnected ? 'text-emerald-500' : 'text-amber-500'}`} aria-hidden="true" />
            {isConnected ? 'SALA CONECTADA' : 'CONECTANDO...'}
          </span>
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <article className="lg:col-span-2 space-y-5">
          <div className="relative aspect-video rounded-xl overflow-hidden border bg-muted shadow-xs">
            <img
              src={
                auction.urlImagen ||
                'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80'
              }
              alt={`Imagen de lote: ${auction.titulo}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-xs">
              <Tag className="size-3" aria-hidden="true" />
              {auction.categoriaNombre}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-foreground">{auction.titulo}</h1>
              <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                Subasta Verificada
              </span>
            </div>
            <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
              {auction.descripcion}
            </p>
          </div>

          <LiveTimer
            fechaFin={auction.fechaFin}
            fechaInicio={auction.fechaInicio}
            estado={auction.estado}
          />

          <BiddingConsole
            auction={auction}
            currentUser={user}
            bids={bids}
            latestBid={latestBid}
            onBidSuccess={(bid) => {
              addAlert({
                type: 'success',
                message: `¡Puja confirmada por $${bid.monto}! Estás liderando la subasta.`,
              })
            }}
          />
        </article>

        <aside className="space-y-6 lg:sticky lg:top-6">
          <BidHistory bids={bids} currentUserId={user?.id} />
        </aside>
      </div>

      <AuctionAlerts alerts={alerts} />
    </div>
  )
}
```

- [ ] **Paso 2: Verificar compilación**
Ejecutar: `pnpm --filter SubastaYaFront build`
Resultado esperado: 0 errores.

---

### Task 6: Accesibilidad en Filtros de Catálogo y Tarjetas

**Archivos:**
- Modificar: `SubastaYaFront/src/pages/CatalogPage.jsx`
- Modificar: `SubastaYaFront/src/components/auction-card.jsx`

**Interfaces:**
- Consume: Filtros de precio en `CatalogPage.jsx`, elemento de subasta en `AuctionCard.jsx`
- Produce: Entradas de precio con etiquetas accesibles y botón de acceso a sala con foco visible claro.

- [ ] **Paso 1: Añadir `<label className="sr-only">` en `CatalogPage.jsx`**

En `SubastaYaFront/src/pages/CatalogPage.jsx`:
```jsx
// En el banner de subastas activas:
<span className="relative flex h-3 w-3 shrink-0" aria-hidden="true">
  <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
</span>

// En la sección de rango de precios:
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
```

- [ ] **Paso 2: Ajustar `AuctionCard` con protección a movimiento reducido**

En `SubastaYaFront/src/components/auction-card.jsx`:
```jsx
<Radio className="size-4 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
```

- [ ] **Paso 3: Validar linter y build final**
Ejecutar: `pnpm --filter SubastaYaFront lint && pnpm --filter SubastaYaFront build`
Resultado esperado: Linter sin errores y build exitoso.
