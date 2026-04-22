import { useState, useCallback } from "react";
import type { UserProfile, PaginatedResponse } from "../api/types";
import * as api from "../api/client";

export function useUserProfiles() {
  const [data, setData] = useState<PaginatedResponse<UserProfile> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (page = 0, size = 50, searchField?: string, searchValue?: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.listUserProfiles(page, size, searchField, searchValue);
        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const create = useCallback(async (input: Record<string, unknown>) => {
    await api.createUserProfile(input);
  }, []);

  const update = useCallback(async (id: string, input: Record<string, unknown>) => {
    await api.updateUserProfile(id, input);
  }, []);

  const remove = useCallback(async (id: string) => {
    await api.deleteUserProfile(id);
  }, []);

  return { data, loading, error, load, create, update, remove };
}
