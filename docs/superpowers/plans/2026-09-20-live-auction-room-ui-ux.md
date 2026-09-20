# Live Auction Room UI/UX & Accessibility Elevation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the real-time live auction interface (`feat/live-auction-room`) into a high-tier, accessible (WCAG 2.2 AA), and friction-free bidding experience with optimal visual hierarchy, tactile micro-interactions, and robust assistive technology support.

**Architecture:** Refactor UI presentation components in `SubastaYaFront/src/components/live/` and `src/pages/LiveAuctionPage.jsx` without altering backend contracts or WebSocket/hub architecture. Introduce ARIA live regions, semantic elements, quick-increment bidding pills, responsive above-the-fold layout composition, accessible color palettes, and motion-reduction fallbacks.

**Tech Stack:** React 19, Tailwind CSS v4, Lucide React, Shadcn UI primitives, `@fontsource-variable/inter`.

**Spec:** Branch audit findings and UI/UX requirements based on `frontend-design` and `accessibility` (WCAG 2.2 AA) skills.

---

## Global Constraints

- **Strict Scope**: Modify ONLY frontend UI/UX presentation and styling files. Do not alter backend controllers, SignalR hubs, services, or data contracts.
- **Accessibility Standard**: Full WCAG 2.2 Level AA compliance (contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for UI graphics; touch targets ≥ 24×24px, recommended 44×44px; mandatory form labels; ARIA live region support for dynamic events).
- **Motion Safety**: All CSS animations (`pulse`, `bounce`, `ping`) must respect `prefers-reduced-motion: reduce`.
- **Zero Layout Jitter**: All dynamic numeric counters (countdown timer, prices) must use tabular figures (`tabular-nums`).

---

## Review Focus

1. **Anti-sniping toast contrast**: Ensure amber notification text meets WCAG AA (≥ 4.5:1) in both light and dark modes instead of illegible white on bright amber.
2. **Screen reader notification delivery**: Verify outbid alerts, anti-sniping extensions, and error states are announced via `role="alert"` / `aria-live`.
3. **Form accessible names**: Ensure every numeric input (`customAmount`, `precioMinInput`, `precioMaxInput`) has an accessible label (`<label>` or `aria-label`).
4. **Touch target dimensions**: Ensure interactive buttons and dismiss targets meet or exceed 24×24px (and comfortably hit 44×44px on mobile).
5. **Above-the-fold console accessibility**: On 1080p and laptop screens, the live bidding console, current highest bid, and timer must be visible simultaneously without vertical scrolling.

---

## Comprehensive UI/UX Audit Findings

### 1. `SubastaYaFront/src/components/live/auction-alerts.jsx`
- **[CRITICAL] WCAG 1.4.3 Contrast Violation**: `alert.type === 'antisniping'` renders with `bg-amber-500/95 text-white`. Contrast ratio of `#ffffff` on `#f59e0b` is **1.6:1** (fails AA minimum of 4.5:1).
- **[CRITICAL] WCAG 4.1.3 Status & Live Region Absence**: Container has `pointer-events-none` but lacks `role="region"`, `aria-label`, and `aria-live`. Assistive technology users receive zero announcement when an outbid or anti-sniping alert triggers.
- **[SERIOUS] WCAG 2.5.8 Target Size**: The close button uses `p-0.5 rounded cursor-pointer` on `<X className="size-4" />`. The clickable bounding box is under 20×20px (violates minimum 24×24px).
- **[MODERATE] UX Visual Polish**: Toasts lack visual progress timers and dismiss animations; stacking 3+ alerts blocks lower-right controls.

### 2. `SubastaYaFront/src/components/live/live-timer.jsx`
- **[SERIOUS] WCAG 2.3 Motion Sensitivity**: When `isCritical` (≤ 60s), the card has `animate-pulse` and the icon has `animate-bounce` continuously. There is no `motion-reduce:animate-none` safeguard for users with vestibular/attention disorders.
- **[MODERATE] Layout Jitter**: Numbers use `font-mono` but not explicitly `tabular-nums`, which can cause subtle shifting depending on font fallbacks.
- **[MODERATE] UX Closure Clarity**: When expired (`Finalizada` or `Desierta`), it displays a flat, muted gray box with minimal emotional context or distinction between a victorious sale vs an unbid item.

