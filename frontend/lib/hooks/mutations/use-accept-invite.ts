import { useMutation, useQueryClient } from "@tanstack/react-query";
import { acceptInvite } from "@/lib/api/auth";

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}
