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
import { GavelIcon } from "lucide-react"

const navItems = [
  {
    title: "Subastas",
    url: "/subastas",
    icon: <GavelIcon />,
    isActive: true,
    items: [
      {
        title: "Catálogo",
        url: "/subastas",
      },
      {
        title: "Publicar Subasta",
        url: "/subastas/crear",
        disabled: true,
      },
      {
        title: "Sala en Vivo",
        url: "/subastas/en-vivo",
        disabled: true,
      },
    ],
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
              <div className="grid flex-1 text-left text-lg">
                <span className="font-semibold">SubastaYa</span>
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