### 3. `SubastaYaFront/src/components/live/bidding-console.jsx`
- **[CRITICAL] WCAG 3.3.2 Missing Form Labels**: The custom bid input `<Input type="number" placeholder="Mayor a $X" />` has no programmatic `<label>` or `aria-label`.
- **[SERIOUS] High Bidding Friction (UX Ergonomics)**: In fast-paced live auctions, requiring users to manually type multidigit numbers creates severe friction. Missing quick-increment chips (`+$1.000`, `+$5.000`, `+$10.000`).
- **[SERIOUS] Passive Balance Error Handling**: When user balance < suggested bid, the button remains active, only failing with an error box after clicking. Needs proactive low-balance affordance and inline recharge shortcut.
- **[SERIOUS] Aggressive Motion**: The `outbid` badge has `animate-bounce` running indefinitely while outbid, creating visual fatigue.
- **[MODERATE] Seller UI State**: When `isSeller` is true, inputs are disabled and a tiny italic sentence appears at the bottom. Deserves a dedicated, professional "Panel del Vendedor (Modo Monitor)" card.

### 4. `SubastaYaFront/src/components/live/bid-history.jsx`
- **[SERIOUS] Semantics & ARIA Log**: Rendered with generic `div`s rather than an ordered list (`<ol>`) or log feed (`role="log" aria-label="Historial de ofertas" aria-relevant="additions"`).
- **[MODERATE] Visual Stagnation on Update**: When a new bid arrives via WebSocket, the row simply appears with no micro-interaction (no highlight pulse or staggered fade-in).
- **[MINOR] Semantic Time Markup**: Timestamps are bare strings rather than semantic `<time dateTime="...">`.

### 5. `SubastaYaFront/src/pages/LiveAuctionPage.jsx`
- **[SERIOUS] Spatial Composition & Above-The-Fold Priority**: On desktop viewports, an `aspect-video` image plus title and description pushes the bidding console below the screen fold. In live auctions, the action controls must be instantly accessible.
- **[SERIOUS] Loading State Experience**: Uses a basic central spinner (`animate-spin`) rather than a structured Skeleton UI previewing the auction stage.
- **[MODERATE] Status Announcement**: Connection indicator (`SALA EN VIVO CONECTADA`) lacks `role="status"` and `aria-live="polite"`.

### 6. `SubastaYaFront/src/components/auction-card.jsx` & `src/pages/CatalogPage.jsx`
- **[CRITICAL] WCAG 3.3.2 Form Labels**: In `CatalogPage.jsx`, `<Input type="number" placeholder="Mín $" />` and `placeholder="Máx $"` lack `<label>` or `aria-label`.
- **[MODERATE] Focus Visible**: Card action links lack prominent `:focus-visible` ring indicators.

---

## Tasks

### Task 1: Fix Accessibility, Contrast & Touch Targets in Auction Alerts

**Files:**
- Modify: `SubastaYaFront/src/components/live/auction-alerts.jsx`

**Interfaces:**
- Consumes: `alerts` array with objects `{ id, type, message }`
- Produces: Accessible floating toast feed with WCAG AA compliant colors, 44px touch targets, and ARIA live regions.

- [ ] **Step 1: Update ToastItem markup with compliant contrast, touch target, and ARIA roles**

