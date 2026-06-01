"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Zap,
  Layers,
  Download,
  BarChart3,
  Settings,
  ChevronDown,
  Plus,
  Sparkles,
  Bell,
  HelpCircle,
  LogOut,
  User,
  Building2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, badge: null },
  { href: "/documents", label: "Documents", icon: FileText, badge: "8" },
  { href: "/automations", label: "Automations", icon: Zap, badge: "6" },
  { href: "/extractions", label: "Extractions", icon: Layers, badge: null },
  { href: "/exports", label: "Exports", icon: Download, badge: null },
  { href: "/analytics", label: "Analytics", icon: BarChart3, badge: null },
];

const workspaces = [
  { id: "1", name: "DigitalFlow Ltd.", plan: "Pro", avatar: "DF" },
  { id: "2", name: "Personal Workspace", plan: "Free", avatar: "PW" },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState(workspaces[0]);

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

      {/* Workspace Selector */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-sidebar-border">
          <button
            onClick={() => setWorkspaceOpen(!workspaceOpen)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-sidebar-accent transition-colors group"
          >
            <div className="w-6 h-6 rounded bg-primary/30 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-primary">{currentWorkspace.avatar}</span>
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{currentWorkspace.name}</p>
              <p className="text-[10px] text-sidebar-foreground/40">{currentWorkspace.plan} Plan</p>
            </div>
            <ChevronDown className={cn("w-3.5 h-3.5 text-sidebar-foreground/40 transition-transform", workspaceOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {workspaceOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-1"
              >
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => { setCurrentWorkspace(ws); setWorkspaceOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-left",
                      currentWorkspace.id === ws.id ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
                    )}
                  >
                    <div className="w-6 h-6 rounded bg-sidebar-accent flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-sidebar-foreground/60">{ws.avatar}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-sidebar-foreground truncate">{ws.name}</p>
                      <p className="text-[10px] text-sidebar-foreground/40">{ws.plan}</p>
                    </div>
                    {currentWorkspace.id === ws.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    )}
                  </button>
                ))}
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors mt-1">
                  <div className="w-6 h-6 rounded border border-dashed border-sidebar-border flex items-center justify-center">
                    <Plus className="w-3 h-3 text-sidebar-foreground/40" />
                  </div>
                  <span className="text-xs text-sidebar-foreground/40">Add workspace</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

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
                  <>
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    {item.badge && (
                      <span className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                        isActive ? "bg-primary/20 text-primary" : "bg-sidebar-accent text-sidebar-foreground/50"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </>
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
            <button className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors group">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Upload Document</span>
            </button>
          </>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 py-3 border-t border-sidebar-border space-y-0.5">
        {!collapsed && (
          <>
            <button className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
              <Bell className="w-4 h-4" />
              <span className="text-sm font-medium flex-1 text-left">Notifications</span>
              <span className="w-2 h-2 rounded-full bg-primary" />
            </button>
            <button className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
              <HelpCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Help & Support</span>
            </button>
          </>
        )}

        <Link href="/settings">
          <div className={cn(
            "flex items-center gap-3 px-2.5 py-2 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors cursor-pointer",
            pathname === "/settings" && "bg-primary/15 text-primary"
          )}>
            <Settings className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Settings</span>}
          </div>
        </Link>

        {/* User Profile */}
        <div className="pt-2 mt-2 border-t border-sidebar-border">
          <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors group">
            <Avatar className="w-7 h-7 shrink-0">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">TH</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">Théo B.</p>
                <p className="text-[10px] text-sidebar-foreground/40 truncate">theo@digitalflow.io</p>
              </div>
            )}
            {!collapsed && <ChevronRight className="w-3 h-3 text-sidebar-foreground/30 group-hover:text-sidebar-foreground/60" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
