"use client";
import { useState, useEffect, useCallback } from "react";
import type { QuickMessage } from "@/types/chat";

interface UseQuickMessagesResult {
  templates: QuickMessage[];
  loading: boolean;
  addTemplate: (keyword: string, title: string) => Promise<void>;
  refresh: () => Promise<void>;
  addError: string | null;
}

export function useQuickMessages(): UseQuickMessagesResult {
  const [templates, setTemplates] = useState<QuickMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [addError, setAddError] = useState<string | null>(null);

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
      setAddError(null);
      const res = await fetch("/api/chat/quick-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, title }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error ?? "Lỗi không xác định";
        setAddError(msg);
        throw new Error(msg);
      }
      await refresh();
    },
    [refresh]
  );

  return { templates, loading, addTemplate, refresh, addError };
}
