"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Download,
  Settings,
  Plus,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DEMO_PROFILE } from "@/lib/demo-profile";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workspace", label: "Workspace", icon: FileText },
  { href: "/exports", label: "Exports", icon: Download },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 relative z-20",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col"
          >
            <span className="text-sm font-semibold text-white leading-tight">Doc2Struct</span>
            <span className="text-[10px] text-sidebar-foreground/40 leading-tight">AI Document Platform</span>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/30 px-2.5 pb-2 pt-1">
            Navigation
          </p>
        )}
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: collapsed ? 0 : 2 }}
                className={cn(
                  "flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all duration-150 group relative",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full"
                  />
                )}
                <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "")} />
                {!collapsed && (
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                )}
              </motion.div>
            </Link>
          );
        })}

        {!collapsed && (
          <>
            <div className="pt-4 pb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/30 px-2.5">
                Quick Actions
              </p>
            </div>
            <Link href="/workspace?upload=1">
              <div className="flex items-center gap-3 px-2.5 py-2 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Upload Document</span>
              </div>
            </Link>
          </>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 py-3 border-t border-sidebar-border space-y-0.5">
        <Link href="/settings">
          <div className={cn(
            "flex items-center gap-3 px-2.5 py-2 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors cursor-pointer",
            pathname === "/settings" && "bg-primary/15 text-primary"
          )}>
            <Settings className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Settings</span>}
          </div>
        </Link>

        <div className="pt-2 mt-2 border-t border-sidebar-border">
          <Link href="/settings">
            <div className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors">
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                  {DEMO_PROFILE.initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-medium text-sidebar-foreground truncate">{DEMO_PROFILE.name}</p>
                  <p className="text-[10px] text-sidebar-foreground/40 truncate">{DEMO_PROFILE.email}</p>
                </div>
              )}
              {!collapsed && <ChevronRight className="w-3 h-3 text-sidebar-foreground/30" />}
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
}
