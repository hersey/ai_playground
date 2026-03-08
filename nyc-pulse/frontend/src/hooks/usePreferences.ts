import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import type { UserPreferences } from "../types";

const DEFAULT_PREFS: UserPreferences = {
  interests: ["broadway", "comedy", "theater", "art"],
  neighborhoods: [],
  maxPrice: null,
  toddlerMode: false,
  filmMode: false,
  notificationsEnabled: false,
  showLotteryAlerts: ["colbert", "fallon", "snl"],
};

export function usePreferences() {
  const qc = useQueryClient();

  const { data: prefs = DEFAULT_PREFS, isLoading } = useQuery({
    queryKey: ["preferences"],
    queryFn: api.preferences.get,
    staleTime: Infinity,
  });

  const { mutate: savePrefs, isPending: isSaving } = useMutation({
    mutationFn: api.preferences.save,
    onSuccess: (updated) => {
      qc.setQueryData(["preferences"], updated);
    },
  });

  return { prefs, isLoading, savePrefs, isSaving };
}
