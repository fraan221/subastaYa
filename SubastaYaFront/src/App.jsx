import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { authService } from "@/services/authService";
import { LoginForm } from "@/components/login-form";
import { AppSidebar } from "@/components/app-sidebar";
import { AuctionForm } from "@/components/auction-form";
import { CatalogPage } from "@/pages/CatalogPage";
import { WalletBalancePage } from "@/pages/WalletBalancePage";
import { WalletDepositPage } from "@/pages/WalletDepositPage";
import { WalletTransactionsPage } from "@/pages/WalletTransactionsPage";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/toast";

const headerTitles = {
  "/subastas": "Catálogo",
  "/subastas/crear": "Publicar",
  "/billetera": "Balance",
  "/billetera/cargar": "Cargar",
  "/billetera/movimientos": "Movimientos",
};

function AppHeader() {
  const location = useLocation();
  const title = headerTitles[location.pathname] || "Subastas";
  const section = location.pathname.startsWith("/billetera")
    ? "Billetera"
    : "Subastas";

  return (
    <header className="flex h-16 items-center border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <Separator orientation="vertical" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <span className="text-muted-foreground">{section}</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}

export default function App() {
  const [user, setUser] = useState(() => authService.getCurrentUser());

  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (!user) {
    return (
      <>
        <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-muted/30">
          <div className="w-full max-w-sm">
            <LoginForm onSuccess={(loggedUser) => setUser(loggedUser)} />
          </div>
        </div>
        <Toaster />
      </>
    );
  }

  return (
    <>
      <BrowserRouter>
        <SidebarProvider>
          <AppSidebar user={user} onLogout={handleLogout} />
          <SidebarInset className="overflow-hidden">
            <AppHeader />
            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={<Navigate to="/subastas" replace />} />
                <Route path="/subastas" element={<CatalogPage />} />
                <Route
                  path="/subastas/crear"
                  element={<AuctionForm user={user} />}
                />
                <Route
                  path="/billetera"
                  element={<WalletBalancePage user={user} />}
                />
                <Route
                  path="/billetera/cargar"
                  element={<WalletDepositPage user={user} />}
                />
                <Route
                  path="/billetera/movimientos"
                  element={<WalletTransactionsPage user={user} />}
                />
                {/* Fallback de cualquier otra ruta hacia el catálogo */}
                <Route path="*" element={<Navigate to="/subastas" replace />} />
              </Routes>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </BrowserRouter>
      <Toaster />
    </>
  );
}
