import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signup } from "@/lib/api/auth";

export function useSignup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}
