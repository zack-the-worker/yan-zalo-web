"use client";
import { useState, useEffect, useCallback } from "react";
import type { QuickMessage } from "@/types/chat";

interface UseQuickMessagesResult {
  templates: QuickMessage[];
  loading: boolean;
  addTemplate: (keyword: string, title: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useQuickMessages(): UseQuickMessagesResult {
  const [templates, setTemplates] = useState<QuickMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chat/quick-messages");
      const data = await res.json();
      if (res.ok) setTemplates(data.items ?? []);
    } catch {
      // ignore — best effort
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTemplate = useCallback(
    async (keyword: string, title: string) => {
      await fetch("/api/chat/quick-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, title }),
      });
      await refresh();
    },
    [refresh]
  );

  return { templates, loading, addTemplate, refresh };
}