Replace the color calculation and dismiss button in `ToastItem`:

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

  // WCAG 2.2 AA Compliant theme tokens:
  // Antisniping uses deep amber background with high-contrast text (contrast > 5.5:1)
  const colorStyles = isAntiSniping
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
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all animate-in slide-in-from-bottom-4 motion-reduce:animate-none ${colorStyles}`}
    >
      {isAntiSniping && <Flame className="size-5 shrink-0 text-amber-600 dark:text-amber-400 animate-pulse motion-reduce:animate-none" aria-hidden="true" />}
      {isSuccess && <CheckCircle2 className="size-5 shrink-0 text-emerald-200" aria-hidden="true" />}
      {(isOutbid || isRejected) && <Clock className="size-5 shrink-0 text-red-200 animate-pulse motion-reduce:animate-none" aria-hidden="true" />}
      {!isAntiSniping && !isSuccess && !isOutbid && !isRejected && <AlertCircle className="size-5 shrink-0" aria-hidden="true" />}

      <div className="flex-1 text-xs leading-snug">
        <span className="font-bold block uppercase tracking-wide text-[10px] opacity-90 mb-0.5">
          {isAntiSniping
            ? 'Regla Anti-Sniping (+2 min)'
            : isOutbid
            ? '¡Has Sido Superado!'
            : isSuccess
            ? 'Puja Confirmada'
            : isRejected
            ? 'Oferta Rechazada'
            : 'Aviso'}
        </span>
        {alert.message}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(alert.id)}
        className="shrink-0 flex items-center justify-center min-w-[32px] min-h-[32px] -mr-1 -mt-1 p-1 rounded-md opacity-80 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current cursor-pointer"
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
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {visibleAlerts.map((alert) => (
        <ToastItem key={alert.id} alert={alert} onDismiss={handleDismiss} />
      ))}
    </aside>
  )
}
```

- [ ] **Step 2: Verify build and check for regressions**

Run: `pnpm --filter SubastaYaFront build`
Expected: Build succeeds with 0 errors.

- [ ] **Step 3: Commit Task 1**

```bash
git add SubastaYaFront/src/components/live/auction-alerts.jsx
git commit -m "fix(ui/ux): elevate auction alerts contrast, touch target, and ARIA regions"
```

---

### Task 2: Live Countdown Timer & State Visual Refinement

**Files:**
- Modify: `SubastaYaFront/src/components/live/live-timer.jsx`

**Interfaces:**
- Consumes: `fechaFin` (ISO string), `estado` (string)
- Produces: Polished countdown with non-jittering tabular numerals, accessible motion guards, and structured conclusion banner.

