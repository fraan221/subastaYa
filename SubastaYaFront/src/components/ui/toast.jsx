import * as React from "react"
import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { XIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, LoaderIcon } from "lucide-react"

const toast = ToastPrimitive.createToastManager()

function ToastProvider({
  ...props
}) {
  return <ToastPrimitive.Provider {...props} />
}

function ToastPortal({
  ...props
}) {
  return <ToastPrimitive.Portal data-slot="toast-portal" {...props} />
}

function ToastViewport({
  className,
  ...props
}) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        "pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col gap-2.5 w-full max-w-sm outline-none sm:right-6 sm:bottom-6",
        className
      )}
      {...props}
    />
  )
}

function Toast({
  className,
  ...props
}) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(
        "group/toast pointer-events-auto relative flex w-full items-start justify-between gap-3 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg transition-all duration-200 outline-none select-none",
        "data-[starting-style]:translate-y-2 data-[starting-style]:opacity-0",
        "data-[ending-style]:translate-y-2 data-[ending-style]:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function ToastContent({
  className,
  ...props
}) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={cn(
        "flex min-w-0 flex-1 items-start gap-3",
        className
      )}
      {...props}
    />
  )
}

function ToastTitle({
  className,
  ...props
}) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn("text-sm font-semibold leading-tight text-foreground", className)}
      {...props}
    />
  )
}

function ToastDescription({
  className,
  ...props
}) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn("text-sm text-muted-foreground leading-normal mt-0.5", className)}
      {...props}
    />
  )
}

function ToastAction({
  className,
  render = <Button variant="outline" size="sm" />,
  ...props
}) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      render={render}
      className={cn("shrink-0", className)}
      {...props}
    />
  )
}

function ToastClose({
  className,
  children,
  render = <Button variant="ghost" size="icon-xs" className="h-6 w-6 shrink-0 rounded-md opacity-70 hover:opacity-100" />,
  ...props
}) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label="Close toast"
      render={render}
      className={cn(
        "shrink-0 text-muted-foreground hover:text-foreground",
        className
      )}
      {...props}
    >
      {children ?? (
        <XIcon className="size-3.5" aria-hidden="true" />
      )}
    </ToastPrimitive.Close>
  )
}

function ToastIcon({
  type
}) {
  let icon = null

  if (type === "success") {
    icon = (
      <CircleCheckIcon className="size-5 text-green-600 dark:text-green-400" aria-hidden="true" />
    )
  } else if (type === "info") {
    icon = (
      <InfoIcon className="size-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
    )
  } else if (type === "warning") {
    icon = (
      <TriangleAlertIcon className="size-5 text-amber-500 dark:text-amber-400" aria-hidden="true" />
    )
  } else if (type === "error") {
    icon = (
      <OctagonXIcon className="size-5 text-destructive" aria-hidden="true" />
    )
  } else if (type === "loading") {
    icon = (
      <LoaderIcon className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
    )
  }

  if (!icon) {
    return null
  }

  return (
    <span
      data-slot="toast-icon"
      className="shrink-0 mt-0.5"
    >
      {icon}
    </span>
  )
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager()

  return toasts.map((toastItem) => (
    <Toast key={toastItem.id} toast={toastItem}>
      <ToastContent>
        <ToastIcon type={toastItem.type} />
        <div className="flex min-w-0 flex-1 flex-col">
          <ToastTitle />
          <ToastDescription />
        </div>
      </ToastContent>
      <ToastAction />
      <ToastClose />
    </Toast>
  ))
}

function Toaster({
  children,
  toastManager = toast,
  ...props
}) {
  return (
    <ToastProvider toastManager={toastManager} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport>
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  )
}

const createToastManager = ToastPrimitive.createToastManager
const useToastManager = ToastPrimitive.useToastManager

export {
  Toaster,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  createToastManager,
  toast,
  useToastManager,
}
