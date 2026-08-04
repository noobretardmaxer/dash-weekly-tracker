import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invite } from "@/lib/api/auth";

export function useInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: invite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
