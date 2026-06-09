"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/shared/ThemeProvider";
import {
  FileScan, LayoutDashboard, Bell, BellOff, Sun, Moon, Mail, Check,
  Wifi, WifiOff, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEMO_PROFILE } from "@/lib/demo-profile";
import { notificationsEnabled, setNotificationsEnabled } from "@/lib/notifications-prefs";
import { useBackendStatus } from "@/lib/hooks/useBackendStatus";
import { Button } from "@/components/ui/button";

const COMPANY_EMAIL_KEY = "company_email";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/workspace", label: "Workspace" },
];

export function TopNav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { backendOnline, backendChecking } = useBackendStatus();
  const [mounted, setMounted] = useState(false);
  const [notifsOn, setNotifsOn] = useState(true);
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState<string>(DEMO_PROFILE.email);
  const [saved, setSaved] = useState(false);
  const emailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setNotifsOn(notificationsEnabled());
    setEmail(localStorage.getItem(COMPANY_EMAIL_KEY) ?? DEMO_PROFILE.email);
  }, []);

  useEffect(() => {
    if (!emailOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (emailRef.current && !emailRef.current.contains(e.target as Node)) {
        setEmailOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [emailOpen]);

  const toggleNotifs = () => {
    const next = !notifsOn;
    setNotifsOn(next);
    setNotificationsEnabled(next);
  };

  const saveEmail = () => {
    localStorage.setItem(COMPANY_EMAIL_KEY, email.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setTimeout(() => setEmailOpen(false), 600);
  };

  if (!mounted) {
    return (
      <header
        className="h-12 flex items-center gap-6 px-5 border-b border-border bg-background shrink-0 z-20"
        suppressHydrationWarning
      />
    );
  }

  return (
    <header
      className="h-12 flex items-center gap-6 px-5 border-b border-border bg-background shrink-0 z-20"
      suppressHydrationWarning
    >
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
          <FileScan className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-sm font-semibold text-foreground hidden sm:block">Doc2Struct</span>
      </Link>

      <nav className="flex items-center gap-1">
        {navLinks.map((link) => {
          const active = link.href === "/"
            ? pathname === "/"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {link.label === "Dashboard" && <LayoutDashboard className="w-3 h-3 inline mr-1.5 -mt-px" />}
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <div
          className={cn(
            "hidden sm:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border",
            backendChecking
              ? "text-muted-foreground border-border bg-muted/40"
              : backendOnline
              ? "text-emerald-600 border-emerald-500/20 bg-emerald-500/5"
              : "text-amber-600 border-amber-500/20 bg-amber-500/5"
          )}
          title={backendChecking ? "Checking connection" : backendOnline ? "Backend connected" : "Backend offline"}
        >
          {backendChecking ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : backendOnline ? (
            <Wifi className="w-3 h-3" />
          ) : (
            <WifiOff className="w-3 h-3" />
          )}
          <span>{backendChecking ? "…" : backendOnline ? "Connected" : "Offline"}</span>
        </div>

        <button
          onClick={toggleNotifs}
          title={notifsOn ? "Notifications on" : "Notifications off"}
          className={cn(
            "h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors",
            notifsOn ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {mounted && notifsOn ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </button>

        <button
          onClick={() => mounted && setTheme(theme === "dark" ? "light" : "dark")}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          suppressHydrationWarning
        >
          {mounted ? (theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />) : <Sun className="w-4 h-4 opacity-0" />}
        </button>

        <div ref={emailRef} className="relative hidden sm:block">
          <button
            onClick={() => setEmailOpen((o) => !o)}
            className="flex items-center gap-2 pl-2 pr-2 py-1 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
              <Mail className="w-3 h-3 text-primary" />
            </div>
            <span className="text-[11px] text-muted-foreground max-w-[120px] truncate">{email}</span>
          </button>

          {emailOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-50 w-72 p-3 rounded-xl border border-border bg-popover shadow-lg space-y-2.5">
              <div>
                <p className="text-xs font-semibold text-foreground">Notification email</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Alerts when analysis completes.
                </p>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@company.com"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                autoFocus
              />
              <Button onClick={saveEmail} size="sm" className="w-full gap-1.5 h-8">
                {saved ? <><Check className="w-3.5 h-3.5" /> Saved</> : "Save"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
