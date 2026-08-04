import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserRole } from "@/lib/api/users";

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: "admin" | "member" }) => updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
