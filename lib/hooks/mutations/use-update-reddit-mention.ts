import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateRedditMention, type UpdateRedditMentionPatch } from "@/lib/api/reddit";

export function useUpdateRedditMention() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateRedditMentionPatch }) => updateRedditMention(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reddit", "mentions"] });
    },
  });
}
