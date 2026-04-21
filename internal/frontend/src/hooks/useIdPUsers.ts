import { useState, useCallback } from "react";
import type { IdPUser, PaginatedResponse } from "../api/types";
import * as api from "../api/client";

export function useIdPUsers() {
  const [data, setData] = useState<
    (PaginatedResponse<IdPUser> & { nextPageToken?: string }) | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (first = 50, searchName?: string, after?: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.listIdPUsers(first, searchName, after);
        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const create = useCallback(
    async (input: { name: string; password: string }) => {
      await api.createIdPUser(input);
    },
    []
  );

  const update = useCallback(
    async (id: string, input: Record<string, unknown>) => {
      await api.updateIdPUser(id, input);
    },
    []
  );

  const remove = useCallback(async (id: string) => {
    await api.deleteIdPUser(id);
  }, []);

  return { data, loading, error, load, create, update, remove };
}
