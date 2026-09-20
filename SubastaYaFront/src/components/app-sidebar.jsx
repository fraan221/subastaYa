"use client";

import * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ActivityIcon, Command, GavelIcon, WalletIcon } from "lucide-react";

const navItems = [
  {
    title: "Subastas",
    url: "/subastas",
    icon: <GavelIcon />,
    isActive: true,
    items: [
      {
        title: "Explorar",
        url: "/subastas",
      },
      {
        title: "Subastar",
        url: "/subastas/crear",
      },
      {
        title: "En Vivo",
        url: "/subastas/en-vivo",
      },
    ],
  },
  {
    title: "Billetera",
    url: "/billetera",
    icon: <WalletIcon />,
    isActive: true,
    items: [
      {
        title: "Saldo",
        url: "/billetera",
      },
      {
        title: "Recargar",
        url: "/billetera/cargar",
      },
      {
        title: "Historial",
        url: "/billetera/movimientos",
      },
    ],
  },
  {
    title: "Actividad",
    url: "/mis-actividades",
    icon: <ActivityIcon />,
    isActive: true,
    items: [
      {
        title: "Pujas",
        url: "/mis-actividades/compras",
      },
      {
        title: "Ventas",
        url: "/mis-actividades/publicaciones",
      },
    ],
  },
];

export function AppSidebar({ user, onLogout, ...props }) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Command className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">SubastaYa</span>
                <span className="truncate text-xs">Portal</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogout={onLogout} />
      </SidebarFooter>
    </Sidebar>
  );
}
