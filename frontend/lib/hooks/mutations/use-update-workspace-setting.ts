import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSetting } from "@/lib/api/settings";

export function useUpdateWorkspaceSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (value: string) => updateSetting("workspace.name", value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
