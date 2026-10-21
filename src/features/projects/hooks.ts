import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteProject, fetchProjects, postProject, putProject } from "./api";
import type { CreateProjectInput } from "./types";

export const projectsQueryKey = ["projects"] as const;

export function useProjects() {
  return useQuery({ queryKey: projectsQueryKey, queryFn: fetchProjects });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectsQueryKey }),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectsQueryKey }),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateProjectInput }) => putProject(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectsQueryKey }),
  });
}
