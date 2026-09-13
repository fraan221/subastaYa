"use client"

import * as React from "react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ActivityIcon, GavelIcon, WalletIcon } from "lucide-react"

const navItems = [
  {
    title: "Conexión y Diagnóstico",
    url: "#",
    icon: <ActivityIcon />,
    isActive: true,
  },
  {
    title: "Subastas",
    url: "#",
    icon: <GavelIcon />,
  },
  {
    title: "Billetera",
    url: "#",
    icon: <WalletIcon />,
  },
]

export function AppSidebar({
  user,
  onLogout,
  ...props
}) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                SY
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">SubastaYa</span>
                <span className="truncate text-xs text-muted-foreground">Front + Back (.NET)</span>
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
  )
}
