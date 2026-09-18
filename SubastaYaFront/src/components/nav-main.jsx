import { Link, useLocation } from "react-router-dom"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"

export function NavMain({ items }) {
  const location = useLocation()

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const hasChildren = Boolean(item.items?.length)
          const isParentActive = item.items?.some((sub) => location.pathname === sub.url) || location.pathname === item.url

          return (
            <Collapsible
              key={item.title}
              defaultOpen={item.isActive || isParentActive}
              className="group/collapsible"
              render={<SidebarMenuItem />}
            >
              <SidebarMenuButton
                tooltip={item.title}
                isActive={!hasChildren && location.pathname === item.url}
                render={
                  hasChildren ? (
                    <span className="cursor-pointer font-medium" />
                  ) : (
                    <Link to={item.url} />
                  )
                }
              >
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>

              {hasChildren ? (
                <>
                  <CollapsibleTrigger
                    render={
                      <SidebarMenuAction className="transition-transform duration-200 aria-expanded:rotate-90 data-panel-open:rotate-90" />
                    }
                  >
                    <ChevronRightIcon />
                    <span className="sr-only">Desplegar {item.title}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => {
                        const isSubActive = location.pathname === subItem.url

                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            {subItem.disabled ? (
                              <SidebarMenuSubButton
                                className="opacity-50 cursor-not-allowed select-none"
                                render={<span />}
                              >
                                <span>{subItem.title}</span>
                                <span className="ml-auto text-[10px] text-muted-foreground font-medium">
                                  Próx.
                                </span>
                              </SidebarMenuSubButton>
                            ) : (
                              <SidebarMenuSubButton
                                isActive={isSubActive}
                                render={<Link to={subItem.url} />}
                              >
                                <span>{subItem.title}</span>
                              </SidebarMenuSubButton>
                            )}
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
