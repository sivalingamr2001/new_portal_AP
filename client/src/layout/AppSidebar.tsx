import { AnimatePresence, motion } from "framer-motion"
import * as React from "react"
import { Link, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuth } from "@/context/AuthContext"
import { sidebarItems } from "@/lib/config/sidebar-config"

export function AppSidebar() {
  const location = useLocation()
  const pathname = location.pathname
  const { currentUserRole } = useAuth()

  const [hoveredItemTo, setHoveredItemTo] = React.useState<string | null>(null)

  const visibleMenuGroups = React.useMemo(() => {
    if (!currentUserRole) return []

    return sidebarItems
      .map((group) => {
        const filteredItems = group.items.filter((item) =>
          item.roles.includes(currentUserRole)
        )
        return { ...group, items: filteredItems }
      })
      .filter((group) => group.items.length > 0)
  }, [currentUserRole])

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar collapsible="none" className="w-[48px]">
        <div className="flex h-10 items-center justify-center border-b">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-primary/5 font-black tracking-wider text-primary">
            <span className="animate-in text-base font-extrabold duration-300 select-none fade-in">
              B
            </span>
          </div>
        </div>

        <SidebarContent>
          <SidebarMenu onMouseLeave={() => setHoveredItemTo(null)}>
            {visibleMenuGroups.map((group) => (
              <SidebarGroup key={group.title} className="px-2">
                <SidebarGroupContent>
                  {group.items.map((item) => {
                    const isActive = pathname === item.to
                    const Icon = item.icon

                    const menuItemButton = (
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="relative bg-transparent text-muted-foreground transition-colors duration-200 hover:bg-transparent hover:text-foreground data-[active=true]:bg-transparent data-[active=true]:text-primary-foreground"
                      >
                        <Link
                          to={item.to}
                          className="z-10 flex w-full items-center justify-center"
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                        </Link>
                      </SidebarMenuButton>
                    )

                    return (
                      <SidebarMenuItem
                        key={item.to}
                        className="relative my-0.5"
                        onMouseEnter={() => setHoveredItemTo(item.to)}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeBackground"
                            className="absolute inset-0 rounded-md bg-primary"
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 30,
                            }}
                          />
                        )}

                        <AnimatePresence>
                          {hoveredItemTo === item.to && !isActive && (
                            <motion.div
                              layoutId="hoverBackground"
                              className="absolute inset-0 rounded-md bg-accent"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{
                                type: "spring",
                                stiffness: 350,
                                damping: 32,
                              }}
                            />
                          )}
                        </AnimatePresence>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-full">{menuItemButton}</div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            align="center"
                            className="font-medium"
                          >
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  )
}

export default AppSidebar
