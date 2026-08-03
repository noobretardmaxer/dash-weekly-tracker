import { useQuery } from "@tanstack/react-query";
import { getBlogPosts } from "@/lib/api/blog";

export function useBlogPosts(params: { sort?: string; category?: string; pageSize?: number; page?: number } = {}) {
  return useQuery({
    queryKey: ["blog", "posts", params.sort, params.category, params.pageSize, params.page],
    queryFn: () => getBlogPosts(params),
  });
}
