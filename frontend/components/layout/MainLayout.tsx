"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AIPanel } from "./AIPanel";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  documentName?: string;
}

export function MainLayout({ children, title, subtitle, documentName }: MainLayoutProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          title={title}
          subtitle={subtitle}
          aiPanelOpen={aiPanelOpen}
          onToggleAIPanel={() => setAiPanelOpen(!aiPanelOpen)}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>

      {/* AI Panel */}
      <AIPanel
        open={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
        documentName={documentName}
      />
    </div>
  );
}
