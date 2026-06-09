"use client";

import { AppShell } from "@/components/layout/AppShell";
import { DocumentWorkspace } from "@/components/workspace/DocumentWorkspace";

export default function WorkspacePage() {
  return (
    <AppShell>
      <DocumentWorkspace />
    </AppShell>
  );
}
