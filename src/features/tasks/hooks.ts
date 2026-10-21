import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteTask, fetchTasks, postTask, putTask } from "./api";
import type { CreateTaskInput } from "./types";

export const tasksQueryKey = ["tasks"] as const;

export function useTasks() {
  return useQuery({ queryKey: tasksQueryKey, queryFn: fetchTasks });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksQueryKey }),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksQueryKey }),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateTaskInput }) => putTask(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksQueryKey }),
  });
}
