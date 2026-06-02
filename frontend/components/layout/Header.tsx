"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Search, Bell, Sun, Moon, PanelRightOpen, PanelRightClose, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  subtitle?: string;
  aiPanelOpen: boolean;
  onToggleAIPanel: () => void;
  onToggleSidebar?: () => void;
}

export function Header({ title, subtitle, aiPanelOpen, onToggleAIPanel, onToggleSidebar }: HeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => setMounted(true), []);

  return (
    <header className="h-14 flex items-center gap-4 px-6 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground lg:hidden"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-foreground leading-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground leading-tight truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Center — Search */}
      <div className="flex-1 max-w-md mx-auto hidden md:block">
        <motion.div
          animate={{ scale: searchFocused ? 1.01 : 1 }}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
            searchFocused
              ? "border-primary/40 bg-background shadow-sm shadow-primary/5"
              : "border-border bg-muted/50"
          )}
        >
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search documents, extractions..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <div className="hidden sm:flex items-center gap-0.5 shrink-0">
            <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border font-mono">⌘</kbd>
            <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border font-mono">K</kbd>
          </div>
        </motion.div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          <Bell className="w-4 h-4" />
        </Button>

        {/* Theme toggle */}
        <button
          onClick={() => mounted && setTheme(isDark ? "light" : "dark")}
          className="relative h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground overflow-hidden"
          suppressHydrationWarning
        >
          <motion.div
            key={mounted ? (isDark ? "moon" : "sun") : "sun"}
            initial={{ y: -12, opacity: 0, rotate: -20 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {mounted ? (isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />) : <Sun className="w-4 h-4 opacity-0" />}
          </motion.div>
        </button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleAIPanel}
          className={cn(
            "h-8 px-2.5 gap-1.5 text-xs font-medium transition-all",
            aiPanelOpen
              ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {aiPanelOpen ? (
            <PanelRightClose className="w-3.5 h-3.5" />
          ) : (
            <PanelRightOpen className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">AI Panel</span>
        </Button>
      </div>
    </header>
  );
}
