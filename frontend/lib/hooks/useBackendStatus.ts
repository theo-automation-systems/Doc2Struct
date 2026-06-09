"use client";

import { useState, useEffect, useCallback } from "react";
import { checkBackendHealth } from "@/lib/api";

export function useBackendStatus() {
  const [backendOnline, setBackendOnline] = useState(false);
  const [backendChecking, setBackendChecking] = useState(true);

  const refresh = useCallback(async () => {
    setBackendChecking(true);
    const online = await checkBackendHealth();
    setBackendOnline(online);
    setBackendChecking(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { backendOnline, backendChecking, refresh };
}
