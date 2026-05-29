// @/components/AppSidebar.tsx
"use client";

import * as React from "react";
import { useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    useSidebar,
} from "@/components/ui/sidebar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserRole } from "@/lib/constants";
import { sidebarItems } from "@/lib/config/sidebar-config";

// Resolve string roles to numbers to compare cleanly with the array config
const useAuth = () => {
    // Context returns string like "It", "Admin", etc.
    const { currentUserRole } = { currentUserRole: "It" }; // Replace with your actual context hook

    const roleKey = currentUserRole as keyof typeof UserRole;
    const numericRole = UserRole[roleKey] || UserRole.User;

    return { role: numericRole };
};

export function AppSidebar() {
    const location = useLocation();
    const pathname = location.pathname;

    const { state } = useSidebar();
    const { role: activeRoleNumber } = useAuth();
    const isCollapsed = state === "collapsed";

    // Track state using the target 'to' routing string
    const [hoveredItemTo, setHoveredItemTo] = React.useState<string | null>(null);

    // Filter structural groups and nested child links reactively
    const visibleMenuGroups = React.useMemo(() => {
        return sidebarItems
            .map((group) => {
                // Filter individual items within this group
                const filteredItems = group.items.filter((item) =>
                    item.roles.includes(activeRoleNumber)
                );
                return { ...group, items: filteredItems };
            })
            // Hide the entire group if it contains no visible items for this user
            .filter((group) => group.items.length > 0);
    }, [activeRoleNumber]);

    return (
        <TooltipProvider delayDuration={0}>
            <Sidebar collapsible="icon">
                <SidebarContent>
                    <SidebarMenu onMouseLeave={() => setHoveredItemTo(null)}>
                        {visibleMenuGroups.map((group) => (
                            <SidebarGroup key={group.title} className="px-2">
                                {/* Only show group text titles if sidebar is expanded */}
                                {!isCollapsed && (
                                    <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground/70">
                                        {group.title}
                                    </SidebarGroupLabel>
                                )}
                                <SidebarGroupContent>
                                    {group.items.map((item) => {
                                        const isActive = pathname === item.to;
                                        const Icon = item.icon;

                                        const menuItemButton = (
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive}
                                                className="relative bg-transparent hover:bg-transparent data-[active=true]:bg-transparent data-[active=true]:text-primary-foreground text-muted-foreground hover:text-foreground transition-colors duration-200"
                                            >
                                                <Link to={item.to} className="flex items-center w-full z-10">
                                                    <Icon className="h-4 w-4 shrink-0" />
                                                    <span className="ml-3 transition-opacity duration-200">
                                                        {item.label}
                                                    </span>
                                                </Link>
                                            </SidebarMenuButton>
                                        );

                                        return (
                                            <SidebarMenuItem
                                                key={item.to}
                                                className="relative my-0.5"
                                                onMouseEnter={() => setHoveredItemTo(item.to)}
                                            >
                                                {/* Active Highlight */}
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="activeBackground"
                                                        className="absolute inset-0 bg-primary rounded-md"
                                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                                    />
                                                )}

                                                {/* Hover Highlight */}
                                                <AnimatePresence>
                                                    {hoveredItemTo === item.to && !isActive && (
                                                        <motion.div
                                                            layoutId="hoverBackground"
                                                            className="absolute inset-0 bg-accent rounded-md"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            transition={{ type: "spring", stiffness: 350, damping: 32 }}
                                                        />
                                                    )}
                                                </AnimatePresence>

                                                {isCollapsed ? (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="w-full">{menuItemButton}</div>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="right" align="center" className="font-medium">
                                                            {item.label}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ) : (
                                                    menuItemButton
                                                )}
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarGroupContent>
                            </SidebarGroup>
                        ))}
                    </SidebarMenu>
                </SidebarContent>
            </Sidebar>
        </TooltipProvider>
    );
}

export default AppSidebar;
