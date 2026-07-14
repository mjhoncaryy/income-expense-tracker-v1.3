import type { DashboardPeriod, TransactionFilters, TransactionInput, TransactionType } from "@income-outcome/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import { queryKeys } from "../query-keys";

export function useSession() {
  return useQuery({ queryKey: queryKeys.session, queryFn: () => api.getSession(), staleTime: 60_000 });
}

export function useProfile() {
  return useQuery({ queryKey: queryKeys.profile, queryFn: () => api.getProfile(), staleTime: 60_000 });
}

export function useCategories(type?: TransactionType, includeArchived = false) {
  return useQuery({ queryKey: queryKeys.categories(type, includeArchived), queryFn: () => api.listCategories(type, includeArchived) });
}

export function useTransactions(filters: TransactionFilters) {
  return useQuery({ queryKey: queryKeys.transactions(filters), queryFn: () => api.listTransactions(filters) });
}

export function useDashboard(period: DashboardPeriod) {
  return useQuery({ queryKey: queryKeys.dashboard(period), queryFn: () => api.getDashboard(period) });
}

function useInvalidateFinancialData() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);
  };
}

export function useCreateTransaction() {
  const invalidate = useInvalidateFinancialData();
  return useMutation({ mutationFn: (input: TransactionInput) => api.createTransaction(input), onSuccess: invalidate });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidateFinancialData();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: TransactionInput }) => api.updateTransaction(id, input), onSuccess: invalidate });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateFinancialData();
  return useMutation({ mutationFn: (id: string) => api.deleteTransaction(id), onSuccess: invalidate });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, name }: { type: TransactionType; name: string }) => api.createCategory(type, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useRenameCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.renameCategory(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useArchiveCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.archiveCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}
