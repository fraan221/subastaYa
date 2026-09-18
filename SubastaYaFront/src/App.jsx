import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { authService } from "@/services/authService"
import { LoginForm } from "@/components/login-form"
import { AppSidebar } from "@/components/app-sidebar"
import { CatalogPage } from "@/pages/CatalogPage"
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

export default function App() {
  const [user, setUser] = useState(() => authService.getCurrentUser())

  useEffect(() => {
    const handleUnauthorized = () => setUser(null)
    window.addEventListener("auth:unauthorized", handleUnauthorized)
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized)
  }, [])

  const handleLogout = () => {
    authService.logout()
    setUser(null)
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
    <BrowserRouter>
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
                    <BreadcrumbPage>Catálogo</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/subastas" replace />} />
              <Route path="/subastas" element={<CatalogPage />} />
              {/* Fallback de cualquier otra ruta hacia el catálogo */}
              <Route path="*" element={<Navigate to="/subastas" replace />} />
            </Routes>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </BrowserRouter>
  )
}