- [ ] **Step 1: Refactor `LiveTimer` with `tabular-nums`, calm urgency styling, and reduced-motion support**

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
        className="flex items-center justify-between p-4 rounded-xl bg-muted/60 border border-border text-foreground"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="size-6" aria-hidden="true" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider block text-muted-foreground">
              Estado del Lote
            </span>
            <span className="text-lg font-bold">Subasta Finalizada</span>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted border text-muted-foreground">
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
        className="flex items-center justify-between p-4 rounded-xl bg-muted/60 border border-border text-muted-foreground"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Ban className="size-6" aria-hidden="true" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider block">
              Estado del Lote
            </span>
            <span className="text-lg font-bold">Subasta Desierta</span>
          </div>
        </div>
        <span className="text-xs font-medium px-3 py-1 rounded-full bg-muted border">
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
      className={`flex items-center justify-between p-4 rounded-xl border transition-colors duration-300 ${
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
            <AlertTriangle className="size-6 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
          </div>
        ) : (
          <div className="p-2 rounded-lg bg-muted text-muted-foreground">
            <Clock className="size-6" aria-hidden="true" />
          </div>
        )}
        <div>
          <span className="text-xs uppercase font-bold tracking-wider block text-muted-foreground">
            {isCritical ? '¡Cierre Inminente!' : 'Tiempo Restante'}
          </span>
          <span className="text-2xl font-mono font-bold tracking-tight tabular-nums">
            {days > 0 && `${days}d `}
            {formatUnit(hours)}:{formatUnit(minutes)}:{formatUnit(seconds)}
          </span>
        </div>
      </div>

      {isCritical && (
        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-600 text-white shadow-xs">
          Último Minuto
        </span>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm --filter SubastaYaFront build`
Expected: Build passes with 0 errors.

- [ ] **Step 3: Commit Task 2**

```bash
git add SubastaYaFront/src/components/live/live-timer.jsx
git commit -m "fix(ui/ux): add tabular-nums, calm motion states, and accessible timers"
```

---

### Task 3: Friction-Free Bidding Console with Quick-Pills & A11y Form Labels

**Files:**
- Modify: `SubastaYaFront/src/components/live/bidding-console.jsx`

**Interfaces:**
- Consumes: `auction`, `currentUser`, `bids`, `latestBid`, `onBidSuccess`
- Produces: High-performance bidding console with quick increment pill buttons, accessible input labels, proactive balance guard, and distinct seller monitor mode.

- [ ] **Step 1: Enhance `BiddingConsole` with increment pills, accessible labels, and proactive balance alert**

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
      setLocalError(`El monto debe ser como mínimo la sugerencia: ${formatCurrency(suggestedBid)}`)
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
      <div className="bg-card rounded-xl border border-primary/20 p-5 space-y-3 shadow-xs">
        <div className="flex items-center gap-2 text-primary font-semibold text-base">
          <ShieldCheck className="size-5" />
          <span>Panel de Monitoreo del Vendedor</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Estás supervisando tu propia publicación en tiempo real. Por normativas de transparencia y equidad de la plataforma, el creador del lote no puede emitir ofertas en su propia subasta.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <TrendingUp className="size-5 text-primary" aria-hidden="true" />
          Consola de Puja
        </h3>

        {isFinished ? (
          latestBid?.compradorId === currentUser?.id ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              ¡Ganaste esta subasta!
            </span>
          ) : (
            <span className="text-xs text-muted-foreground px-2.5 py-1 rounded-full bg-muted font-medium">
              Subasta Finalizada
            </span>
          )
        ) : isLeading ? (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            Liderando la subasta
          </span>
        ) : userStatus === 'outbid' ? (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30">
            <AlertCircle className="size-3.5" aria-hidden="true" />
            ¡Has sido superado!
          </span>
        ) : (
          <span className="text-xs text-muted-foreground px-2.5 py-1 rounded-full bg-muted font-medium">
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
          Saldo Disponible:{' '}
          <strong className={hasInsufficientBalance ? 'text-red-600 dark:text-red-400' : 'text-foreground'}>
            {balance !== null ? formatCurrency(balance) : 'Cargando...'}
          </strong>
        </span>
      </div>

      {hasInsufficientBalance && !isFinished && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
          <span>Tu saldo disponible es menor a la siguiente oferta mínima requerida.</span>
          <Link to="/billetera/cargar" className="font-bold underline ml-2 shrink-0 hover:text-amber-950 dark:hover:text-amber-100">
            Cargar Saldo
          </Link>
        </div>
      )}

      {/* Sugerencia Automática y Botón Rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          type="button"
          onClick={handleQuickBid}
          disabled={submitting || isLeading || isFinished || hasInsufficientBalance}
          className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:cursor-not-allowed"
          aria-label={`Pujar rápidamente ${formatCurrency(suggestedBid)}`}
        >
          <Zap className="size-5" aria-hidden="true" />
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
              className="h-12 tabular-nums"
              aria-describedby={localError || error ? 'bid-error-msg' : undefined}
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            disabled={submitting || isFinished || !customAmount}
            className="h-12 px-4 font-semibold cursor-pointer disabled:cursor-not-allowed"
            aria-label="Confirmar oferta con monto personalizado"
          >
            Ofertar
          </Button>
        </form>
      </div>

      {/* Chips de incremento rápido */}
      {!isFinished && (
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
            <Plus className="size-3" aria-hidden="true" /> Incrementar:
          </span>
          {[1000, 5000, 10000, 50000].map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => handleQuickIncrement(step)}
              className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-muted/30 hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              +{formatCurrency(step)}
            </button>
          ))}
        </div>
      )}

      {/* Mensajes de validación / error */}
      {(localError || error) && (
        <div
          id="bid-error-msg"
          role="alert"
          aria-live="assertive"
          className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-center justify-between gap-2"
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

- [ ] **Step 2: Verify build**

Run: `pnpm --filter SubastaYaFront build`
Expected: Build passes with 0 errors.

- [ ] **Step 3: Commit Task 3**

```bash
git add SubastaYaFront/src/components/live/bidding-console.jsx
git commit -m "feat(ui/ux): add quick increment chips, accessible labels, and proactive balance guards"
```

---

### Task 4: Real-Time Bid History Feed with Semantics & Animation

**Files:**
- Modify: `SubastaYaFront/src/components/live/bid-history.jsx`

**Interfaces:**
- Consumes: `bids` array, `currentUserId`
- Produces: Semantic ordered feed (`<ol>`) with `role="log"`, `<time>` markup, and entry animations.

- [ ] **Step 1: Refactor `BidHistory` into an accessible feed with animated entry**

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
      className="flex flex-col h-full bg-card rounded-xl border p-4 shadow-sm"
    >
      <div className="flex items-center justify-between pb-3 border-b">
        <h3 className="font-semibold text-base flex items-center gap-2">
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
          <div className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center">
            <div className="p-3 rounded-full bg-muted mb-2">
              <Shield className="size-6 opacity-60" aria-hidden="true" />
            </div>
            <p className="font-medium text-foreground">No hay ofertas registradas aún</p>
            <p className="text-xs text-muted-foreground mt-0.5">Sé el primero en posicionarte como líder de la subasta.</p>
          </div>
        ) : (
          <ol className="space-y-2 list-none p-0 m-0">
            {bids.map((bid, index) => {
              const isMe = currentUserId && bid.compradorId === currentUserId
              const isHighest = index === 0

              return (
                <li
                  key={bid.pujaId || `${bid.compradorId}-${bid.fechaPuja}-${index}`}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all animate-in fade-in slide-in-from-top-1 motion-reduce:animate-none ${
                    isHighest
                      ? 'bg-emerald-500/10 border-emerald-500/30 shadow-xs'
                      : 'bg-muted/30 border-border/50'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {bid.compradorSeudonimo || `Postor #${bid.compradorId}`}
                      </span>
                      {isMe && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                          Tú
                        </span>
                      )}
                      {isHighest && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                          Líder
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="size-3" aria-hidden="true" />
                      <time dateTime={bid.fechaPuja}>{formatTime(bid.fechaPuja)}</time>
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-mono font-bold text-base tabular-nums ${
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

- [ ] **Step 2: Verify build**

Run: `pnpm --filter SubastaYaFront build`
Expected: Build passes with 0 errors.

- [ ] **Step 3: Commit Task 4**

```bash
git add SubastaYaFront/src/components/live/bid-history.jsx
git commit -m "feat(ui/ux): add semantic ol feed, entry animation, and time elements to bid history"
```

---

### Task 5: Live Auction Room Spatial Layout & Skeleton Loader

**Files:**
- Modify: `SubastaYaFront/src/pages/LiveAuctionPage.jsx`

**Interfaces:**
- Consumes: `user`, `useParams`
- Produces: Responsive auction stage keeping console and timer above the fold, with comprehensive skeleton screen and connection live feedback.

- [ ] **Step 1: Implement Skeleton loader and refine desktop layout above the fold**

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
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="h-6 w-36 bg-muted rounded-md" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video w-full bg-muted rounded-xl" />
          <div className="space-y-2">
            <div className="h-8 w-2/3 bg-muted rounded-md" />
            <div className="h-4 w-full bg-muted rounded-md" />
          </div>
          <div className="h-20 bg-muted rounded-xl" />
          <div className="h-48 bg-muted rounded-xl" />
        </div>
        <div className="h-[480px] bg-muted rounded-xl" />
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
            message: `¡Te han superado! ${newBid.compradorSeudonimo || 'Otro postor'} acaba de ofertar $${newBid.monto}.`,
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
        message:
          '¡Regla Anti-Sniping! La subasta se ha extendido 2 minutos adicionales debido a una oferta de último momento.',
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
          : `La subasta ha finalizado. Ganador: Postor #${winnerId} por $${finalAmount}.`,
      })
    },
    [user, addAlert]
  )

  const handleAuctionDeserted = useCallback(() => {
    setAuction((prev) => (prev ? { ...prev, estado: 'Desierta' } : prev))
    addAlert({
      type: 'info',
      message: 'La subasta ha finalizado sin ofertas (Desierta).',
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
        <h2 className="text-lg font-semibold">Subasta no encontrada</h2>
        <p className="text-sm text-muted-foreground mt-1">
          No se pudo recuperar la información del lote solicitado.
        </p>
        <Link
          to="/subastas"
          className="text-primary font-medium underline mt-4 inline-block text-sm focus-visible:outline-2"
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
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 rounded-md"
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
            className={`size-2.5 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse motion-reduce:animate-none' : 'bg-amber-500'
            }`}
            aria-hidden="true"
          />
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Radio className={`size-3 ${isConnected ? 'text-emerald-500' : 'text-amber-500'}`} aria-hidden="true" />
            {isConnected ? 'SALA EN VIVO CONECTADA' : 'CONECTANDO...'}
          </span>
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <article className="lg:col-span-2 space-y-6">
          <div className="relative aspect-video rounded-xl overflow-hidden border bg-muted shadow-sm">
            <img
              src={
                auction.urlImagen ||
                'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80'
              }
              alt={`Imagen de lote: ${auction.titulo}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-xs">
              <Tag className="size-3.5" aria-hidden="true" />
              {auction.categoriaNombre}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{auction.titulo}</h1>
              <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                Subasta Verificada
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-1.5 leading-relaxed">
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
                message: `¡Puja confirmada por $${bid.monto}! Ahora estás liderando la subasta.`,
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

- [ ] **Step 2: Verify build**

Run: `pnpm --filter SubastaYaFront build`
Expected: Build passes with 0 errors.

- [ ] **Step 3: Commit Task 5**

```bash
git add SubastaYaFront/src/pages/LiveAuctionPage.jsx
git commit -m "feat(ui/ux): add skeleton loading, sticky bid feed, and semantic live room layout"
```

---

### Task 6: Catalog Accessible Form Labels & Live Indicator Polish

**Files:**
- Modify: `SubastaYaFront/src/pages/CatalogPage.jsx`
- Modify: `SubastaYaFront/src/components/auction-card.jsx`

**Interfaces:**
- Consumes: Price filter state in `CatalogPage.jsx`, Auction entity in `AuctionCard.jsx`
- Produces: Fully accessible price range inputs and high-contrast live auction card triggers.

- [ ] **Step 1: Add accessible labels in `CatalogPage.jsx` price inputs and reduced-motion guard on live banner**

In `SubastaYaFront/src/pages/CatalogPage.jsx`:

Add `<label htmlFor="catalog-precio-min" className="sr-only">Precio mínimo</label>` and `<label htmlFor="catalog-precio-max" className="sr-only">Precio máximo</label>`.
Add `motion-reduce:animate-none` to the live banner ping indicator.

```jsx
// Lines in SubastaYaFront/src/pages/CatalogPage.jsx around the live banner:
{initialEstado === "Activa" && (
  <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
    <span className="relative flex h-3 w-3 shrink-0" aria-hidden="true">
      <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
    </span>
    <div>
      <h2 className="font-semibold text-sm">Salas de Subastas en Tiempo Real</h2>
      <p className="text-xs text-muted-foreground">
        Participá en vivo con pujas instantáneas, alertas de superación y cronómetro anti-sniping.
      </p>
    </div>
  </div>
)}

// And around price inputs:
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

- [ ] **Step 2: Add focus rings and accessible motion guard to `AuctionCard`**

In `SubastaYaFront/src/components/auction-card.jsx`:

```jsx
// In the Radio icon for active auctions:
<Radio className="size-4 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
```

- [ ] **Step 3: Run linter and production build**

Run: `pnpm --filter SubastaYaFront lint && pnpm --filter SubastaYaFront build`
Expected: Lint passes and build succeeds with 0 errors.

- [ ] **Step 4: Commit Task 6**

```bash
git add SubastaYaFront/src/pages/CatalogPage.jsx SubastaYaFront/src/components/auction-card.jsx
git commit -m "fix(ui/ux): add accessible form labels to catalog filters and polish live card badges"
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-20-live-auction-room-ui-ux.md`. Please review the plan. Which execution approach would you prefer?

- **Subagent-driven** - A fresh subagent implements each task and a fresh reviewer checks it before the next one starts, then a whole-branch review at the end. Most thorough; costs a fresh context per task and per review.
- **Native** - I implement every task myself in this session, the way this harness runs work, then one fresh reviewer on the most capable model checks the whole branch. Cheapest and fastest; no independent review until the end. Runs well with a mid-tier session model, since the plan carries the design.

For this plan I recommend **Native**, because all tasks are strictly UI/UX frontend component refinements sharing tight design token couplings and Vite HMR verification, without complex backend or database dependencies. Does the plan capture what you want, and which approach should we use?
