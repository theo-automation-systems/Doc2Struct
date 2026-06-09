"use client";

import { AppShell } from "./AppShell";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  documentName?: string;
}

/** @deprecated Use AppShell directly. Kept for legacy pages. */
export function MainLayout({ children }: MainLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
