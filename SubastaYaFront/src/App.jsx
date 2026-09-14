import { useState, useEffect } from "react"
import { authService } from "@/services/authService"
import { LoginForm } from "@/components/login-form"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function App() {
  const [user, setUser] = useState(() => authService.getCurrentUser())
  const [status, setStatus] = useState({ loading: false, result: null, error: null })

  useEffect(() => {
    const handleUnauthorized = () => setUser(null)
    window.addEventListener("auth:unauthorized", handleUnauthorized)
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized)
  }, [])

  const handleLogout = () => {
    authService.logout()
    setUser(null)
    setStatus({ loading: false, result: null, error: null })
  }

  const checkConnection = async () => {
    setStatus({ loading: true, result: null, error: null })
    try {
      const data = await authService.getMe()
      setStatus({ loading: false, result: data, error: null })
    } catch (err) {
      setStatus({ loading: false, result: null, error: err.message })
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-muted/30">
        <div className="w-full max-w-sm">
          <LoginForm onSuccess={(loggedUser) => setUser(loggedUser)} />
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} onLogout={handleLogout} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Panel Principal</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-6 max-w-3xl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">¡Hola, {user.nombre}!</CardTitle>
                </div>
                {status.result && (
                  <Badge variant="outline" className="border-green-600 text-green-700 bg-green-50 dark:bg-green-950/30">
                    Backend conectado
                  </Badge>
                )}
                {status.error && (
                  <Badge variant="destructive">
                    Sin conexión
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Button onClick={checkConnection} disabled={status.loading}>
                  {status.loading ? "Verificando..." : "Probar conexión"}
                </Button>
              </div>

              {status.result && (
                <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                  <span className="text-muted-foreground">
                    Token válido para el usuario <strong>{status.result.nombre}</strong> ({status.result.email}).
                  </span>
                </div>
              )}

              {status.error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <strong>Error:</strong> {status.error}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
